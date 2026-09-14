import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import type { TerminalGraphics } from "./TerminalGraphics";
import type { Renderer } from "./Renderer";
import { screenFrag } from "../shaders/screen.js";
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
        uBandStrength: { value: 0.35 },
        uNoiseStrength: { value: 0.008 },
        uNoiseSpeed: { value: 0.1 },
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

  resize(width: number, height: number): void {
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
    this.screenMaterial.uniforms.uMaskPitch!.value = maskPitch();
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  render(graphics: TerminalGraphics): void {
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
    this.screenMaterial.uniforms.uTime!.value = performance.now() / 1000;
    this.composer.render();
  }
}
