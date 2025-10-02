from collections import namedtuple

import gymnasium as gym
import torch
import torch.nn as nn
from omegaconf import DictConfig
from torch.distributions import Categorical
from torch.nn.functional import smooth_l1_loss

from src.policy_model import PolicyModel

Rollout = namedtuple("Rollout", ["log_prob", "value", "reward"])


class REINFORCE:
    """REINFORCE algorithm with value baseline."""

    def __init__(self, environment: gym.Env, config: DictConfig, seed: int):
        self.seed = seed
        self.environment = environment
        self.config = config
        self.rollouts: list[Rollout] = []
        self.eps = 1e-8

    def update(self, model: nn.Module, optimizer: torch.optim.Optimizer):
        """Compute returns, normalize, and take a gradient step.
        Uses a value baseline (actor-critic-style) if provided by the model.
        """
        if not self.rollouts:
            return

        device = next(model.parameters()).device

        # Compute discounted returns (from the end)
        returns = []
        cum_reward = 0.0
        for _, _, r in reversed(self.rollouts):
            r_val = r.item() if isinstance(r, torch.Tensor) else float(r)
            cum_reward = r_val + self.config.gamma * cum_reward
            returns.insert(0, cum_reward)

        returns_t = torch.tensor(returns, dtype=torch.float32, device=device)
        # Normalize for variance reduction
        returns_t = (returns_t - returns_t.mean()) / (returns_t.std() + self.eps)

        policy_losses = []
        value_losses = []

        for (log_prob, value, _), Rn in zip(self.rollouts, returns_t, strict=True):
            # Advantage using baseline
            advantage = Rn - value.detach()
            policy_losses.append(-log_prob * advantage)
            value_losses.append(smooth_l1_loss(value, Rn))

        loss = torch.stack(policy_losses).sum() + torch.stack(value_losses).sum()
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        # Clear trajectory
        self.rollouts.clear()

    def sample_rollout(self, model: PolicyModel, device: torch.device, will_render: bool):
        """Run one episode (or up to rollout_length) and store transitions.
        Returns total_reward for logging.
        """
        self.rollouts.clear()
        state, _ = self.environment.reset(seed=self.seed)
        if isinstance(state, torch.Tensor):
            state = state.to(device)

        total_reward = 0.0
        terminated = False
        truncated = False

        frames = None
        if will_render:
            frames = [self.environment.render()]

        for _ in range(self.config.rollout_length):
            logits, value = model(state)
            dist = Categorical(logits=logits)
            action = dist.sample()
            log_prob = dist.log_prob(action)

            next_state, reward, terminated, truncated, _ = self.environment.step(action.item())

            # Convert reward to python float for accumulation but keep tensor if needed
            r_item = reward.item() if isinstance(reward, torch.Tensor) else float(reward)
            total_reward += r_item

            self.rollouts.append(Rollout(log_prob, value, reward))

            if terminated or truncated:
                break

            state = next_state.to(device)

            if will_render:
                frames.append(self.environment.render())

        frames = torch.stack(frames) if will_render else frames
        return total_reward, terminated, truncated, frames
