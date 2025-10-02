
import {
  degreesToRadians,
  radiansToDegrees,
  clamp,
  lerp,
  map,
  random,
  approximately,
} from '../../src/utils/math';

describe('Math Utilities', () => {
  describe('degreesToRadians', () => {
    it('should convert degrees to radians correctly', () => {
      expect(degreesToRadians(0)).toBe(0);
      expect(degreesToRadians(90)).toBeCloseTo(Math.PI / 2);
      expect(degreesToRadians(180)).toBeCloseTo(Math.PI);
      expect(degreesToRadians(360)).toBeCloseTo(Math.PI * 2);
    });

    it('should handle negative degrees', () => {
      expect(degreesToRadians(-90)).toBeCloseTo(-Math.PI / 2);
      expect(degreesToRadians(-180)).toBeCloseTo(-Math.PI);
    });
  });

  describe('radiansToDegrees', () => {
    it('should convert radians to degrees correctly', () => {
      expect(radiansToDegrees(0)).toBe(0);
      expect(radiansToDegrees(Math.PI / 2)).toBeCloseTo(90);
      expect(radiansToDegrees(Math.PI)).toBeCloseTo(180);
      expect(radiansToDegrees(Math.PI * 2)).toBeCloseTo(360);
    });

    it('should handle negative radians', () => {
      expect(radiansToDegrees(-Math.PI / 2)).toBeCloseTo(-90);
      expect(radiansToDegrees(-Math.PI)).toBeCloseTo(-180);
    });
  });

  describe('clamp', () => {
    it('should clamp values within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should handle edge cases', () => {
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });
  });

  describe('lerp', () => {
    it('should interpolate between two values', () => {
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(0, 10, 0.5)).toBe(5);
      expect(lerp(0, 10, 1)).toBe(10);
    });

    it('should clamp interpolation factor', () => {
      expect(lerp(0, 10, -0.5)).toBe(0);
      expect(lerp(0, 10, 1.5)).toBe(10);
    });

    it('should work with negative values', () => {
      expect(lerp(-10, 10, 0.5)).toBe(0);
      expect(lerp(10, -10, 0.5)).toBe(0);
    });
  });

  describe('map', () => {
    it('should map values from one range to another', () => {
      expect(map(5, 0, 10, 0, 100)).toBe(50);
      expect(map(0, 0, 10, 0, 100)).toBe(0);
      expect(map(10, 0, 10, 0, 100)).toBe(100);
    });

    it('should handle different ranges', () => {
      expect(map(5, 0, 10, -50, 50)).toBe(0);
      expect(map(2.5, 0, 10, -100, 100)).toBe(-50);
    });
  });

  describe('random', () => {
    it('should generate random numbers within range', () => {
      for (let i = 0; i < 100; i++) {
        const value = random(0, 10);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(10);
      }
    });

    it('should handle negative ranges', () => {
      for (let i = 0; i < 100; i++) {
        const value = random(-10, 0);
        expect(value).toBeGreaterThanOrEqual(-10);
        expect(value).toBeLessThan(0);
      }
    });

    it('should handle single point range', () => {
      const value = random(5, 5);
      expect(value).toBe(5);
    });
  });

  describe('approximately', () => {
    it('should compare numbers with default epsilon', () => {
      expect(approximately(1, 1)).toBe(true);
      expect(approximately(1, 1.0000001)).toBe(true);
      expect(approximately(1, 1.1)).toBe(false);
    });

    it('should compare numbers with custom epsilon', () => {
      expect(approximately(1, 1.1, 0.2)).toBe(true);
      expect(approximately(1, 1.1, 0.05)).toBe(false);
    });

    it('should handle negative numbers', () => {
      expect(approximately(-1, -1.0000001)).toBe(true);
      expect(approximately(-1, -1.1)).toBe(false);
    });
  });
});
