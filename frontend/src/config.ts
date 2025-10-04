type NumericBounds = {
	readonly min?: number;
	readonly max?: number;
};

function normalizeBaseUrl(rawBaseUrl: string | undefined): string {
	let base = (rawBaseUrl ?? "/").trim();
	if (base.length === 0) {
		base = "/";
	}
	if (!base.startsWith("/")) {
		base = `/${base}`;
	}
	if (!base.endsWith("/")) {
		base = `${base}/`;
	}
	return base;
}

function resolveWithBase(baseUrl: string, value: string): string {
	if (/^(https?:)?\/\//i.test(value)) {
		return value;
	}
	const trimmed = value.replace(/^\/+/, "");
	return `${baseUrl}${trimmed}`;
}

function readString(key: keyof ImportMetaEnv, defaultValue: string): string {
	const value = import.meta.env[key];
	const trimmed = typeof value === "string" ? value.trim() : "";
	return trimmed.length > 0 ? trimmed : defaultValue;
}

function readNumber(
	key: keyof ImportMetaEnv,
	defaultValue: number,
	bounds: NumericBounds = {},
): number {
	const rawValue = import.meta.env[key];
	const parsed = rawValue !== undefined ? Number(rawValue) : Number.NaN;
	const fallback = Number.isFinite(parsed) ? parsed : defaultValue;
	const clampedMin = bounds.min ?? Number.NEGATIVE_INFINITY;
	const clampedMax = bounds.max ?? Number.POSITIVE_INFINITY;
	return Math.min(clampedMax, Math.max(clampedMin, fallback));
}

const baseUrl = normalizeBaseUrl(import.meta.env.BASE_URL);

const defaultModelPath = "models/policy_model_best.onnx";
const policyModelPath = readString("VITE_POLICY_MODEL_URL", defaultModelPath);
const policyModelUrl = resolveWithBase(baseUrl, policyModelPath);

const ortWasmBaseUrl = readString(
	"VITE_ORT_WASM_BASE_URL",
	"https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.0/dist/",
);

const manualPushStrength = readNumber("VITE_MANUAL_PUSH_STRENGTH", 1, { min: 0, max: 5 });

export interface PolicyConfig {
	readonly modelUrl: string;
}

export interface OnnxRuntimeConfig {
	readonly wasmBaseUrl: string;
}

export interface ControlsConfig {
	readonly manualPushStrength: number;
}

export interface SimulationDimensions {
	readonly trackLength: number;
	readonly railThickness: number;
	readonly cart: {
		readonly width: number;
		readonly height: number;
		readonly depth: number;
	};
	readonly pole: {
		readonly length: number;
		readonly thickness: number;
	};
}

export interface SimulationPhysics {
	readonly gravity: number;
	readonly massCart: number;
	readonly massPole: number;
	readonly forceMagnitude: number;
	readonly timeStep: number;
	readonly thetaThresholdDegrees: number;
	readonly maxEpisodeSteps: number;
}

export interface SimulationAirResistance {
	readonly cartLinear: number;
	readonly poleAngular: number;
}

export interface SimulationNudge {
	readonly angleImpulseDegrees: number;
	readonly angularVelocityImpulseDegrees: number;
	readonly cartVelocityImpulse: number;
}

export interface SimulationIndicators {
	readonly pushDurationSeconds: number;
	readonly pushLength: number;
	readonly pushHeadLength: number;
	readonly pushHeadWidth: number;
}

export interface SimulationConfig {
	readonly dimensions: SimulationDimensions;
	readonly physics: SimulationPhysics;
	readonly nudges: SimulationNudge;
	readonly indicators: SimulationIndicators;
	readonly airResistance: SimulationAirResistance;
	readonly enablePolicy: boolean;
}

export interface AppConfig {
	readonly baseUrl: string;
	readonly policy: PolicyConfig;
	readonly onnxRuntime: OnnxRuntimeConfig;
	readonly controls: ControlsConfig;
	readonly simulation: SimulationConfig;
}

const simulationConfig: SimulationConfig = Object.freeze({
	dimensions: {
		trackLength: 10,
		railThickness: 0.05,
		cart: {
			width: 0.6,
			height: 0.25,
			depth: 0.4,
		},
		pole: {
			length: 1,
			thickness: 0.05,
		},
	},
	physics: {
		gravity: 9.8,
		massCart: 1,
		massPole: 0.1,
		forceMagnitude: 10,
		timeStep: 0.02,
		thetaThresholdDegrees: 30,
		maxEpisodeSteps: 1000,
	},
	airResistance: {
		cartLinear: 0.75,
		poleAngular: 1.1,
	},
	nudges: {
		angleImpulseDegrees: 1.5,
		angularVelocityImpulseDegrees: 45,
		cartVelocityImpulse: 0.4,
	},
	indicators: {
		pushDurationSeconds: 0.4,
		pushLength: 0.3,
		pushHeadLength: 0.12,
		pushHeadWidth: 0.07,
	},
	enablePolicy: true,
});

const config: AppConfig = Object.freeze({
	baseUrl,
	policy: { modelUrl: policyModelUrl },
	onnxRuntime: { wasmBaseUrl: ortWasmBaseUrl },
	controls: { manualPushStrength },
	simulation: simulationConfig,
});

export default config;
