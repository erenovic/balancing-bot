from torch import Tensor, nn


class PolicyModel(nn.Module):
    def __init__(self, state_space_size: int, action_space_size: int):
        super().__init__()
        self.state_space_size = state_space_size
        self.action_space_size = action_space_size

        # Shared torso
        self.torso = nn.Sequential(
            nn.Linear(state_space_size, 128),
            nn.ReLU(),
            nn.Linear(128, 64),
            nn.ReLU(),
        )
        # Separate heads
        self.head = nn.Linear(64, action_space_size + 1)

    def forward(self, state: Tensor) -> tuple[Tensor, Tensor]:
        """
        Args:
            state (Tensor): The state of the environment. Shape: (batch_size, state_space_size)
                            or (state_space_size,) for single step.

        Returns:
            Tensor: action logits. Shape: (batch_size, action_space_size) or (action_space_size,) for single step.
            Tensor: state value. Shape: (batch_size,) or (,) for single step.
        """
        if state.dim() == 1:
            state = state.unsqueeze(0)

        h = self.torso(state)
        logits_and_value = self.head(h)
        value = logits_and_value[..., -1]
        logits = logits_and_value[..., : self.action_space_size]
        return logits, value
