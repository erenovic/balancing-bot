import * as THREE from "three";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js";

interface CartPoleState {
	x: number;
	xDot: number;
	theta: number;
	thetaDot: number;
}

class CartPoleVisual {
	private readonly root: THREE.Group;
	private readonly polePivot: THREE.Group;
	private readonly trackHalfLength: number;

  private readonly cartWidth = 0.6;
  private readonly cartHeight = 0.25;
  private readonly cartDepth = 0.4;
  private readonly railThickness = 0.05;

	constructor(scene: THREE.Scene, options: { trackLength: number; poleLength: number }) {
		this.root = new THREE.Group();
		this.trackHalfLength = options.trackLength / 2;

		// Rail spanning the track
		const railGeometry = new THREE.BoxGeometry(options.trackLength, this.railThickness, this.cartDepth * 1.2);
		const railMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
		const railMesh = new THREE.Mesh(railGeometry, railMaterial);
		railMesh.position.y = -this.cartHeight * 0.5 - this.railThickness * 0.5;
		railMesh.receiveShadow = true;
		this.root.add(railMesh);

		// Cart body
		const cartGeometry = new THREE.BoxGeometry(this.cartWidth, this.cartHeight, this.cartDepth);
		const cartMaterial = new THREE.MeshStandardMaterial({ color: 0x1976d2 });
		const cartMesh = new THREE.Mesh(cartGeometry, cartMaterial);
		cartMesh.castShadow = true;
		this.root.add(cartMesh);

		// Pole pivot is placed at the top center of the cart
		this.polePivot = new THREE.Group();
		this.polePivot.position.y = this.cartHeight * 0.5;
		this.root.add(this.polePivot);

		const poleGeometry = new THREE.BoxGeometry(0.05, options.poleLength, 0.05);
		const poleMaterial = new THREE.MeshStandardMaterial({ color: 0xffa000 });
		const poleMesh = new THREE.Mesh(poleGeometry, poleMaterial);
		poleMesh.castShadow = true;
		poleMesh.position.y = options.poleLength * 0.5;
		this.polePivot.add(poleMesh);

		// Wheels for a bit of depth perception
		const wheelGeometry = new THREE.CylinderGeometry(0.08, 0.08, this.cartWidth * 0.9, 32);
		const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
		const wheelOffsets = [-this.cartDepth * 0.5, this.cartDepth * 0.5];
		for (const z of wheelOffsets) {
			const leftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
			leftWheel.rotation.z = Math.PI / 2;
			leftWheel.position.set(-this.cartWidth * 0.25, -this.cartHeight * 0.5 - 0.05, z);
			leftWheel.castShadow = true;
			this.root.add(leftWheel);

			const rightWheel = leftWheel.clone();
			rightWheel.position.x = this.cartWidth * 0.25;
			this.root.add(rightWheel);
		}

		scene.add(this.root);
	}

	public update(state: CartPoleState): void {
		this.root.position.x = THREE.MathUtils.clamp(state.x, -this.trackHalfLength, this.trackHalfLength);
		this.polePivot.rotation.z = -state.theta;
	}
}

class CartPoleSimulator {
	private readonly state: CartPoleState = { x: 0, xDot: 0, theta: 0.15, thetaDot: 0 };
	private readonly gravity = 9.81;
	private readonly massCart = 1.0;
	private readonly massPole = 0.1;
	private readonly poleLength = 0.5;
	private readonly maxTrackPosition = 1.2;

	public step(dt: number): CartPoleState {
		const { xDot, theta, thetaDot } = this.state;

		const force = this.controllerForce();
		const totalMass = this.massCart + this.massPole;
		const poleMassLength = this.massPole * this.poleLength;
		const sinTheta = Math.sin(theta);
		const cosTheta = Math.cos(theta);
		const temp = (force + poleMassLength * thetaDot * thetaDot * sinTheta) / totalMass;
		const thetaAccNumerator = this.gravity * sinTheta - cosTheta * temp;
		const thetaAccDenominator = this.poleLength * (4 / 3 - (this.massPole * cosTheta * cosTheta) / totalMass);
		const thetaAcc = thetaAccNumerator / thetaAccDenominator;
		const xAcc = temp - (poleMassLength * thetaAcc * cosTheta) / totalMass;

		this.state.x += xDot * dt;
		this.state.xDot += xAcc * dt;
		this.state.theta += thetaDot * dt;
		this.state.thetaDot += thetaAcc * dt;

		// Keep the cart within the track visually
		if (this.state.x > this.maxTrackPosition) {
			this.state.x = this.maxTrackPosition;
			this.state.xDot *= -0.4;
		}
		if (this.state.x < -this.maxTrackPosition) {
			this.state.x = -this.maxTrackPosition;
			this.state.xDot *= -0.4;
		}

		return { ...this.state };
	}

