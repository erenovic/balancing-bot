# frontend

Threejs frontend which employs the trained policy for balancing bot
[![CI](https://github.com/erenovic/frontend/workflows/CI/badge.svg)](https://github.com/erenovic/frontend/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r168+-green.svg)](https://threejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- ✅ **Three.js r168+** with TypeScript support
- ✅ **Vite** for fast development and optimized builds
- ✅ **Biome** for ultra-fast linting and formatting
- ✅ **Jest** testing with Three.js mocks
- ✅ **Git hooks** with Husky and lint-staged
- ✅ **GitHub Actions** CI/CD
- ✅ **TrackballControls** for interactive camera movement
- ✅ **Path aliases** for clean imports (`@/utils`, `@/components`)
- ✅ **Responsive design** with automatic canvas resizing

## Quick Start

### Prerequisites

- Node.js 18+ and npm 8+
- Modern web browser with WebGL support

### Installation

```bash
# Clone the repository
git clone https://github.com/erenovic/frontend.git
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see your Three.js scene!

## Development

### Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run type-check   # Run TypeScript type checking
npm run lint         # Lint code with Biome
npm run format       # Format code with Biome
npm run check        # Run Biome check (lint + format)
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run clean        # Clean build artifacts and cache
npm run ci           # Run all CI checks locally
```

### Using the Makefile

For convenience, you can also use the included Makefile:

```bash
make help            # Show all available commands
make setup           # Install dependencies and setup git hooks
make dev             # Start development server
make build           # Build for production
make test            # Run tests
make ci              # Run all CI checks
```

## Project Structure

```
src/
├── utils/
│   └── math.ts      # Math utility functions
├── index.html       # Main HTML file
├── script.ts        # Main Three.js application
└── style.css        # Styling
tests/
├── setup.ts         # Jest setup for Three.js
├── script.test.ts   # Main app tests
└── utils/
    └── math.test.ts # Utility tests

static/              # Static assets (textures, models, etc.)
```

## Three.js Scene

The default scene includes:

- **Red Cube**: A simple cube with basic material
- **Camera Controls**: Interactive TrackballControls for camera movement
- **Axes Helper**: Visual coordinate system reference
- **Responsive Canvas**: Automatically resizes with window

### Adding Objects

```typescript
// In script.ts - add to ThreeJSApp class
private createCustomObject(): void {
  const geometry = new THREE.SphereGeometry(0.5);
  const material = new THREE.MeshNormalMaterial();
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(2, 0, 0);
  this.scene.add(sphere);
}
```

### Using Utilities

```typescript
import { degreesToRadians, lerp } from '@/utils/math';

// Convert degrees to radians
const angle = degreesToRadians(45);

// Smooth interpolation
const smoothValue = lerp(0, 10, 0.5); // Returns 5
```

## Testing
The project includes comprehensive testing setup:

```bash
npm run test         # Run all tests
npm run test:watch   # Watch mode for development
npm run test:coverage # Generate coverage report
```

### Writing Tests

```typescript
// tests/myComponent.test.ts
import { ThreeJSApp } from '../src/script';

describe('My Three.js Component', () => {
  it('should create a scene', () => {
    const canvas = document.createElement('canvas');
    const app = new ThreeJSApp(canvas);
    
    expect(app.getScene()).toBeDefined();
    expect(app.getScene().children.length).toBeGreaterThan(0);
    
    app.dispose(); // Clean up resources
  });
});
```

## Build for Production

```bash
npm run build        # Build for production
npm run preview      # Test the build locally
```

Deploy the `dist/` folder to your hosting provider (Netlify, Vercel, GitHub Pages, etc.).

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Eren Cetin** - [erencetin98@gmail.com](mailto:erencetin98@gmail.com)

---

Built with ❤️ using [Three.js](https://threejs.org/), [TypeScript](https://www.typescriptlang.org/), and [Vite](https://vitejs.dev/)