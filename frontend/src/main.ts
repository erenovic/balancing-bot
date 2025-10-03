import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as ort from "onnxruntime-web";
import config from "./config";
import type { SimulationConfig } from "./config";
import { createAGrid } from "./utils";
import { Pane } from "tweakpane";

interface CartPoleState {
	x: number;          // Cart position
	xDot: number;       // Cart velocity
	theta: number;      // Pole angle
	thetaDot: number;   // Pole velocity at tip
}

interface ThreeJSAppOptions {
	modelUrl?: string;
	ortWasmBaseUrl?: string;
	manualPushStrength?: number;
}

class CartPoleVisual {
	private readonly root: THREE.Group;
	private readonly polePivot: THREE.Group;
	private readonly cartMesh: THREE.Mesh;
	private trackHalfLength: number;
	private readonly pushIndicator: THREE.ArrowHelper;
	private readonly pushDirectionVector: THREE.Vector3 = new THREE.Vector3();
	private readonly pushOffset: THREE.Vector3 = new THREE.Vector3();
	private readonly poleTipWorld: THREE.Vector3 = new THREE.Vector3();
	private readonly poleMesh: THREE.Mesh;
	private readonly basePoleLength: number;
	private pushIndicatorTimer = 0;
	private pushIndicatorDirection = 0;

	private readonly cartWidth: number;
	private readonly cartHeight: number;
	private readonly cartDepth: number;
	private readonly railThickness: number;
	private readonly trackLength: number;
	private poleLength: number;
	private readonly pushIndicatorDuration: number;
	private readonly pushIndicatorLength: number;
	private readonly pushIndicatorHeadLength: number;
	private readonly pushIndicatorHeadWidth: number;

	constructor(scene: THREE.Scene, simulation: SimulationConfig) {
		this.root = new THREE.Group();
		this.cartWidth = simulation.dimensions.cart.width;
		this.cartHeight = simulation.dimensions.cart.height;
		this.cartDepth = simulation.dimensions.cart.depth;
		this.railThickness = simulation.dimensions.railThickness;
		this.trackLength = simulation.dimensions.trackLength;
		this.poleLength = simulation.dimensions.pole.length;
		this.pushIndicatorDuration = simulation.indicators.pushDurationSeconds;
		this.pushIndicatorLength = simulation.indicators.pushLength;
		this.pushIndicatorHeadLength = simulation.indicators.pushHeadLength;
		this.pushIndicatorHeadWidth = simulation.indicators.pushHeadWidth;
		this.trackHalfLength = this.trackLength / 2;
		this.basePoleLength = simulation.dimensions.pole.length;

		// Rail spanning the track
		const railGeometry = new THREE.BoxGeometry(this.trackLength + this.cartWidth, this.railThickness, this.cartDepth * 1.2);
		const railMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
		const railMesh = new THREE.Mesh(railGeometry, railMaterial);
		railMesh.position.y = -this.cartHeight * 0.5 - this.railThickness * 0.5;
		railMesh.receiveShadow = true;
		scene.add(railMesh);

		// Cart body moving on the track
		const cartGeometry = new THREE.BoxGeometry(this.cartWidth, this.cartHeight, this.cartDepth);
		const cartMaterial = new THREE.MeshStandardMaterial({ color: 0x1976d2 });
		const cartMesh = new THREE.Mesh(cartGeometry, cartMaterial);
		cartMesh.castShadow = true;
		this.cartMesh = cartMesh;
		this.root.add(cartMesh);

		// Pole pivot is placed at the top center of the cart
		this.polePivot = new THREE.Group();
		this.polePivot.position.y = this.cartHeight * 0.5;
		this.root.add(this.polePivot);

		const poleGeometry = new THREE.BoxGeometry(simulation.dimensions.pole.thickness, this.poleLength, simulation.dimensions.pole.thickness);
		const poleMaterial = new THREE.MeshStandardMaterial({ color: 0xffa000 });
		const poleMesh = new THREE.Mesh(poleGeometry, poleMaterial);
		poleMesh.castShadow = true;
		poleMesh.position.y = this.poleLength * 0.5;
		this.polePivot.add(poleMesh);
		this.poleMesh = poleMesh;

		scene.add(this.root);

		this.pushIndicator = new THREE.ArrowHelper(
			new THREE.Vector3(1, 0, 0),
			new THREE.Vector3(0, 0, 0),
			this.pushIndicatorLength,
			0xff3b30,
			this.pushIndicatorHeadLength,
			this.pushIndicatorHeadWidth,
		);
		this.pushIndicator.visible = false;
		scene.add(this.pushIndicator);
	}