	public getState(): CartPoleState {
		return { ...this.state };
	}

	public setExternalState(state: CartPoleState): void {
		Object.assign(this.state, state);
	}

	private controllerForce(): number {
		// Simple stabilising controller so the visual stays interesting
		const kpTheta = 120;
		const kdTheta = 25;
		const kpX = 30;
		const kdX = 10;
		const force = -kpTheta * this.state.theta - kdTheta * this.state.thetaDot - kpX * this.state.x - kdX * this.state.xDot;
		return THREE.MathUtils.clamp(force, -10, 10);
	}
}

export class ThreeJSApp {
	private readonly scene: THREE.Scene;
	private readonly camera: THREE.PerspectiveCamera;
	private readonly renderer: THREE.WebGLRenderer;
	private readonly controls: TrackballControls;
	private readonly clock: THREE.Clock = new THREE.Clock();
	private readonly cartPoleVisual: CartPoleVisual;
	private readonly simulator: CartPoleSimulator;

	constructor(canvas: HTMLCanvasElement) {
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0xf1f3f6);

		this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
		this.camera.position.set(3, 2, 4);
		this.camera.lookAt(new THREE.Vector3(0, 0.5, 0));

		this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
		this.renderer.shadowMap.enabled = true;
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

		this.controls = new TrackballControls(this.camera, canvas);
		this.controls.dynamicDampingFactor = 0.05;
		this.controls.rotateSpeed = 3;

		this.addLights();
		this.addGround();
		this.addFog();
		this.scene.add(new THREE.AxesHelper(1.5));

		this.simulator = new CartPoleSimulator();
		this.cartPoleVisual = new CartPoleVisual(this.scene, { trackLength: 2.4, poleLength: 1.0 });

		this.setupEventListeners();
		this.animate();
	}

	private addLights(): void {
		const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
		hemiLight.position.set(0, 1, 0);
		this.scene.add(hemiLight);

		const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
		dirLight.position.set(2, 4, 2);
		dirLight.castShadow = true;
		dirLight.shadow.mapSize.set(1024, 1024);
		dirLight.shadow.camera.left = -3;
		dirLight.shadow.camera.right = 3;
		dirLight.shadow.camera.top = 3;
		dirLight.shadow.camera.bottom = -3;
		this.scene.add(dirLight);
	}

	private addGround(): void {
		const groundGeometry = new THREE.PlaneGeometry(20, 20);
		const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xe0e0e0 });
		const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
		groundMesh.rotation.x = -Math.PI / 2;
		groundMesh.position.y = -0.18;
		groundMesh.receiveShadow = true;
		this.scene.add(groundMesh);

		const gridHelper = new THREE.GridHelper(20, 40, 0x888888, 0xdddddd);
		gridHelper.position.y = -0.179;
		this.scene.add(gridHelper);
	}

  private addFog(): void {
    this.scene.fog = new THREE.Fog(0xf1f3f6, 1, 15);
  }

	private setupEventListeners(): void {
		window.addEventListener("resize", this.onWindowResize);
	}

	private onWindowResize = (): void => {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	};

	private animate = (): void => {
		const delta = this.clock.getDelta();
		const state = this.simulator.step(delta);
		this.cartPoleVisual.update(state);

		this.controls.update();
		this.renderer.render(this.scene, this.camera);
		window.requestAnimationFrame(this.animate);
	};

	public getRenderer(): THREE.WebGLRenderer {
		return this.renderer;
	}

	public dispose(): void {
		this.controls.dispose();
		this.renderer.dispose();
	}
}

document.addEventListener("DOMContentLoaded", () => {
	const canvas = document.querySelector("canvas.threejs") as HTMLCanvasElement | null;
	if (!canvas) {
		throw new Error('Canvas element with class "threejs" not found');
	}

	// eslint-disable-next-line no-new
	new ThreeJSApp(canvas);
});
