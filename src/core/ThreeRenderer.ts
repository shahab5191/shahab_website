import * as THREE from "three";
import type { TerminalGraphics } from "./TerminalGraphics";
import type { Renderer } from "./Renderer";

/**
 * WebGL presentation layer: renders the VRAM (TerminalGraphics) as the screen
 * of a 3D CRT monitor. A `CanvasTexture` uploads the off-screen canvas onto a
 * plane mesh, sitting in front of a simple box body with a perspective camera.
 *
 * Later milestones bolt on the CRT shader (curvature, scanlines, chromatic
 * aberration), `EffectComposer` bloom, and the camera push-in for the UI
 * transition.
 */
export class ThreeRenderer implements Renderer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private texture: THREE.CanvasTexture;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: "high-performance",
    });

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050505);

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    this.camera.position.set(0, 0, 5);
    this.camera.lookAt(0, 0, 0);

    this.texture = new THREE.CanvasTexture(document.createElement("canvas"));
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.generateMipmaps = false;

    this.buildScene();
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

    // Screen plane: sits on the front face of the box and receives the VRAM.
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 2.0),
      new THREE.MeshBasicMaterial({ map: this.texture }),
    );
    screen.position.z = 0.26;
    this.scene.add(screen);

    // Simple lighting so the box reads as a 3D volume.
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const key = new THREE.DirectionalLight(0xffffff, 3);
    key.position.set(2, 3, 5);
    this.scene.add(key);
  }

  resize(width: number, height: number): void {
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  render(graphics: TerminalGraphics): void {
    this.texture.image = graphics.getCanvas();
    this.texture.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
  }
}
