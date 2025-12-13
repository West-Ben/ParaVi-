/**
 * DataLayer - Specialized layer for data visualization
 * Binds data to visual elements with automatic positioning and styling
 */
import ParallaxLayer from './ParallaxLayer.js';

class DataLayer extends ParallaxLayer {
  constructor(options = {}) {
    super(options);
    this.data = options.data || [];
    this.visualType = options.visualType || 'circle'; // circle, rectangle, path
    this.colorScale = options.colorScale || this.defaultColorScale;
    this.sizeScale = options.sizeScale || this.defaultSizeScale;
  }
  
  /**
   * Default color scale - maps values to colors
   */
  defaultColorScale(value, min, max) {
    const normalized = (value - min) / (max - min);
    const hue = (1 - normalized) * 240; // Blue to red
    return `hsl(${hue}, 70%, 50%)`;
  }
  
  /**
   * Default size scale - maps values to sizes
   */
  defaultSizeScale(value, min, max) {
    const normalized = (value - min) / (max - min);
    return 5 + normalized * 20; // 5px to 25px
  }
  
  /**
   * Render data points as visual elements
   */
  renderData(data, dimensions) {
    this.clear();
    this.data = data;
    
    if (!data || data.length === 0) return;
    
    // Calculate data bounds for scaling
    const bounds = this.calculateBounds(data, dimensions);
    
    // Create visual element for each data point
    data.forEach(point => {
      const element = this.createDataElement(point, dimensions, bounds);
      this.addDataPoint({ element, data: point });
    });
  }
  
  /**
   * Calculate min/max bounds for each dimension
   */
  calculateBounds(data, dimensions) {
    const bounds = {};
    
    Object.keys(dimensions).forEach(key => {
      const values = data.map(d => d[key]).filter(v => v !== undefined && v !== null);
      bounds[key] = {
        min: Math.min(...values),
        max: Math.max(...values)
      };
    });
    
    return bounds;
  }
  
  /**
   * Create a visual element for a data point
   */
  createDataElement(dataPoint, dimensions, bounds) {
    const element = document.createElement('div');
    element.className = 'data-point';
    element.style.position = 'absolute';
    
    // Calculate position
    const x = this.scaleValue(
      dataPoint[dimensions.x],
      bounds[dimensions.x].min,
      bounds[dimensions.x].max,
      0,
      100
    );
    const y = this.scaleValue(
      dataPoint[dimensions.y],
      bounds[dimensions.y].min,
      bounds[dimensions.y].max,
      0,
      100
    );
    
    element.style.left = `${x}%`;
    element.style.top = `${y}%`;
    
    // Calculate size based on value dimension (if provided)
    let size = 10;
    if (dimensions.size && dataPoint[dimensions.size] !== undefined) {
      size = this.sizeScale(
        dataPoint[dimensions.size],
        bounds[dimensions.size].min,
        bounds[dimensions.size].max
      );
    }
    
    // Calculate color based on color dimension (if provided)
    let color = '#3498db';
    if (dimensions.color && dataPoint[dimensions.color] !== undefined) {
      color = this.colorScale(
        dataPoint[dimensions.color],
        bounds[dimensions.color].min,
        bounds[dimensions.color].max
      );
    }
    
    // Apply visual style based on type
    this.applyVisualStyle(element, this.visualType, size, color);
    
    // Add tooltip with data
    element.title = this.formatTooltip(dataPoint, dimensions);
    
    return element;
  }
  
  /**
   * Apply visual styling based on type
   */
  applyVisualStyle(element, type, size, color) {
    element.style.width = `${size}px`;
    element.style.height = `${size}px`;
    element.style.backgroundColor = color;
    element.style.transition = 'all 0.3s ease';
    
    // Store base transform based on type
    let baseTransform = 'translate(-50%, -50%)';
    switch (type) {
      case 'circle':
        element.style.borderRadius = '50%';
        break;
      case 'rectangle':
        element.style.borderRadius = '2px';
        break;
      case 'diamond':
        baseTransform = 'translate(-50%, -50%) rotate(45deg)';
        break;
    }
    
    element.style.transform = baseTransform;
    element.dataset.baseTransform = baseTransform;
    
    // Add hover effect
    element.addEventListener('mouseenter', () => {
      element.style.transform = `${element.dataset.baseTransform} scale(1.5)`;
      element.style.zIndex = '1000';
    });
    
    element.addEventListener('mouseleave', () => {
      element.style.transform = element.dataset.baseTransform;
      element.style.zIndex = 'auto';
    });
  }
  
  /**
   * Scale a value from one range to another
   */
  scaleValue(value, inMin, inMax, outMin, outMax) {
    if (inMax === inMin) return outMin;
    return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
  }
  
  /**
   * Format tooltip text
   */
  formatTooltip(dataPoint, dimensions) {
    const parts = [];
    Object.keys(dimensions).forEach(key => {
      const dim = dimensions[key];
      if (dataPoint[dim] !== undefined) {
        parts.push(`${dim}: ${dataPoint[dim]}`);
      }
    });
    return parts.join('\n');
  }
}

export default DataLayer;