	public update(state: CartPoleState, delta: number): void {
		this.root.position.x = THREE.MathUtils.clamp(state.x, -this.trackHalfLength, this.trackHalfLength);
		this.polePivot.rotation.z = -state.theta;
		this.updatePushIndicator(delta);
	}

	public getCartPosition(target: THREE.Vector3): THREE.Vector3 {
		return this.cartMesh.getWorldPosition(target);
	}

	public showPushIndicator(direction: number, strength: number = 1.0): void {
		const directionSign = Math.sign(direction);
		if (directionSign === 0) {
			return;
		}

		const clampedStrength = THREE.MathUtils.clamp(strength, 0.25, 5);
		const scaledLength = THREE.MathUtils.clamp(
			this.pushIndicatorLength * clampedStrength,
			this.pushIndicatorLength * 0.6,
			this.pushIndicatorLength * 1.8,
		);
		this.pushIndicator.setLength(scaledLength, this.pushIndicatorHeadLength, this.pushIndicatorHeadWidth);
		this.pushIndicatorDirection = directionSign;
		this.pushIndicatorTimer = this.pushIndicatorDuration;
		this.pushIndicator.visible = true;
		this.refreshPushIndicatorPosition();
	}

	public getTrackLength(): number {
		return this.trackLength;
	}

	public getCartWidth(): number {
		return this.cartWidth;
	}

	public setPoleLength(length: number): void {
		this.poleLength = length;
		const scale = length / this.basePoleLength;
		this.poleMesh.scale.y = scale;
		this.poleMesh.position.y = this.poleLength * 0.5;
		this.refreshPushIndicatorPosition();
	}

	private updatePushIndicator(delta: number): void {
		if (!this.pushIndicator.visible) {
			return;
		}

		this.refreshPushIndicatorPosition();
		this.pushIndicatorTimer -= delta;
		if (this.pushIndicatorTimer <= 0) {
			this.pushIndicator.visible = false;
			this.pushIndicatorTimer = 0;
		}
	}

	private refreshPushIndicatorPosition(): void {
		if (this.pushIndicatorDirection === 0) {
			return;
		}

		this.polePivot.updateMatrixWorld(true);
		this.poleTipWorld.set(0, this.poleLength, 0);
		this.polePivot.localToWorld(this.poleTipWorld);

		this.pushDirectionVector.set(this.pushIndicatorDirection, 0, 0).normalize();
		this.pushIndicator.setDirection(this.pushDirectionVector);
		this.pushOffset.copy(this.pushDirectionVector).multiplyScalar(0.05);
		this.pushIndicator.position.copy(this.poleTipWorld).add(this.pushOffset);
		this.pushIndicator.position.y += 0.02;
	}

}

class CartPoleSimulator {
	private readonly state: CartPoleState = { x: 0, xDot: 0, theta: 0, thetaDot: 0 };
	private gravity: number;
	private massCart: number;
	private readonly massPole: number;
	private totalMass: number;
	private halfPoleLength: number;
	private poleMassLength: number;
	private readonly forceMag: number;
	private readonly tau: number;
	private readonly thetaThresholdRadians: number;
	private readonly maxEpisodeSteps: number;
	private nudgeAngleImpulse: number;
	private nudgeAngularVelocityImpulse: number;
	private nudgeCartVelocityImpulse: number;
	private accumulator = 0;
	private appliedForce = 0;
	private stepsSinceReset = 0;
	private resetFlag = false;

