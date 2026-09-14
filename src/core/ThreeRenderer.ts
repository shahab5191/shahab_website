import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import type { TerminalGraphics } from "./TerminalGraphics";
import type { Renderer } from "./Renderer";
import { screenFrag } from "../shaders/screen.js";
import { phosphorVert, phosphorFrag } from "../shaders/phosphor.js";
import { getTheme } from "./theme.js";

/** Aperture grille period, in CSS pixels per RGB triad. */
const MASK_PITCH_CSS_PX = 3.0;

/**
 * The grille period in device pixels. Phosphor pitch is fixed on the glass, so
 * it is tied to the display rather than to the source resolution.
 */
function maskPitch(): number {
  return MASK_PITCH_CSS_PX * (window.devicePixelRatio || 1);
}

/**
 * WebGL presentation layer: renders the VRAM (TerminalGraphics) as the screen
 * of a 3D CRT monitor. A `CanvasTexture` uploads the off-screen canvas onto a
 * plane mesh, sitting in front of a simple box body with a perspective camera.
 *
 * Post-processing runs through an `EffectComposer`: `RenderPass` renders the
 * scene into a float target, `UnrealBloomPass` extracts bright pixels and adds
 * phosphor glow, and `OutputPass` tone-maps into sRGB for the screen.
 */
