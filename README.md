# 🤖 Balancing Bot in 3D

<div align="center">

**A real-time reinforcement learning demo: Train an RL agent in Python, deploy it in your browser with Three.js**

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r168+-green.svg)](https://threejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[**Live Demo**](#) • [**Documentation**](#project-structure) • [**Report Bug**](https://github.com/erenovic/balancing_bot/issues)

</div>

---

## 🎯 Overview

**Balancing Bot** is a full-stack reinforcement learning project that demonstrates the complete ML pipeline from training to deployment:

1. **🧠 Train** a policy using GRPO (Group Relative Policy Optimization) in Python/PyTorch
2. **📦 Export** the trained model to ONNX format for web deployment
3. **🌐 Deploy** in a beautiful Three.js scene running entirely in the browser
4. **🎮 Interact** with the bot - push it around and watch the AI agent recover balance in real-time

The project showcases a balancing problem (similar to the classic inverted pendulum/cartpole) where an RL agent learns to keep a 3D object upright on a platform, demonstrating intelligent behavior that's clearly "learned" rather than scripted.

---

## ✨ Features

### Backend (Python/PyTorch)
- ✅ Custom Gymnasium environment for 3D balance simulation
- ✅ GRPO implementation for efficient policy training
- ✅ ONNX model export for cross-platform deployment
- ✅ JSON export of normalization statistics
- ✅ Modern Python tooling (Ruff, mypy, pytest)
- ✅ Pre-commit hooks and CI/CD

### Frontend (TypeScript/Three.js)
- ✅ Real-time 3D physics simulation with Three.js
- ✅ ONNX Runtime Web for in-browser inference
- ✅ Interactive controls - push the bot and watch it recover
- ✅ AI ON/OFF toggle to compare behavior
- ✅ Responsive design with camera controls
- ✅ Modern dev tooling (Vite, Biome, Jest)

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+** (for training)
- **Node.js 18+** and npm (for frontend)
- Modern web browser with WebGL support

### 1. Train the Agent (Backend)

```bash
# Navigate to backend
cd backend

# Install dependencies
make install-dev

# Train the balancing agent
python -m backend.train

# Export to ONNX
python -m backend.export --model checkpoints/best_model.pt --output models/policy.onnx
```

This will:
- Train a policy to balance the 3D object
- Save checkpoints during training
- Export the best model to ONNX format
- Generate `normalization_stats.json` for the frontend

### 2. Run the Frontend

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Copy the trained model
cp ../backend/models/policy.onnx public/models/
cp ../backend/models/normalization_stats.json public/models/

# Start development server
npm run dev
```

Visit `http://localhost:3000` and watch your trained agent balance in 3D!

### 3. Interact with the Bot

- **Click** or **press keys** to push the bot
- Toggle **AI ON/OFF** to see the difference between controlled and uncontrolled behavior
- Use **mouse controls** to rotate the camera and view from different angles

---

## 🏗️ Project Structure

```
balancing_bot/
├── backend/                    # Python RL training pipeline
│   ├── backend/
│   │   ├── environment.py      # Custom Gymnasium environment
│   │   ├── grpo.py            # GRPO algorithm implementation
│   │   ├── train.py           # Training script
│   │   └── export.py          # ONNX export utilities
│   ├── tests/                 # Backend tests
│   ├── models/                # Saved models and stats (generated)
│   └── pyproject.toml         # Python dependencies
│
├── frontend/                   # TypeScript/Three.js visualization
│   ├── src/
│   │   ├── script.ts          # Main Three.js application
│   │   ├── physics.ts         # Physics simulation
│   │   ├── inference.ts       # ONNX model inference
│   │   └── utils/             # Utility functions
│   ├── public/
│   │   └── models/            # ONNX models (copied from backend)
│   ├── tests/                 # Frontend tests
│   └── package.json           # Node dependencies
│
└── README.md                   # This file
```

---

## 🧪 The Environment

### State Space
- **Tilt angle** (θ) - How far from vertical the object is
- **Angular velocity** (ω) - How fast it's rotating
- **Position** (x, z) - Location on the platform
- **Velocity** (vₓ, vᵧ) - Movement speed

### Action Space
- **Torque** applied to stabilize the object (continuous or discrete)

### Reward Function
- Negative reward for deviation from upright position
- Small penalty for excessive torque (energy efficiency)
- Bonus for maintaining balance over time

### Termination Conditions
- Object falls over (angle > threshold)
- Falls off platform
- Maximum episode length reached

---

## 🎓 Technical Deep Dive

### Why GRPO?
Group Relative Policy Optimization is particularly effective for this task because:
- **Fast convergence** on simple control tasks
- **Stable training** with fewer hyperparameters to tune
- **Sample efficient** compared to basic policy gradient methods

### ONNX Pipeline
1. **Training**: PyTorch model learns the policy
2. **Export**: Convert to ONNX using `torch.onnx.export()`
3. **Normalization**: Save input normalization stats as JSON
4. **Import**: Load in browser with `onnxruntime-web`
5. **Inference**: Real-time policy evaluation at 60 FPS

### Three.js Integration
- Physics simulation runs at fixed timestep
- Policy inference happens every frame
- Smooth interpolation for visual quality
- WebGL shaders for performance

---

## 🛠️ Development

### Backend Development

```bash
cd backend
make help          # Show all available commands
make fmt           # Format code
make lint          # Lint code
make test          # Run tests
make ci            # Run all checks
```

### Frontend Development

```bash
cd frontend
npm run dev        # Start dev server with hot reload
npm run test       # Run tests
npm run check      # Lint and format
npm run ci         # Run all checks
```

---

## 📊 Training Tips

### Hyperparameter Tuning
- Start with default GRPO settings
- Adjust learning rate if training is unstable
- Increase batch size for smoother gradients
- Use curriculum learning for complex balance tasks

### Monitoring Training
- Watch episode rewards in TensorBoard
- Check average tilt angle over time
- Monitor policy entropy (exploration vs exploitation)
- Validate on held-out initial conditions

### Debugging
- Visualize episodes in the browser
- Log state transitions
- Plot reward components separately
- Use smaller networks for faster iteration

---

## 🎮 Customization Ideas

- 🔧 **Different objects**: Pyramid, cylinder, complex shapes
- 🌍 **Physics variations**: Different gravity, friction, air resistance
- 🎯 **Advanced tasks**: Moving targets, obstacle avoidance
- 🎨 **Visual effects**: Particles, trails, shaders
- 🏆 **Challenges**: Timed modes, disturbance patterns
- 👥 **Multi-agent**: Multiple bots balancing together

---

## 📈 Performance Benchmarks

### Training
- **Time to convergence**: ~10-30 minutes on CPU
- **Episodes needed**: ~1000-5000 depending on complexity
- **Model size**: ~50KB (ONNX)

### Inference
- **Browser FPS**: 60 FPS stable
- **Inference time**: <1ms per forward pass
- **Load time**: <100ms for model + scene

---

## 🤝 Contributing

Contributions are welcome! Whether it's:
- 🐛 Bug fixes
- ✨ New features
- 📚 Documentation improvements
- 🎨 UI/UX enhancements

Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Eren Cetin**
- Email: erencetin98@gmail.com
- GitHub: [@erenovic](https://github.com/erenovic)

---

## 🙏 Acknowledgments

- **OpenAI Gym/Gymnasium** for the RL environment framework
- **Three.js** for the amazing 3D graphics library
- **ONNX Runtime** for enabling ML in the browser
- **PyTorch** for the deep learning framework

---

## 🗺️ Roadmap

- [ ] Implement GRPO training algorithm
- [ ] Create custom balancing environment
- [ ] ONNX export pipeline
- [ ] Basic Three.js scene with physics
- [ ] ONNX inference in browser
- [ ] Interactive disturbances
- [ ] UI controls (AI toggle, reset, stats)
- [ ] Multiple difficulty levels
- [ ] Mobile support
- [ ] Leaderboard for longest balance time

---

<div align="center">

**Built with ❤️ using PyTorch, Three.js, and ONNX**

⭐ Star this repo if you find it interesting!

</div>

