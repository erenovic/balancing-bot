
// Jest setup file for global test configuration

// Mock WebGL context for Three.js testing
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn(() => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
    putImageData: jest.fn(),
    createImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    fillText: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    transform: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn(),
  })),
});

// Mock WebGL context
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn((contextType) => {
    if (contextType === 'webgl' || contextType === 'webgl2') {
      return {
        getExtension: jest.fn(),
        getParameter: jest.fn(),
        createShader: jest.fn(),
        shaderSource: jest.fn(),
        compileShader: jest.fn(),
        createProgram: jest.fn(),
        attachShader: jest.fn(),
        linkProgram: jest.fn(),
        useProgram: jest.fn(),
        createBuffer: jest.fn(),
        bindBuffer: jest.fn(),
        bufferData: jest.fn(),
        createTexture: jest.fn(),
        bindTexture: jest.fn(),
        texImage2D: jest.fn(),
        texParameteri: jest.fn(),
        createFramebuffer: jest.fn(),
        bindFramebuffer: jest.fn(),
        framebufferTexture2D: jest.fn(),
        viewport: jest.fn(),
        clear: jest.fn(),
        enable: jest.fn(),
        disable: jest.fn(),
        depthFunc: jest.fn(),
        depthMask: jest.fn(),
        blendFunc: jest.fn(),
        drawArrays: jest.fn(),
        drawElements: jest.fn(),
        VERTEX_SHADER: 35633,
        FRAGMENT_SHADER: 35632,
        COMPILE_STATUS: 35713,
        LINK_STATUS: 35714,
        COLOR_BUFFER_BIT: 16384,
        DEPTH_BUFFER_BIT: 256,
        STENCIL_BUFFER_BIT: 1024,
        DEPTH_TEST: 2929,
        BLEND: 3042,
        SRC_ALPHA: 770,
        ONE_MINUS_SRC_ALPHA: 771,
      };
    }
    return null;
  }),
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn();

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Suppress console errors during tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('WebGL')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
