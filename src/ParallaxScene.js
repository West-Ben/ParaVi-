/**
 * ParallaxScene - Manages multiple parallax layers and handles user interaction
 * This is the main controller for the 2.5D parallax visualization
 */
class ParallaxScene {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    if (!this.container) {
      throw new Error('Container element not found');
    }
    
    this.layers = [];
    this.parallaxStrength = options.parallaxStrength || 0.05;
    this.smoothing = options.smoothing || 0.1; // For smooth animations
    this.interactive = options.interactive !== false; // Default true
    
    // Mouse/touch position tracking
    this.mouseX = 0;
    this.mouseY = 0;
    this.currentX = 0;
    this.currentY = 0;
    
    // Animation frame
    this.animationFrameId = null;
    
    this.init();
  }
  
  init() {
    // Set up container
    this.container.style.position = 'relative';
    this.container.style.overflow = 'hidden';
    
    // Bind event handlers
    if (this.interactive) {
      this.bindEvents();
    }
    
    // Start animation loop
    this.animate();
  }
  
  bindEvents() {
    // Mouse events
    this.container.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.container.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    
    // Touch events for mobile
    this.container.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.container.addEventListener('touchend', this.handleMouseLeave.bind(this));
  }
  
  handleMouseMove(e) {
    const rect = this.container.getBoundingClientRect();
    // Normalize to -1 to 1 range
    this.mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    this.mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  }
  
  handleTouchMove(e) {
    if (e.touches.length > 0) {
      const rect = this.container.getBoundingClientRect();
      this.mouseX = ((e.touches[0].clientX - rect.left) / rect.width - 0.5) * 2;
      this.mouseY = ((e.touches[0].clientY - rect.top) / rect.height - 0.5) * 2;
      e.preventDefault();
    }
  }
  
  handleMouseLeave() {
    // Return to center when mouse leaves
    this.mouseX = 0;
    this.mouseY = 0;
  }
  
  /**
   * Add a layer to the scene
   */
  addLayer(layer) {
    this.layers.push(layer);
    this.container.appendChild(layer.element);
    
    // Sort layers by depth (background to foreground)
    this.layers.sort((a, b) => a.depth - b.depth);
    
    // Re-order DOM elements
    this.layers.forEach(layer => {
      this.container.appendChild(layer.element);
    });
    
    return layer;
  }
  
  /**
   * Remove a layer from the scene
   */
  removeLayer(layer) {
    const index = this.layers.indexOf(layer);
    if (index > -1) {
      this.layers.splice(index, 1);
      this.container.removeChild(layer.element);
    }
  }
  
  /**
   * Get layer by depth
   */
  getLayer(depth) {
    return this.layers.find(layer => layer.depth === depth);
  }
  
  /**
   * Animation loop - smoothly updates layer positions
   */
  animate() {
    // Smooth interpolation
    this.currentX += (this.mouseX - this.currentX) * this.smoothing;
    this.currentY += (this.mouseY - this.currentY) * this.smoothing;
    
    // Calculate pixel offset based on container size
    const rect = this.container.getBoundingClientRect();
    const deltaX = this.currentX * rect.width * 0.5;
    const deltaY = this.currentY * rect.height * 0.5;
    
    // Update all layers
    this.layers.forEach(layer => {
      layer.updatePosition(deltaX, deltaY, this.parallaxStrength);
    });
    
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
  }
  
  /**
   * Clear all layers
   */
  clear() {
    this.layers.forEach(layer => {
      this.container.removeChild(layer.element);
    });
    this.layers = [];
  }
  
  /**
   * Destroy the scene and clean up
   */
  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.clear();
  }
  
  /**
   * Set parallax strength (how much layers move)
   */
  setParallaxStrength(strength) {
    this.parallaxStrength = strength;
  }
  
  /**
   * Set smoothing factor (how smooth the animation is)
   */
  setSmoothing(smoothing) {
    this.smoothing = smoothing;
  }
}

export default ParallaxScene;
