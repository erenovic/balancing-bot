import * as THREE from 'three';
import * as SPLAT from "gsplat";
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import { degreesToRadians, clamp, lerp, random } from './utils/math';

/**
 * Main application class for the Three.js scene
 */
export class ThreeJSApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: TrackballControls;
  private cube: THREE.Mesh;

  constructor(canvas: HTMLCanvasElement) {
    // Initialize the scene
    this.scene = new THREE.Scene();

    // Initialize the camera
    this.camera = new THREE.PerspectiveCamera(
      35,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    this.camera.position.z = 5;

    // Initialize the renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    const maxPixelRatio = Math.max(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(maxPixelRatio);

    // Initialize the controls
    this.controls = new TrackballControls(this.camera, canvas);
    this.controls.dynamicDampingFactor = 0.05;

    // Create initial objects
    this.createCube();
    this.addAxesHelper();

    // Setup event listeners
    this.setupEventListeners();

    // Start the render loop
    this.animate();
  }

  /**
   * Create a cube and add it to the scene
   */
  private createCube(): void {
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshBasicMaterial({ color: 'red' });
    this.cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    this.scene.add(this.cube);
  }

  /**
   * Add axes helper to the scene
   */
  private addAxesHelper(): void {
    const axesHelper = new THREE.AxesHelper(2);
    this.scene.add(axesHelper);
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  /**
   * Handle window resize
   */
  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Animation loop
   */
  private animate(): void {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    window.requestAnimationFrame(this.animate.bind(this));
  }

  /**
   * Get the current scene
   */
  public getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Get the current camera
   */
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Get the renderer
   */
  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.controls.dispose();
    this.renderer.dispose();
    this.cube.geometry.dispose();
    if (this.cube.material instanceof THREE.Material) {
      this.cube.material.dispose();
    }
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.querySelector('canvas.threejs') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Canvas element with class "threejs" not found');
  }

  new ThreeJSApp(canvas);
});