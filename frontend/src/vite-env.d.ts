/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_POLICY_MODEL_URL?: string;
	readonly VITE_ORT_WASM_BASE_URL?: string;
	readonly VITE_MANUAL_PUSH_STRENGTH?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
