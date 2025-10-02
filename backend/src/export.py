from pathlib import Path

import hydra
import torch
from omegaconf import DictConfig

from src.policy_model import PolicyModel


@hydra.main(version_base=None, config_path="../config", config_name="export")
def main(config: DictConfig):
    model_path = Path(config.model_path)
    state_dict = torch.load(model_path, map_location="cpu")

    state_space_size = state_dict["torso.0.weight"].shape[1]
    action_space_size = state_dict["head.weight"].shape[0] - 1

    policy_model = PolicyModel(
        state_space_size=state_space_size, action_space_size=action_space_size
    )
    policy_model.load_state_dict(state_dict)
    policy_model.eval()

    example_inputs = (torch.randn(state_space_size),)
    onnx_program = torch.onnx.export(policy_model, example_inputs, dynamo=True)
    onnx_program.save(model_path.with_suffix(".onnx"))


if __name__ == "__main__":
    main()