	constructor(simulation: SimulationConfig) {
		this.gravity = simulation.physics.gravity;
		this.massCart = simulation.physics.massCart;
		this.massPole = simulation.physics.massPole;
		this.totalMass = this.massCart + this.massPole;
		this.halfPoleLength = simulation.dimensions.pole.length / 2;
		this.poleMassLength = this.massPole * this.halfPoleLength;
		this.forceMag = simulation.physics.forceMagnitude;
		this.tau = simulation.physics.timeStep;
		this.thetaThresholdRadians = (simulation.physics.thetaThresholdDegrees * Math.PI) / 180;
		this.maxEpisodeSteps = simulation.physics.maxEpisodeSteps;
		this.nudgeAngleImpulse = THREE.MathUtils.degToRad(simulation.nudges.angleImpulseDegrees);
		this.nudgeAngularVelocityImpulse = THREE.MathUtils.degToRad(
			simulation.nudges.angularVelocityImpulseDegrees
		);
		this.nudgeCartVelocityImpulse = simulation.nudges.cartVelocityImpulse;
		this.reset();
	}

	public advance(dt: number): CartPoleState {
		let stepsPerformed = 0;
		this.resetFlag = false;
		this.accumulator += dt;
		while (this.accumulator >= this.tau) {
			this.integrateStep();
			this.accumulator -= this.tau;
			stepsPerformed += 1;
		}
		if (stepsPerformed > 0) {
			this.stepsSinceReset += stepsPerformed;
		}
		if (this.hasEpisodeTerminated()) {
			this.reset();
		}
		return { ...this.state };
	}

	public setForce(force: number): void {
		this.appliedForce = THREE.MathUtils.clamp(force, -this.forceMag, this.forceMag);
	}

	public getForceMagnitude(): number {
		return this.forceMag;
	}

	public updateParameters(params: { gravity?: number; massCart?: number; poleLength?: number }): void {
		if (typeof params.gravity === "number") {
			this.gravity = params.gravity;
		}
		if (typeof params.massCart === "number") {
			this.massCart = Math.max(params.massCart, 0.1);
			this.totalMass = this.massCart + this.massPole;
		}
		if (typeof params.poleLength === "number") {
			const clampedLength = Math.max(params.poleLength, 0.1);
			this.halfPoleLength = clampedLength / 2;
			this.poleMassLength = this.massPole * this.halfPoleLength;
		}
	}

	public getState(): CartPoleState {
		return { ...this.state };
	}

	public reset(state?: Partial<CartPoleState>): void {
		this.state.x = state?.x ?? THREE.MathUtils.randFloatSpread(0.1);
		this.state.xDot = state?.xDot ?? THREE.MathUtils.randFloatSpread(0.1);
		this.state.theta = state?.theta ?? THREE.MathUtils.randFloatSpread(0.1);
		this.state.thetaDot = state?.thetaDot ?? THREE.MathUtils.randFloatSpread(0.1);
		this.accumulator = 0;
		this.stepsSinceReset = 0;
		this.appliedForce = 0;
		this.resetFlag = true;
	}

	public consumeResetFlag(): boolean {
		const flag = this.resetFlag;
		this.resetFlag = false;
		return flag;
	}

