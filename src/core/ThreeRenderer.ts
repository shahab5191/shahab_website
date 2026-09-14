import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import type { TerminalGraphics } from "./TerminalGraphics";
import type { Renderer } from "./Renderer";
import { screenFrag } from "../shaders/screen.js";

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
  private screenHeight: number = 0.0;
  private screenWidth: number = 0.0;
  private screenAspect: number = 0.0;
  private verticalStretchFactor: number = 1.5;

  constructor(canvas: HTMLCanvasElement) {
    this.screenHeight = canvas.height;
    this.screenWidth = canvas.width;
    this.screenAspect = this.screenWidth / this.screenHeight;
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

    this.texture = new THREE.CanvasTexture(document.createElement("canvas"));
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.generateMipmaps = false;

    this.buildScene();

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      0.15, // strength
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
        uDistortion: { value: 0.0 },
        uChromaticAberration: { value: 0.0 },
        uVignette: { value: 0.0 },
        scanlineHeight: {
          value: this.screenHeight * this.verticalStretchFactor,
        },
        scanlineDimFactor: { value: 0.75 },
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
    const planeWidth = 3.6;
    const planeHeight =
      (planeWidth / this.screenAspect) * this.verticalStretchFactor;
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(planeWidth, planeHeight),
      material,
    );
    screen.position.z = 0.26;
    this.scene.add(screen);
  }

  resize(width: number, height: number): void {
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  render(graphics: TerminalGraphics): void {
    this.texture.image = graphics.getCanvas();
    this.texture.needsUpdate = true;
    this.composer.render();
  }
}
