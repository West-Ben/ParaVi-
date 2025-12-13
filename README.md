# ParaVi - 2.5D Parallax Visualization Framework

A lightweight web-based framework for creating interactive 2.5-dimensional (2.5D) parallax-based data visualizations using standard web technologies. ParaVi simulates depth through layered 2D visuals with parallax motion, allowing complex multi-dimensional data to be explored smoothly without GPU-heavy 3D rendering.

## Features

- **2.5D Depth Simulation**: Creates the illusion of depth using parallax scrolling without WebGL or 3D rendering
- **Interactive Exploration**: Smooth mouse and touch-based interaction for exploring data
- **Multi-Layer Architecture**: Support for multiple depth layers with independent parallax effects
- **Data-Driven Visualizations**: Built-in support for binding data to visual elements
- **Performance Optimized**: Uses CSS3 transforms and requestAnimationFrame for smooth 60fps animations
- **Responsive**: Works on desktop and mobile devices with touch support
- **Zero Dependencies**: Pure JavaScript with no external dependencies

## Quick Start

### Installation

Clone the repository or download the source files:

```bash
git clone https://github.com/West-Ben/ParaVi-.git
cd ParaVi-
```

### Running the Demo

Start a local web server:

```bash
npm run dev
```

Then open your browser to `http://localhost:8000/examples/`

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="css/paravi.css">
</head>
<body>
  <div id="visualization" style="width: 100vw; height: 100vh;"></div>
  
  <script type="module">
    import { ParallaxScene, DataLayer } from './src/index.js';
    
    // Create a scene
    const scene = new ParallaxScene('#visualization', {
      parallaxStrength: 0.05,
      smoothing: 0.1
    });
    
    // Create a data layer
    const dataLayer = new DataLayer({
      depth: 1.0,
      visualType: 'circle'
    });
    
    // Sample data
    const data = [
      { x: 20, y: 30, value: 50, size: 15 },
      { x: 60, y: 70, value: 80, size: 20 },
      { x: 40, y: 50, value: 30, size: 10 }
    ];
    
    // Render data
    dataLayer.renderData(data, {
      x: 'x',
      y: 'y',
      color: 'value',
      size: 'size'
    });
    
    // Add to scene
    scene.addLayer(dataLayer);
  </script>
</body>
</html>
```

## Core Concepts

### ParallaxScene

The main controller that manages layers and handles user interaction.

```javascript
const scene = new ParallaxScene(container, {
  parallaxStrength: 0.05,  // How much layers move (0-1)
  smoothing: 0.1,          // Animation smoothing (0-1)
  interactive: true        // Enable/disable mouse interaction
});
```

**Methods:**
- `addLayer(layer)` - Add a layer to the scene
- `removeLayer(layer)` - Remove a layer
- `clear()` - Remove all layers
- `setParallaxStrength(value)` - Adjust parallax intensity
- `setSmoothing(value)` - Adjust animation smoothness
- `destroy()` - Clean up and stop animations

### ParallaxLayer

Represents a single visual layer with a specific depth.

```javascript
const layer = new ParallaxLayer({
  depth: 1.0,    // Depth value (higher = closer to viewer)
  opacity: 1.0,  // Layer opacity (0-1)
  scale: 1.0     // Layer scale
});
```

**Methods:**
- `addDataPoint(dataPoint)` - Add a visual element to the layer
- `clear()` - Remove all elements
- `updatePosition(deltaX, deltaY, strength)` - Update parallax position

### DataLayer

Specialized layer for data visualization with automatic data binding.

```javascript
const dataLayer = new DataLayer({
  depth: 1.0,
  visualType: 'circle',  // 'circle', 'rectangle', or 'diamond'
  colorScale: customColorFunction,
  sizeScale: customSizeFunction
});

dataLayer.renderData(data, {
  x: 'xField',      // Data field for x position
  y: 'yField',      // Data field for y position
  color: 'value',   // Data field for color
  size: 'size'      // Data field for size
});
```

## Architecture

ParaVi uses a layered architecture to simulate depth:

1. **Background Layer** (depth: 0-0.5): Moves slowly, appears far away
2. **Middle Layer** (depth: 0.5-1.0): Standard depth
3. **Foreground Layer** (depth: 1.0-2.0): Moves quickly, appears close

Each layer's parallax effect is proportional to its depth value, creating the illusion of 3D space while remaining purely 2D.

## Use Cases

- **Multi-dimensional Data Visualization**: Display 3+ dimensions of data using position, color, size, and depth
- **Interactive Dashboards**: Create engaging data exploration interfaces
- **Data Storytelling**: Guide users through complex datasets with depth-based narrative
- **Scientific Visualization**: Visualize complex relationships in research data
- **Business Intelligence**: Present KPIs and metrics in an engaging format

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers with touch support

## Technology Stack

- Pure JavaScript (ES6+ modules)
- CSS3 Transforms
- HTML5

## Performance Considerations

- Uses `transform3d` for hardware acceleration
- RequestAnimationFrame for smooth animations
- Optimized for 60fps on modern devices
- No canvas or WebGL overhead

## License

Apache License 2.0 - See LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Future Enhancements

- [ ] Additional visual primitives (lines, polygons, etc.)
- [ ] Animation transitions between datasets
- [ ] Export visualizations as images/videos
- [ ] More built-in color schemes
- [ ] Advanced data filtering and selection
- [ ] WebGL renderer option for very large datasets

## Credits

ParaVi is designed for analysts and developers who need to create engaging, interactive visualizations without the complexity of full 3D graphics engines.