	private integrateStep(): void {
		const { x, xDot, theta, thetaDot } = this.state;
		const sinTheta = Math.sin(theta);
		const cosTheta = Math.cos(theta);
		const temp = (this.appliedForce + this.poleMassLength * thetaDot * thetaDot * sinTheta) / this.totalMass;
		const thetaAcc = (this.gravity * sinTheta - cosTheta * temp) / (
			this.halfPoleLength * (4 / 3 - (this.massPole * cosTheta * cosTheta) / this.totalMass)
		);
		const xAcc = temp - (this.poleMassLength * thetaAcc * cosTheta) / this.totalMass;

		this.state.x = x + this.tau * xDot;
		this.state.xDot = xDot + this.tau * xAcc;
		this.state.theta = theta + this.tau * thetaDot;
		this.state.thetaDot = thetaDot + this.tau * thetaAcc;
	}

	private hasEpisodeTerminated(): boolean {
		return (
			Math.abs(this.state.theta) > this.thetaThresholdRadians ||
			this.stepsSinceReset >= this.maxEpisodeSteps
		);
	}

	public nudgePole(direction: number, strength: number = 1.0): void {
		const directionSign = Math.sign(direction);
		if (directionSign === 0) {
			return;
		}

		const clampedStrength = THREE.MathUtils.clamp(strength, 0, 5);
		const angleImpulse = this.nudgeAngleImpulse * clampedStrength;
		const angularVelocityImpulse = this.nudgeAngularVelocityImpulse * clampedStrength;
		const cartVelocityImpulse = this.nudgeCartVelocityImpulse * clampedStrength;

		this.state.theta += angleImpulse * directionSign;
		this.state.thetaDot += angularVelocityImpulse * directionSign;
		this.state.xDot += cartVelocityImpulse * directionSign;

		const maxTheta = this.thetaThresholdRadians * 0.99;
		this.state.theta = THREE.MathUtils.clamp(this.state.theta, -maxTheta, maxTheta);
	}
}

class PolicyRunner {
	private session?: ort.InferenceSession;
	private readonly modelUrl: string;
	private initializationPromise?: Promise<void>;
	private busy = false;

	constructor(modelUrl: string) {
		this.modelUrl = modelUrl;
	}

	public async init(): Promise<void> {
		if (this.session) {
			return;
		}
		if (!this.initializationPromise) {
			this.initializationPromise = ort.InferenceSession.create(this.modelUrl, {
				executionProviders: ["wasm"],
			})
				.then((session) => {
					this.session = session;
				})
				.catch((error) => {
					console.error(`Failed to load policy model from ${this.modelUrl}`, error);
					throw error;
				})
				.finally(() => {
					this.initializationPromise = undefined;
				});
		}
		await this.initializationPromise;
	}

	public isReady(): boolean {
		return Boolean(this.session);
	}

	public isBusy(): boolean {
		return this.busy;
	}

	public async predictForce(state: CartPoleState, forceMagnitude: number): Promise<number> {
		if (!this.session) {
			throw new Error("Policy session is not initialized");
		}
		if (this.busy) {
			throw new Error("Policy inference already in progress");
		}

		this.busy = true;
		try {
			const inputName = this.session.inputNames[0];
			const outputName = this.session.outputNames[0];
			if (!inputName || !outputName) {
				throw new Error("Policy model input or output names are missing");
			}

			const inputData = new Float32Array([state.x, state.xDot, state.theta, state.thetaDot]);
			const inputTensor = new ort.Tensor("float32", inputData, [inputData.length]);
			const feeds: Record<string, ort.Tensor> = { [inputName]: inputTensor };
			const results = await this.session.run(feeds);
			const outputTensor = results[outputName];
			if (!outputTensor) {
				throw new Error(`Policy model output "${outputName}" not found`);
			}

			const dataArray = outputTensor.data as Float32Array | number[];
			if (dataArray.length === 0) {
				throw new Error("Policy model returned empty output");
			}

			let force: number;
			if (dataArray.length === 1) {
				const rawForce = Number(dataArray[0]);
				force = THREE.MathUtils.clamp(rawForce, -forceMagnitude, forceMagnitude);
			} else {
				let bestIndex = 0;
				let bestValue = Number(dataArray[0]);
				for (let i = 1; i < dataArray.length; i += 1) {
					const candidate = Number(dataArray[i]);
					if (candidate > bestValue) {
						bestValue = candidate;
						bestIndex = i;
					}
				}

				if (dataArray.length === 2) {
					force = bestIndex === 0 ? -forceMagnitude : forceMagnitude;
				} else {
					const normalized = (bestIndex / (dataArray.length - 1)) * 2 - 1;
					force = THREE.MathUtils.clamp(normalized * forceMagnitude, -forceMagnitude, forceMagnitude);
				}
			}

			return force;
		} finally {
			this.busy = false;
		}
	}
}

