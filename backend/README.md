# Backend

This backend trains and exports CartPole policies that the frontend visualises. It is a small training environment built on Gymnasium, Torch, and Weights & Biases.

## Project layout

- `src/train.py` – Hydra entry-point for training runs. It loads configuration from `config/`, builds environments, instantiates the requested algorithm, and handles checkpointing/logging.
- `src/export.py` – Utility that converts a saved PyTorch checkpoint into an ONNX model the frontend can load with `onnxruntime-web`.
- `src/algorithms/` – Policy gradient implementations (REINFORCE, PPO, GRPO, DPO). `get_algorithm()` wires the chosen algorithm using the current Hydra config.
- `src/policy_model.py` – Small feed-forward network used by every algorithm. The head emits logits or continuous forces depending on the algorithm.
- `config/` – Hydra configs. `reinforce.yaml` is the default training recipe; `export.yaml` configures ONNX export.
- `outputs/` – Default Hydra output root. Each run receives a timestamped subdirectory containing logs, checkpoints, and Hydra copies of the configs.

## Requirements

- Python 3.11+
- PyTorch 2.8 or newer (CPU, CUDA, or Metal backends all work)
- Weights & Biases account (optional – disable by setting `logger.type=disabled`)

Dependencies are listed in `pyproject.toml` and can be installed with your preferred tool:

```bash
cd backend
uv sync               # if you use Astral's uv (recommended)
# or
pip install -e .
```

## Training a policy

The simplest run uses the default REINFORCE recipe:

```bash
cd backend
uv run python -m src.train
```

Key options come from the Hydra config tree. You can override them at the command line, e.g.:

```bash
uv run python -m src.train trainer.num_steps=5000 trainer.learning_rate=3e-4 \
  algorithm.name=ppo environment.num_envs=8 logger.type=wandb logger.mode=offline
```

### Outputs

Each run writes to `outputs/<timestamp>/`:

- `checkpoints/policy_model_step_XXXX.pth` – periodic snapshots
- `checkpoints/policy_model_best.pth` – symlink to the best-performing checkpoint
- `checkpoints/best_model_info.json` – metadata about the best run (step, reward)
- `hydra/` – frozen copies of the resolved config and Hydra logs
- `wandb/` – Weights & Biases offline logs if `logger.mode=offline`

## Exporting to ONNX for the frontend

Once you have a trained checkpoint, convert it to ONNX so the web app can load it locally:

```bash
cd backend
uv run python -m src.export model_path=outputs/2024-10-03/11-32-01/checkpoints/policy_model_best.pth
```

The exporter reads the saved state dict, rebuilds the matching `PolicyModel`, and writes `policy_model_best.onnx` alongside the checkpoint. Copy that ONNX file into `frontend/public/models/` (or adjust the frontend config) so the browser can fetch it.

## Customising configs

Hydra makes it easy to create new recipes. Add a file to `config/` (e.g. `ppo.yaml`) with your overrides, then launch with `python -m src.train --config-name=ppo`. Each algorithm under `src/algorithms/` exposes parameters such as rollout length, KL penalties, or clipping ranges; inspect the class docstrings for details and surface any new parameters via the config files.

## Troubleshooting

- **Hydra config errors** – ensure you run training commands from the `backend/` directory so relative config paths resolve correctly.
- **GPU selection** – the script automatically prefers CUDA, then Metal (MPS), then CPU. Override manually by exporting `CUDA_VISIBLE_DEVICES` or by editing the device selection near the top of `src/train.py`.
- **WandB authentication** – set the `WANDB_API_KEY` environment variable before launching by running `wandb login`, or disable logging via `logger.type=disabled`.
