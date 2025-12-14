/**
 * ParallaxLayer - Represents a single layer in the parallax scene
 * Each layer has a depth value that determines its parallax effect strength
 */
class ParallaxLayer {
  constructor(options = {}) {
    this.depth = options.depth || 0; // 0 = background, higher = closer to viewer
    this.element = options.element || this.createLayerElement();
    this.offsetX = 0;
    this.offsetY = 0;
    this.dataPoints = [];
    
    // Visual properties
    this.opacity = options.opacity !== undefined ? options.opacity : 1;
    this.scale = options.scale || 1;
    
    // Apply initial styles
    this.applyStyles();
  }
  
  createLayerElement() {
    const element = document.createElement('div');
    element.className = 'parallax-layer';
    element.style.position = 'absolute';
    element.style.width = '100%';
    element.style.height = '100%';
    element.style.top = '0';
    element.style.left = '0';
    return element;
  }
  
  applyStyles() {
    this.element.style.opacity = this.opacity;
    this.element.style.willChange = 'transform';
  }
  
  /**
   * Update layer position based on parallax offset
   */
  updatePosition(deltaX, deltaY, parallaxStrength = 1) {
    // Apply depth-based parallax effect
    // Layers with higher depth move more (appear closer)
    const depthMultiplier = this.depth * parallaxStrength;
    this.offsetX = deltaX * depthMultiplier;
    this.offsetY = deltaY * depthMultiplier;
    
    // Apply transform
    const scaleTransform = this.scale !== 1 ? ` scale(${this.scale})` : '';
    this.element.style.transform = 
      `translate3d(${this.offsetX}px, ${this.offsetY}px, 0)${scaleTransform}`;
  }
  
  /**
   * Add a data point visualization to this layer
   */
  addDataPoint(dataPoint) {
    this.dataPoints.push(dataPoint);
    if (dataPoint.element) {
      this.element.appendChild(dataPoint.element);
    }
  }
  
  /**
   * Clear all data points from this layer
   */
  clear() {
    this.dataPoints = [];
    this.element.innerHTML = '';
  }
  
  /**
   * Get the current transform offset
   */
  getOffset() {
    return { x: this.offsetX, y: this.offsetY };
  }
}

export default ParallaxLayer;