export class ThreeJSApp {
	private readonly scene: THREE.Scene;
	private readonly camera: THREE.PerspectiveCamera;
	private readonly renderer: THREE.WebGLRenderer;
	private readonly controls: OrbitControls;
	private readonly clock: THREE.Clock = new THREE.Clock();
	private readonly simulator: CartPoleSimulator;
	private cartPoleVisual: CartPoleVisual;
	private readonly cameraFollowOffset: THREE.Vector3 = new THREE.Vector3();
	private readonly cartWorldPosition: THREE.Vector3 = new THREE.Vector3();
	private policyRunner?: PolicyRunner;
	private policyActionPending = false;
	private readonly ortWasmBaseUrl: string;
	private readonly manualPushStrength: number;
	private readonly simulationConfig: SimulationConfig;
	private readonly simulationState: {
		gravity: number;
		poleLength: number;
		massCart: number;
	};
	private readonly nudgeCooldownMs = 1000;
	private leftNudgeButton?: HTMLButtonElement;
	private rightNudgeButton?: HTMLButtonElement;
	private leftNudgePointerHandler?: (event: PointerEvent) => void;
	private rightNudgePointerHandler?: (event: PointerEvent) => void;
	private leftNudgeClickHandler?: (event: MouseEvent) => void;
	private rightNudgeClickHandler?: (event: MouseEvent) => void;
	private swallowClickHandler?: (event: MouseEvent) => void;
	private readonly supportsPointerEvents = typeof window !== "undefined" && window.PointerEvent !== undefined;
	private readonly buttonCooldowns = new Map<HTMLButtonElement, number>();
	private pane?: Pane;
	private readonly trackAxis: THREE.Vector3 = new THREE.Vector3(1, 0, 0);
	private readonly tmpCameraForward: THREE.Vector3 = new THREE.Vector3();
	private readonly tmpCameraRight: THREE.Vector3 = new THREE.Vector3();

	constructor(canvas: HTMLCanvasElement, options?: ThreeJSAppOptions) {
		const resolvedModelUrl = options?.modelUrl ?? config.policy.modelUrl;
		const resolvedWasmBaseUrl = options?.ortWasmBaseUrl ?? config.onnxRuntime.wasmBaseUrl;
		const resolvedManualPushStrength = options?.manualPushStrength ?? config.controls.manualPushStrength;

		this.ortWasmBaseUrl = resolvedWasmBaseUrl;
		this.manualPushStrength = resolvedManualPushStrength;
		this.simulationConfig = config.simulation;
		this.simulationState = {
			gravity: this.simulationConfig.physics.gravity,
			poleLength: this.simulationConfig.dimensions.pole.length,
			massCart: this.simulationConfig.physics.massCart,
		};

		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0xdfe8f6);

		this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
		this.camera.position.set(3, 2, 4);
		this.camera.lookAt(new THREE.Vector3(0, 0.5, 0));

		this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
		this.renderer.shadowMap.enabled = true;
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

		this.controls = new OrbitControls(this.camera, canvas);
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.05;
		this.controls.rotateSpeed = 3;
		this.controls.target.set(0, 0.5, 0);
		this.cameraFollowOffset.copy(this.camera.position).sub(this.controls.target);

