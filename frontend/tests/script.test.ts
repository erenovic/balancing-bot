
/**
 * @jest-environment jsdom
 */

import * as THREE from 'three';
import { ThreeJSApp } from '../src/script';

// Mock canvas element
const createMockCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.className = 'threejs';
  canvas.width = 800;
  canvas.height = 600;
  return canvas;
};

describe('ThreeJSApp', () => {
  let app: ThreeJSApp;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = '';
    canvas = createMockCanvas();
    document.body.appendChild(canvas);

    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 800,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 600,
    });

    app = new ThreeJSApp(canvas);
  });

  afterEach(() => {
    if (app) {
      app.dispose();
    }
  });

  describe('Initialization', () => {
    it('should create a ThreeJSApp instance', () => {
      expect(app).toBeInstanceOf(ThreeJSApp);
    });

    it('should initialize scene', () => {
      const scene = app.getScene();
      expect(scene).toBeInstanceOf(THREE.Scene);
    });

    it('should initialize camera with correct aspect ratio', () => {
      const camera = app.getCamera();
      expect(camera).toBeInstanceOf(THREE.PerspectiveCamera);
      expect(camera.aspect).toBe(800 / 600);
      expect(camera.fov).toBe(35);
    });

    it('should initialize renderer', () => {
      const renderer = app.getRenderer();
      expect(renderer).toBeInstanceOf(THREE.WebGLRenderer);
    });

    it('should add objects to scene', () => {
      const scene = app.getScene();
      expect(scene.children.length).toBeGreaterThan(0);
      
      // Should have at least a cube and axes helper
      const meshes = scene.children.filter(child => child instanceof THREE.Mesh);
      const helpers = scene.children.filter(child => child instanceof THREE.AxesHelper);
      
      expect(meshes.length).toBeGreaterThanOrEqual(1);
      expect(helpers.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Scene Objects', () => {
    it('should have a red cube in the scene', () => {
      const scene = app.getScene();
      const cube = scene.children.find(child => 
        child instanceof THREE.Mesh && 
        child.geometry instanceof THREE.BoxGeometry
      ) as THREE.Mesh;

      expect(cube).toBeDefined();
      expect(cube.geometry).toBeInstanceOf(THREE.BoxGeometry);
      
      if (cube.material instanceof THREE.MeshBasicMaterial) {
        expect(cube.material.color.getHex()).toBe(0xff0000); // red
      }
    });

    it('should have axes helper in the scene', () => {
      const scene = app.getScene();
      const axesHelper = scene.children.find(child => 
        child instanceof THREE.AxesHelper
      );

      expect(axesHelper).toBeDefined();
      expect(axesHelper).toBeInstanceOf(THREE.AxesHelper);
    });
  });

  describe('Camera Operations', () => {
    it('should update camera aspect ratio on resize', () => {
      const camera = app.getCamera();
      
      // Change window dimensions
      Object.defineProperty(window, 'innerWidth', { value: 1200 });
      Object.defineProperty(window, 'innerHeight', { value: 800 });
      
      // Trigger resize event
      window.dispatchEvent(new Event('resize'));
      
      expect(camera.aspect).toBe(1200 / 800);
    });
  });

  describe('Resource Management', () => {
    it('should dispose resources properly', () => {
      const scene = app.getScene();
      const cube = scene.children.find(child => 
        child instanceof THREE.Mesh && 
        child.geometry instanceof THREE.BoxGeometry
      ) as THREE.Mesh;

      expect(cube).toBeDefined();
      
      // Spy on dispose methods
      const geometryDisposeSpy = jest.spyOn(cube.geometry, 'dispose');
      const rendererDisposeSpy = jest.spyOn(app.getRenderer(), 'dispose');

      app.dispose();

      expect(geometryDisposeSpy).toHaveBeenCalled();
      expect(rendererDisposeSpy).toHaveBeenCalled();
    });
  });
});

describe('DOM Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should throw error when canvas is not found', () => {
    expect(() => {
      new ThreeJSApp(null as any);
    }).toThrow();
  });

  it('should find canvas with correct class', () => {
    const canvas = createMockCanvas();
    document.body.appendChild(canvas);

    expect(() => {
      new ThreeJSApp(canvas);
    }).not.toThrow();
  });
});
