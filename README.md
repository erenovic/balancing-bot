# Balancing Bot

Physics-driven cart-pole visualisation backed by a reinforcement-learning training pipeline. The repository is split into two workspaces:

- [`frontend/`](frontend/README.md) – Vite/TypeScript web app that simulates the CartPole system with Three.js, runs ONNX models in the browser, and exposes keyboard/touch controls so you can perturb the pole.
- [`backend/`](backend/README.md) – Hydra-based Python project that trains cart-pole policies with Torch and exports them to ONNX for the frontend.

---

## Quick links

| Area | Description |
| --- | --- |
| 🎮 **Live Demo** | Build the frontend (`npm run build -- --base=/assets/demos/rl-cartpole/`) and drop `dist/` onto your static host. On GitHub Pages the demo lives under `https://erenovic.github.io/assets/demos/rl-cartpole/`. |
| 📦 **Frontend docs** | [frontend/README.md](frontend/README.md) – setup, configuration vars (`VITE_*`), architecture walkthrough. |
| 🧠 **Backend docs** | [backend/README.md](backend/README.md) – training pipeline, Hydra configs, ONNX export instructions. |

---

## Getting started

Clone the repo and set up both workspaces:

```bash
git clone https://github.com/erenovic/balancing_bot.git
cd balancing_bot
```

### Frontend (Three.js + ONNX Runtime)

```bash
cd frontend
npm install
npm run dev
```

- Ensure a policy model exists at `public/models/policy_model_best.onnx` (or set `VITE_POLICY_MODEL_URL`).
- Use the arrow keys or on-screen chevrons to nudge the pole and observe the policy recover in real time.
- See [frontend/README.md](frontend/README.md) for deployment tips (including configuring the `--base` path when serving from a subdirectory).

### Backend (Hydra/Torch training)

```bash
cd backend
uv sync          # or pip install -e .
uv run python -m src.train
```

- Default config trains REINFORCE on Gymnasium’s `CartPole-v1`. Override parameters via Hydra CLI flags (`trainer.num_steps=5000 algorithm.name=ppo` etc.).
- Export the best checkpoint to ONNX with `uv run python -m src.export model_path=...` and copy the resulting `.onnx` into the frontend.
- Detailed instructions live in [backend/README.md](backend/README.md).

---

## Directory structure

```
backend/   # RL training harness
frontend/  # Three.js visualiser + ONNX inference client
README.md  # This file
```

---

## Contributing

Pull requests and discussion threads are welcome. Please read the workspace-specific READMEs before making changes so the tooling (Hydra, Vite, etc.) stays consistent.

---

## Citing

If this project helps your research or teaching, please cite it. A simple BibTeX snippet you can adapt:

```
@software{cetin2024balancingbot,
  author    = {Eren {\c{C}}etin},
  title     = {Balancing Bot: CartPole Reinforcement Learning Demo},
  year      = {2024},
  url       = {https://github.com/erenovic/balancing_bot},
  version   = {latest}
}
```

Feel free to link to any published paper or demo page associated with your deployment if you customise the project.

---

## License

MIT © Eren Çetin. See [`LICENSE`](LICENSE) for details.
