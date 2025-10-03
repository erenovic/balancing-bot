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

function readNumber(key: keyof ImportMetaEnv, defaultValue: number, bounds: NumericBounds = {}): number {
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

export interface AppConfig {
	readonly baseUrl: string;
	readonly policy: PolicyConfig;
	readonly onnxRuntime: OnnxRuntimeConfig;
	readonly controls: ControlsConfig;
}

const config: AppConfig = Object.freeze({
	baseUrl,
	policy: { modelUrl: policyModelUrl },
	onnxRuntime: { wasmBaseUrl: ortWasmBaseUrl },
	controls: { manualPushStrength },
});

export default config;
