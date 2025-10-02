import json
import logging
import random
from pathlib import Path

import gymnasium as gym
import hydra
import numpy as np
import torch
import wandb
from gymnasium.wrappers.numpy_to_torch import NumpyToTorch
from omegaconf import DictConfig, OmegaConf
from torch import optim
from tqdm import tqdm

from src.algorithms import get_algorithm
from src.policy_model import PolicyModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


if torch.cuda.is_available():
    device = torch.device("cuda")
elif torch.backends.mps.is_available():
    device = torch.device("mps")
else:
    device = torch.device("cpu")

logger.info(f"Using device: {device}")


@hydra.main(version_base=None, config_path="../config", config_name="reinforce")
def main(config: DictConfig):
    output_dir = Path(hydra.core.hydra_config.HydraConfig.get().runtime.output_dir)
    save_dir = output_dir / "checkpoints"
    save_dir.mkdir(parents=True, exist_ok=True)

    torch.manual_seed(config.seed)
    np.random.seed(config.seed)
    random.seed(config.seed)

    # Initialize wandb if enabled
    use_wandb = config.logger.type == "wandb"
    if use_wandb:
        # Convert DictConfig to regular dict for wandb
        wandb.init(
            project="balancing-bot",
            config=OmegaConf.to_container(config, resolve=True, throw_on_missing=True),
            mode=config.logger.mode,
            dir=output_dir,
        )
        logger.info("Wandb initialized successfully!")

    # Create environment
    environment: gym.Env = NumpyToTorch(gym.make(config.environment.name, render_mode="rgb_array"))

    # Cart-Pole-v1 state space size is 4:
    # [cart position, cart velocity, pole angle, pole velocity at tip]

    logger.info(f"Environment: {config.environment}")

    # Create algorithm
    policy_model = PolicyModel(
        state_space_size=environment.observation_space.shape[0],
        action_space_size=environment.action_space.n,
    ).to(device)
    optimizer = optim.Adam(policy_model.parameters(), lr=config.trainer.learning_rate)
    algorithm = get_algorithm(environment, config.algorithm, config.seed)
    logger.info(f"Algorithm: {config.algorithm.name}")

    # Initialize variables for rollout loop
    state, info = environment.reset()
    if isinstance(state, torch.Tensor):
        state = state.to(device)
    best_total_reward = 0
    running_total_reward = 0
    terminated = False
    truncated = False

    for step in tqdm(range(1, config.trainer.num_steps + 1)):
        policy_model.train()
        will_render = step % config.trainer.render_every_n_steps == 0
        will_save_model = step % config.trainer.save_every_n_steps == 0

        # Sample rollout
        total_reward, terminated, truncated, frames = algorithm.sample_rollout(
            policy_model, device, will_render
        )
        algorithm.update(policy_model, optimizer)

        # Log metrics to wandb (if enabled)
        if use_wandb:
            wandb.log({"step": step, "episode_reward": total_reward}, step=step)

            if will_render:
                frames = frames.permute(0, 3, 1, 2)
                video = wandb.Video(frames, fps=config.trainer.render_fps, format="mp4")
                wandb.log({"video": video}, step=step)

        if terminated or truncated:
            episode_type = "truncated" if truncated else "terminated"
            logger.warning(f"Episode {episode_type} with total reward: {total_reward:.1f}")

            total_reward = 0

        running_total_reward = 0.99 * running_total_reward + 0.01 * total_reward

        if will_save_model:
            model_path = save_dir / f"policy_model_step_{step}.pth"
            torch.save(policy_model.state_dict(), model_path)

        if (running_total_reward > best_total_reward) and will_save_model:
            logger.info(f"New best total reward: {running_total_reward:.1f} at step {step}")
            logger.info(f"  Total reward: {total_reward:.1f}")
            logger.info(f"  Running total reward: {running_total_reward:.1f}")
            best_total_reward = running_total_reward
            best_model_path = save_dir / "policy_model_best.pth"
            best_model_path.unlink(missing_ok=True)
            best_model_path.symlink_to(model_path)

            best_model_info_path = save_dir / "best_model_info.json"
            with open(best_model_info_path, "w") as f:
                json.dump(
                    {
                        "step": step,
                        "total_reward": total_reward,
                        "running_total_reward": running_total_reward,
                    },
                    f,
                )

    # Cleanup
    logger.info("Training completed!")
    environment.close()

    if use_wandb:
        wandb.finish()
        logger.info("Wandb run finished.")


if __name__ == "__main__":
    main()