		this.simulator = new CartPoleSimulator(this.simulationConfig);
		this.simulator.setForce(0);
		this.cartPoleVisual = new CartPoleVisual(this.scene, this.simulationConfig);

		if (resolvedModelUrl) {
			this.initializePolicy(resolvedModelUrl);
		}

		this.addLights();
		this.addGround();
		this.addTrackMarkers();
		this.addFog();
		// this.scene.add(new THREE.AxesHelper(1.5));

		this.setupEventListeners();
		this.setupOnScreenControls();
		this.setupControlPane();
		this.animate();
	}

	private initializePolicy(modelUrl: string): void {
		if (!ort.env.wasm.wasmPaths) {
			ort.env.wasm.wasmPaths = this.ortWasmBaseUrl;
		}
		const runner = new PolicyRunner(modelUrl);
		this.policyRunner = runner;
		runner
			.init()
			.then(() => {
				console.info(`[Policy] Loaded ONNX model from ${modelUrl}`);
			})
			.catch((error) => {
				console.error("Failed to initialise policy runner", error);
				this.policyRunner = undefined;
			});
	}

	private requestPolicyAction(state: CartPoleState): void {
		if (!this.policyRunner || !this.policyRunner.isReady() || this.policyRunner.isBusy() || this.policyActionPending) {
			return;
		}

		this.policyActionPending = true;
		this.policyRunner
			.predictForce(state, this.simulator.getForceMagnitude())
			.then((force) => {
				this.simulator.setForce(force);
			})
			.catch((error) => {
				console.error("Policy inference failed", error);
			})
			.finally(() => {
				this.policyActionPending = false;
			});
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
		const groundGeometry = new THREE.PlaneGeometry(this.cartPoleVisual.getTrackLength() + this.cartPoleVisual.getCartWidth(), 2.4);
		const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xb0bec5, opacity: 0.9, transparent: true });
		const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
		groundMesh.rotation.x = -Math.PI / 2;
		groundMesh.position.y = -0.19;
		groundMesh.receiveShadow = true;
		this.scene.add(groundMesh);

		const gridHelper = createAGrid({ height: 2.4, width: this.cartPoleVisual.getTrackLength() + this.cartPoleVisual.getCartWidth(), stepHeight: 0.15, stepWidth: 0.2, color: 0x4a6572 });
		gridHelper.position.y = -0.188;
		const gridMaterial = (gridHelper.children[0] as THREE.LineSegments).material as THREE.LineBasicMaterial;
		gridMaterial.opacity = 0.45;
		this.scene.add(gridHelper);
	}

	private addTrackMarkers(): void {
		const markerMaterial = new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.15, roughness: 0.6 });
		const markerDepth = this.cartPoleVisual.getCartWidth() * 1.4;
		const markerGeometry = new THREE.BoxGeometry(0.05, 0.01, markerDepth);
		const markerGroup = new THREE.Group();
		const spacing = 0.6;
		for (let i = -Math.floor(this.cartPoleVisual.getTrackLength() / (2 * spacing)); i <= Math.floor(this.cartPoleVisual.getTrackLength() / (2 * spacing)); i += 1) {
			const marker = new THREE.Mesh(markerGeometry, markerMaterial);
			marker.position.set(i * spacing, -0.179, 0);
			markerGroup.add(marker);
		}
		this.scene.add(markerGroup);
	}

	private addFog(): void {
		this.scene.fog = new THREE.Fog(0xdfe8f6, 1, 12);
	}

	private setupEventListeners(): void {
		window.addEventListener("resize", this.onWindowResize);
		window.addEventListener("keydown", this.onKeyDown);
	}

	private setupOnScreenControls(): void {
		const leftButton = document.querySelector<HTMLButtonElement>("[data-nudge='left']");
		const rightButton = document.querySelector<HTMLButtonElement>("[data-nudge='right']");
		if (!leftButton || !rightButton) {
			return;
		}

		this.leftNudgeButton = leftButton;
		this.rightNudgeButton = rightButton;

		if (this.supportsPointerEvents) {
			this.swallowClickHandler = (event: MouseEvent) => {
				event.preventDefault();
			};

			this.leftNudgePointerHandler = (event: PointerEvent) => {
				event.preventDefault();
				if (!(event.currentTarget instanceof HTMLButtonElement)) {
					return;
				}
				const button = event.currentTarget;
				if (button.disabled) {
					return;
				}
				button.blur();
				this.handleNudge(-1, button);
			};
			this.rightNudgePointerHandler = (event: PointerEvent) => {
				event.preventDefault();
				if (!(event.currentTarget instanceof HTMLButtonElement)) {
					return;
				}
				const button = event.currentTarget;
				if (button.disabled) {
					return;
				}
				button.blur();
				this.handleNudge(1, button);
			};

			leftButton.addEventListener("pointerdown", this.leftNudgePointerHandler);
			rightButton.addEventListener("pointerdown", this.rightNudgePointerHandler);
			if (this.swallowClickHandler) {
				leftButton.addEventListener("click", this.swallowClickHandler);
				rightButton.addEventListener("click", this.swallowClickHandler);
			}
		} else {
			this.leftNudgeClickHandler = (event: MouseEvent) => {
				event.preventDefault();
				if (!(event.currentTarget instanceof HTMLButtonElement)) {
					return;
				}
				const button = event.currentTarget;
				if (button.disabled) {
					return;
				}
				button.blur();
				this.handleNudge(-1, button);
			};
			this.rightNudgeClickHandler = (event: MouseEvent) => {
				event.preventDefault();
				if (!(event.currentTarget instanceof HTMLButtonElement)) {
					return;
				}
				const button = event.currentTarget;
				if (button.disabled) {
					return;
				}
				button.blur();
				this.handleNudge(1, button);
			};

			leftButton.addEventListener("click", this.leftNudgeClickHandler);
			rightButton.addEventListener("click", this.rightNudgeClickHandler);
		}
	}

	private setupControlPane(): void {
		const pane = new Pane({ title: "Simulation Controls" });
		this.pane = pane;
		pane
			.addBinding(this.simulationState, "gravity", { min: 5, max: 20, step: 0.1, label: "Gravity" })
			.on("change", (event: { value: number }) => {
				const value = event.value;
				this.simulator.updateParameters({ gravity: value });
			});
		pane
			.addBinding(this.simulationState, "massCart", { min: 0.2, max: 5, step: 0.1, label: "Cart Mass" })
			.on("change", (event: { value: number }) => {
				const value = event.value;
				this.simulator.updateParameters({ massCart: value });
			});
		pane
			.addBinding(this.simulationState, "poleLength", { min: 0.4, max: 2.0, step: 0.05, label: "Pole Length" })
			.on("change", (event: { value: number }) => {
				const value = event.value;
				this.simulator.updateParameters({ poleLength: value });
				this.cartPoleVisual.setPoleLength(value);
			});
	}

	private handleNudge(baseDirection: -1 | 1, sourceButton?: HTMLButtonElement): void {
		const worldDirection = this.computeCameraRelativeDirection(baseDirection);
		this.simulator.nudgePole(worldDirection, this.manualPushStrength);
		this.cartPoleVisual.showPushIndicator(worldDirection, this.manualPushStrength);
		if (sourceButton) {
			this.beginButtonCooldown(sourceButton);
		}
	}

	private beginButtonCooldown(button: HTMLButtonElement): void {
		button.disabled = true;
		button.classList.add("is-disabled");
		const existingTimer = this.buttonCooldowns.get(button);
		if (existingTimer !== undefined) {
			window.clearTimeout(existingTimer);
		}
		const timeoutId = window.setTimeout(() => {
			button.disabled = false;
			button.classList.remove("is-disabled");
			this.buttonCooldowns.delete(button);
		}, this.nudgeCooldownMs);
		this.buttonCooldowns.set(button, timeoutId);
	}

	private computeCameraRelativeDirection(baseDirection: -1 | 1): number {
		this.camera.getWorldDirection(this.tmpCameraForward);
		this.tmpCameraRight.crossVectors(this.tmpCameraForward, this.camera.up).normalize();
		const alignment = this.tmpCameraRight.dot(this.trackAxis);
		if (!Number.isFinite(alignment) || alignment === 0) {
			return baseDirection;
		}
		const cameraRightSign = Math.sign(alignment) || 1;
		return baseDirection * cameraRightSign;
	}

	private onWindowResize = (): void => {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	};

	private onKeyDown = (event: KeyboardEvent): void => {
		if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
			event.preventDefault();
			if (event.repeat) {
				return;
			}
			const direction = event.key === "ArrowLeft" ? -1 : 1;
			this.handleNudge(direction, undefined);
		}
	};

	private animate = (): void => {
		const delta = this.clock.getDelta();
		const state = this.simulator.advance(delta);
		const simulatorWasReset = this.simulator.consumeResetFlag();
		this.cartPoleVisual.update(state, delta);
		if (!simulatorWasReset) {
			this.requestPolicyAction(state);
		}

		this.cameraFollowOffset.copy(this.camera.position).sub(this.controls.target);
		this.cartPoleVisual.getCartPosition(this.cartWorldPosition);
		this.controls.target.copy(this.cartWorldPosition);
		this.camera.position.copy(this.cartWorldPosition).add(this.cameraFollowOffset);

		this.controls.update();
		this.renderer.render(this.scene, this.camera);
		window.requestAnimationFrame(this.animate);
	};

	public getRenderer(): THREE.WebGLRenderer {
		return this.renderer;
	}

	private teardownOnScreenControls(): void {
		if (this.leftNudgeButton) {
			if (this.leftNudgePointerHandler) {
				this.leftNudgeButton.removeEventListener("pointerdown", this.leftNudgePointerHandler);
			}
			if (this.leftNudgeClickHandler) {
				this.leftNudgeButton.removeEventListener("click", this.leftNudgeClickHandler);
			}
			if (this.swallowClickHandler) {
				this.leftNudgeButton.removeEventListener("click", this.swallowClickHandler);
			}
			this.leftNudgeButton.disabled = false;
			this.leftNudgeButton.classList.remove("is-disabled");
		}
		if (this.rightNudgeButton) {
			if (this.rightNudgePointerHandler) {
				this.rightNudgeButton.removeEventListener("pointerdown", this.rightNudgePointerHandler);
			}
			if (this.rightNudgeClickHandler) {
				this.rightNudgeButton.removeEventListener("click", this.rightNudgeClickHandler);
			}
			if (this.swallowClickHandler) {
				this.rightNudgeButton.removeEventListener("click", this.swallowClickHandler);
			}
			this.rightNudgeButton.disabled = false;
			this.rightNudgeButton.classList.remove("is-disabled");
		}
		this.leftNudgeButton = undefined;
		this.rightNudgeButton = undefined;
		this.leftNudgePointerHandler = undefined;
		this.rightNudgePointerHandler = undefined;
		this.leftNudgeClickHandler = undefined;
		this.rightNudgeClickHandler = undefined;
		this.swallowClickHandler = undefined;
		for (const timeoutId of this.buttonCooldowns.values()) {
			window.clearTimeout(timeoutId);
		}
		this.buttonCooldowns.clear();
	}

	private disposeControlPane(): void {
		this.pane?.dispose();
		this.pane = undefined;
	}

	public dispose(): void {
		window.removeEventListener("resize", this.onWindowResize);
		window.removeEventListener("keydown", this.onKeyDown);
		this.teardownOnScreenControls();
		this.disposeControlPane();
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
