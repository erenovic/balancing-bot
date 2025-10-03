# Frontend

This Vite-powered TypeScript app visualises and stress-tests trained CartPole policies entirely in the browser. It couples a lightweight hand-written physics simulator, a Three.js scene graph, and ONNX Runtime Web so you can push the cart around and see how the policy recovers in real time.

## Quick start

```bash
cd frontend
npm install
npm run dev
```

The dev server runs on <http://localhost:5173/> by default. Ensure `public/models/policy_model_best.onnx` exists (or point the app at a different model – see configuration below).

### Useful scripts

- `npm run dev` – start Vite with hot-module reload.
- `npm run build` – type-check with `tsc` and emit a production bundle.
- `npm run preview` – serve the built bundle locally to sanity-check before deploying.

## Runtime configuration

Centralised in `src/config.ts`:

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `VITE_POLICY_MODEL_URL` | `models/policy_model_best.onnx` | Path (relative to `BASE_URL`) or absolute URL to the ONNX policy file fetched by the browser. |
| `VITE_ORT_WASM_BASE_URL` | CDN URL for `onnxruntime-web@1.23.0` | Override if you self-host the ONNX Runtime WASM artefacts. |
| `VITE_MANUAL_PUSH_STRENGTH` | `1` | Scales the impulse applied when the user nudges the cart via keyboard or touch (clamped between 0 and 5). |

Create a `.env.local` alongside `package.json` to override these:

```
VITE_POLICY_MODEL_URL=/models/my_experiment.onnx
VITE_MANUAL_PUSH_STRENGTH=1.5
```

## Source layout

- `src/main.ts` – Application entry point. Bootstraps the Three.js scene, instantiates helpers, handles animation, and owns UI input.
  - `CartPoleSimulator` maintains a discretised version of the CartPole dynamics. It integrates physics in fixed time steps, clamps resets, and exposes `nudgePole()` so the UI can perturb the system.
  - `CartPoleVisual` builds the track, cart, and pole meshes. It also renders temporary push indicators at the pole tip when the user applies a force.
  - `PolicyRunner` wraps `onnxruntime-web`, streams observations through the ONNX model, and normalises logits into actionable forces.
  - `ThreeJSApp` ties everything together: initialises lighting and ground plane, keeps the camera orbit synced to the cart, forwards keyboard and touch input, and tears down event listeners when disposed.
- `src/config.ts` – Typed adapter for `import.meta.env`, normalises base URLs, clamps numeric inputs, and freezes a config object consumed by `ThreeJSApp`.
- `src/utils.ts` – Shared Three.js utilities (e.g. procedural grid helper).
- `style.css` – Global styles for the canvas and the mobile nudge controls. During bundling Vite automatically includes it because `index.html` imports the file.
- `public/models/` – Drop your exported `*.onnx` files here so Vite copies them verbatim into the build output.

> **Note:** The repository also contains placeholder files (`src/simulator.ts`, `src/visual.ts`) reserved for future extraction of classes currently defined in `main.ts`.

## Interaction model

- **Policy playback** – On every animation frame, the simulator advances in fixed 20 ms steps. Whenever an episode is mid-flight and no inference call is already pending, `PolicyRunner` predicts the force and applies it to the simulator.
- **Manual nudges** –
  - Keyboard: press `←` or `→` for a single impulse.
  - Touch/UI: tap the on-screen chevrons. After each tap the button disables itself for one second (visible via a greyed-out state) to prevent spamming while the policy reacts.
  - Both paths share the same `handleNudge()` helper, ensuring impulses flow through the simulator and the visual push indicator consistently.
- **Camera tracking** – The orbital camera keeps a constant offset from the cart so you always see the pole from a comfortable angle on desktop or mobile.

## Adapting for your own models

1. Train a policy with the backend (or another framework) and export it to ONNX.
2. Copy the `*.onnx` file into `frontend/public/models/`.
3. Update `VITE_POLICY_MODEL_URL` (or rename the file to `policy_model_best.onnx`).
4. Restart `npm run dev` so Vite picks up the new asset.

If your model uses a different output convention (e.g. continuous forces, multi-discrete logits), tweak `PolicyRunner.predictForce()` so the mapping from ONNX outputs to simulator forces matches your network.

## Troubleshooting

- **Model fails to load** – Check the browser devtools network tab; an HTML fallback (status 404) masquerading as `.onnx` will trigger “protobuf parsing failed”. Fix the URL or move the file into `public/`.
- **Policy diverges after manual nudges** – Try lowering `VITE_MANUAL_PUSH_STRENGTH` or clamping the simulator impulse coefficients in `CartPoleSimulator.nudgePole()`.
- **ONNX runtime assets blocked offline** – Mirror the WASM bundle locally and set `VITE_ORT_WASM_BASE_URL=/ort/` (then serve the files under `public/ort/`).

## Deployment

`npm run build` places a static bundle in `dist/`. Serve the `dist/` directory with your static host of choice (Netlify, Vercel, GitHub Pages). Remember to copy the ONNX file and any other assets alongside the bundle, as the policy model is fetched at runtime relative to `import.meta.env.BASE_URL`.