export class ThreeRenderer implements Renderer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private texture: THREE.CanvasTexture;
  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private verticalStretchFactor: number = 1.5;
  private screenMaterial!: THREE.ShaderMaterial;
  private screen!: THREE.Mesh;

  // Phosphor persistence: ping-pong accumulation of the raw VRAM texture,
  // applied before the CRT effects in the screen shader.
  private accumWrite!: THREE.WebGLRenderTarget;
  private accumRead!: THREE.WebGLRenderTarget;
  private phosphorMaterial: THREE.ShaderMaterial;
  private phosphorQuad: FullScreenQuad;
  private phosphorReady = false;

  // Mouse parallax + right-drag zoom state.
  private mouseX = 0;
  private mouseY = 0;
  private isLeftDragging = false;
  private isRightDragging = false;
  private lastMouseY = 0;
  private zoomTarget = 3;
  private smoothZoom = 3;
  private smoothLookX = 0;
  private smoothLookY = 0;
  private smoothCamX = 0;
  private smoothCamY = 0;
  private lastTime = performance.now();

  private onMouseMove = (e: MouseEvent): void => {
    this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouseY = 1 - (e.clientY / window.innerHeight) * 2;
    if (this.isRightDragging) {
      this.zoomTarget += (e.clientY - this.lastMouseY) * 0.01;
    }
    this.lastMouseY = e.clientY;
  };

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button === 0) this.isLeftDragging = true;
    if (e.button === 2) {
      this.isRightDragging = true;
      this.lastMouseY = e.clientY;
    }
  };

  private onMouseUp = (e: MouseEvent): void => {
    if (e.button === 0) this.isLeftDragging = false;
    if (e.button === 2) this.isRightDragging = false;
  };

  private onContextMenu = (e: Event): void => {
    e.preventDefault();
  };

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: "high-performance",
    });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050505);

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    this.camera.position.set(0, 0, 3);
    this.camera.lookAt(0, 0, 0);

    // No mipmaps: the shader snaps UVs, so mip selection from their
    // derivatives seams at every texel boundary.
    this.texture = new THREE.CanvasTexture(document.createElement("canvas"));
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.generateMipmaps = false;

    this.phosphorMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uDecay: { value: new THREE.Vector3(0.7, 0.77, 0.55) },
        tPrev: { value: null },
        tCurr: { value: this.texture },
      },
      vertexShader: phosphorVert,
      fragmentShader: phosphorFrag,
      depthTest: false,
      depthWrite: false,
    });
    this.phosphorQuad = new FullScreenQuad(this.phosphorMaterial);

    this.buildScene();

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      getTheme().bloomFactor, // strength
      1, // radius
      0.2, // threshold
    );
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());

    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mouseup", this.onMouseUp);
    window.addEventListener("contextmenu", this.onContextMenu);
    window.addEventListener("blur", () => {
      this.isLeftDragging = false;
      this.isRightDragging = false;
    });
  }

  private buildScene(): void {
    // Monitor body: a simple box the screen plane is mounted on.
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 3.0, 0.5),
      new THREE.MeshStandardMaterial({
        color: 0x1a1a90,
        roughness: 0.6,
        metalness: 0.4,
      }),
    );
    this.scene.add(body);

    this.buildScreen();

    // Simple lighting so the box reads as a 3D volume.
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const key = new THREE.DirectionalLight(0xffffff, 3);
    key.position.set(2, 3, 5);
    this.scene.add(key);
  }

  private buildScreen(): void {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: this.texture },
        uTime: { value: 0 },
        uDistortion: { value: 0.05 },
        uChromaticAberration: { value: 0.0 },
        uVignette: { value: 1.0 },
        uVignetteDimFactor: { value: 0.9 },
        scanlineCount: { value: 0.0 },
        scanlineDimFactor: { value: 1.0 },
        screenWidth: { value: this.texture.image!.width },
        uAspect: { value: 1.0 },
        uMaskPitch: { value: maskPitch() },
        uMaskStrength: { value: 0.7 },
        uBandSpeed: { value: 0.06 },
        uBandHeight: { value: 0.14 },
        uBandStrength: { value: 0.4 },
        uNoiseStrength: { value: 0.008 },
        uNoiseSpeed: { value: 0.1 },
        uGlitchRate: { value: 5.0 },
        uGlitchChance: { value: 0.1 },
        uGlitchStrength: { value: 0.005 },
      },
      vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
      `,
      fragmentShader: screenFrag,
    });
    this.screenMaterial = material;
    const planeWidth = 3.6;
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(planeWidth, planeWidth),
      material,
    );
    screen.position.z = 0.26;
    this.scene.add(screen);
    this.screen = screen;
  }

  setBloomFactor(factor: number): void {
    this.bloomPass.strength = factor;
  }

  /**
   * Smoothly steer the camera from the mouse. While the left button is held,
   * the look-at target tracks the cursor quickly (the "eyes" pan) and the
   * camera position drifts toward the same side far more slowly (the "head"
   * follows). Releasing returns the view to center.
   */
  private updateCamera(dt: number): void {
    const lookSpeed = 10;
    const camSpeed = 2;
    const zoomSpeed = 12;
    const lookExtentX = 0.8;
    const lookExtentY = 0.5;
    const camExtentX = 0.3;
    const camExtentY = 0.18;

    const lookTargetX = this.isLeftDragging ? this.mouseX * lookExtentX : 0;
    const lookTargetY = this.isLeftDragging ? this.mouseY * lookExtentY : 0;
    const camTargetX = this.isLeftDragging ? this.mouseX * camExtentX : 0;
    const camTargetY = this.isLeftDragging ? this.mouseY * camExtentY : 0;

    this.smoothLookX +=
      (lookTargetX - this.smoothLookX) * (1 - Math.exp(-dt * lookSpeed));
    this.smoothLookY +=
      (lookTargetY - this.smoothLookY) * (1 - Math.exp(-dt * lookSpeed));
    this.smoothCamX +=
      (camTargetX - this.smoothCamX) * (1 - Math.exp(-dt * camSpeed));
    this.smoothCamY +=
      (camTargetY - this.smoothCamY) * (1 - Math.exp(-dt * camSpeed));

    const minZoom = 2.2;
    const maxZoom = 6;
    this.zoomTarget = Math.min(maxZoom, Math.max(minZoom, this.zoomTarget));
    this.smoothZoom +=
      (this.zoomTarget - this.smoothZoom) * (1 - Math.exp(-dt * zoomSpeed));

    this.camera.position.set(this.smoothCamX, this.smoothCamY, this.smoothZoom);
    this.camera.lookAt(this.smoothLookX, this.smoothLookY, 0);
  }

  resize(width: number, height: number): void {
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
    this.screenMaterial.uniforms.uMaskPitch!.value = maskPitch();
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /** Lazily create and clear the ping-pong accumulation targets at VRAM size. */
  private ensurePhosphorTargets(width: number, height: number): void {
    if (this.phosphorReady) return;
    this.accumWrite = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      type: THREE.HalfFloatType,
      depthBuffer: false,
    });
    this.accumRead = this.accumWrite.clone();
    this.renderer.setRenderTarget(this.accumWrite);
    this.renderer.clear();
    this.renderer.setRenderTarget(this.accumRead);
    this.renderer.clear();
    this.renderer.setRenderTarget(null);
    this.phosphorReady = true;
  }

  /**
   * Composite the current VRAM frame onto the decaying previous frame, storing
   * the result back for next frame and feeding it to the screen shader.
   */
  private updatePhosphor(): void {
    this.phosphorMaterial.uniforms.tCurr!.value = this.texture;
    this.phosphorMaterial.uniforms.tPrev!.value = this.accumRead.texture;
    this.renderer.setRenderTarget(this.accumWrite);
    this.phosphorQuad.render(this.renderer);
    this.renderer.setRenderTarget(null);
    this.screenMaterial.uniforms.tDiffuse!.value = this.accumWrite.texture;
    const tmp = this.accumWrite;
    this.accumWrite = this.accumRead;
    this.accumRead = tmp;
  }

  render(graphics: TerminalGraphics): void {
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.updateCamera(dt);

    this.screenMaterial.uniforms.scanlineCount!.value = graphics.height;
    const screenAspect = graphics.width / graphics.height;
    this.screen.scale.y = this.verticalStretchFactor / screenAspect;
    this.screenMaterial.uniforms.uAspect!.value =
      screenAspect / this.verticalStretchFactor;
    this.screenMaterial.uniforms.screenWidth!.value = graphics.width;
    if (graphics.consumeDirty()) {
      this.texture.image = graphics.getCanvas();
      this.texture.needsUpdate = true;
    }
    this.ensurePhosphorTargets(graphics.width, graphics.height);
    this.updatePhosphor();
    this.screenMaterial.uniforms.uTime!.value = now / 1000;
    this.composer.render();
  }
}
