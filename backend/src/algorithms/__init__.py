import gymnasium as gym
from omegaconf import DictConfig

from .reinforce import REINFORCE

__all__ = ["REINFORCE"]

ALGOS = {
    "reinforce": REINFORCE,
}


def get_algorithm(environment: gym.Env, config: DictConfig, seed: int):
    return ALGOS[config.name](environment, config, seed)
