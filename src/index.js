/**
 * ParaVi - 2.5D Parallax Visualization Framework
 * Main entry point for the library
 */

import ParallaxScene from './ParallaxScene.js';
import ParallaxLayer from './ParallaxLayer.js';
import DataLayer from './DataLayer.js';

// Export all components
export {
  ParallaxScene,
  ParallaxLayer,
  DataLayer
};

// Also create a global ParaVi object for non-module usage
if (typeof window !== 'undefined') {
  window.ParaVi = {
    ParallaxScene,
    ParallaxLayer,
    DataLayer
  };
}
