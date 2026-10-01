/**
 * Visualizer Configuration & Design Tuning Dials
 *
 * Based on taste-skill design principles:
 * - DESIGN_VARIANCE: Layout experimentation (1-10)
 * - MOTION_INTENSITY: Animation depth (1-10)
 * - VISUAL_DENSITY: Information per viewport (1-10)
 */

export interface VisualizerConfig {
  designVariance: number; // 1-10: lower = centered/clean, higher = asymmetric/modern
  motionIntensity: number; // 1-10: lower = hover only, higher = scroll/magnetic
  visualDensity: number; // 1-10: lower = spacious, higher = dense dashboards
  theme: 'light' | 'dark' | 'auto';
}

export const defaultConfig: VisualizerConfig = {
  designVariance: 6,
  motionIntensity: 5,
  visualDensity: 5,
  theme: 'auto',
};

export const presets = {
  editorial: {
    designVariance: 8,
    motionIntensity: 6,
    visualDensity: 4,
    theme: 'light',
  },
  minimalist: {
    designVariance: 2,
    motionIntensity: 2,
    visualDensity: 3,
    theme: 'light',
  },
  brutalist: {
    designVariance: 9,
    motionIntensity: 4,
    visualDensity: 7,
    theme: 'dark',
  },
};
