const SNAPSHOT_EVENT = 'paravi:chartSnapshot';
const DEFAULT_MODEL_PATH = './models/parallax-chart-model.json';

/**
 * Convert the tabular rows defined in the JSON model into objects.
 */
function inflateTable(table) {
  if (!table || !Array.isArray(table.columns) || !Array.isArray(table.rows)) {
    return [];
  }

  return table.rows.map(row => {
    const record = {};
    table.columns.forEach((column, index) => {
      record[column] = row[index];
    });
    return record;
  });
}

function clamp(value, min, max) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

class ChartControls {
  constructor(config = {}) {
    this.modelPath = config.modelPath || DEFAULT_MODEL_PATH;
    this.factory = this.ensureFactory(config.factorySelector || '#chart-snapshot-factory');
    this.colorSelect = document.getElementById('color-mode');
    this.sizeSelect = document.getElementById('size-mode');
    this.tableBody = document.querySelector('#mock-data-table tbody');
    this.tableHeader = document.querySelector('#mock-data-table thead tr');
    this.titleElement = document.getElementById('chart-title');
    this.descriptionElement = document.getElementById('chart-description');
    this.statusElement = document.getElementById('chart-status');
  }

  ensureFactory(selector) {
    let factory = document.querySelector(selector);
    if (!factory) {
      factory = document.createElement('div');
      factory.id = selector.replace('#', '');
      document.body.appendChild(factory);
    }
    factory.setAttribute('aria-hidden', 'true');
    factory.style.position = 'absolute';
    factory.style.opacity = '0';
    factory.style.pointerEvents = 'none';
    factory.style.width = '0';
    factory.style.height = '0';
    return factory;
  }

  async init() {
    this.model = await this.loadModel();
    this.rows = inflateTable(this.model.table);
    this.currentColorField = this.model?.encoding?.color?.field || null;
    this.currentSizeField = this.model?.encoding?.size?.field || null;

    this.populateSelects();
    this.bindEvents();
    this.renderTable();
    this.renderMetadata();
    await this.refreshSnapshot();
  }

  async loadModel() {
    const response = await fetch(this.modelPath);
    if (!response.ok) {
      throw new Error(`Unable to load chart model from ${this.modelPath}`);
    }
    return response.json();
  }

  populateSelects() {
    const colorOptions = this.buildOptions([
      this.model?.encoding?.color,
      this.model?.axes?.x,
      this.model?.axes?.y
    ]);
    const sizeOptions = this.buildOptions([
      this.model?.encoding?.size,
      { field: 'confidence', label: 'Executive Confidence' },
      { field: 'riskExposure', label: 'Risk Exposure %' }
    ]);

    this.populateSelect(this.colorSelect, colorOptions, this.currentColorField);
    this.populateSelect(this.sizeSelect, sizeOptions, this.currentSizeField);
  }

  buildOptions(descriptors = []) {
    const seen = new Set();
    const options = [];
    descriptors.forEach(desc => {
      if (!desc || !desc.field || seen.has(desc.field)) return;
      seen.add(desc.field);
      options.push({
        value: desc.field,
        label: desc.label || desc.field
      });
    });
    return options;
  }

  populateSelect(select, options, activeValue) {
    if (!select) return;
    select.innerHTML = '';
    options.forEach(option => {
      const opt = document.createElement('option');
      opt.value = option.value;
      opt.textContent = option.label;
      if (option.value === activeValue) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });
  }

  bindEvents() {
    if (this.colorSelect) {
      this.colorSelect.addEventListener('change', async () => {
        this.currentColorField = this.colorSelect.value;
        await this.refreshSnapshot();
      });
    }

    if (this.sizeSelect) {
      this.sizeSelect.addEventListener('change', async () => {
        this.currentSizeField = this.sizeSelect.value;
        await this.refreshSnapshot();
      });
    }
  }

  renderMetadata() {
    if (this.titleElement && this.model?.title) {
      this.titleElement.textContent = this.model.title;
    }
    if (this.descriptionElement && this.model?.description) {
      this.descriptionElement.textContent = this.model.description;
    }
    if (this.statusElement) {
      this.statusElement.textContent = `${this.rows.length} initiatives in view`;
    }
  }

  renderTable() {
    if (!this.tableBody || !this.tableHeader || !this.model?.table?.columns) {
      return;
    }

    this.tableHeader.innerHTML = '';
    this.model.table.columns.forEach(column => {
      const th = document.createElement('th');
      th.textContent = column;
      this.tableHeader.appendChild(th);
    });

    this.tableBody.innerHTML = '';
    this.rows.forEach(row => {
      const tr = document.createElement('tr');
      this.model.table.columns.forEach(column => {
        const td = document.createElement('td');
        let value = row[column];
        if (typeof value === 'number') {
          value = column === 'confidence'
            ? `${Math.round(value * 100)}%`
            : value.toFixed(0);
        }
        td.textContent = value;
        tr.appendChild(td);
      });
      this.tableBody.appendChild(tr);
    });
  }

  async refreshSnapshot() {
    if (!window.Chart) {
      console.warn('Chart.js is not available in the global scope.');
      return;
    }

    const config = this.buildChartConfig();
    const layerConfig = this.model?.layers?.[0];
    const dimensions = layerConfig?.canvas || { width: 900, height: 560 };
    const snapshot = await this.createSnapshot(config, dimensions);

    window.dispatchEvent(new CustomEvent(SNAPSHOT_EVENT, {
      detail: {
        snapshot,
        model: this.model,
        modes: {
          color: this.currentColorField,
          size: this.currentSizeField
        },
        rows: this.rows
      }
    }));
  }

  buildChartConfig() {
    const xField = this.model?.axes?.x?.field;
    const yField = this.model?.axes?.y?.field;

    const axisDomainX = this.computeDomain(xField);
    const axisDomainY = this.computeDomain(yField);
    const dataset = this.rows.map(row => ({
      x: row[xField],
      y: row[yField],
      radius: this.computeRadius(row),
      color: this.computeColor(row),
      label: row.segment,
      risk: row.riskExposure,
      adoption: row.marketAdoption,
      innovation: row.innovationIndex,
      confidence: row.confidence,
      priorityBand: row.priorityBand
    }));

    const datasetConfig = {
      label: this.model?.title || 'Parallax Chart',
      data: dataset,
      pointBackgroundColor: dataset.map(point => point.color),
      pointBorderColor: dataset.map(() => 'rgba(255, 255, 255, 0.45)'),
      pointRadius: ctx => ctx.raw.radius,
      pointHoverRadius: ctx => ctx.raw.radius * 1.2,
      pointBorderWidth: 1.25,
      showLine: false
    };

    const chartBackgroundPlugin = {
      id: 'paraviBackground',
      beforeDraw(chart) {
        const { ctx, chartArea } = chart;
        ctx.save();
        ctx.fillStyle = '#05091d';
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.fillStyle = '#0f1533';
        ctx.fillRect(chartArea.left - 24, chartArea.top - 24, chartArea.width + 48, chartArea.height + 48);
        ctx.restore();
      }
    };

    return {
      type: 'scatter',
      data: { datasets: [datasetConfig] },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        animation: false,
        layout: {
          padding: 32
        },
        plugins: {
          legend: { display: false },
          title: {
            display: Boolean(this.model?.title),
            text: this.model?.title,
            color: '#e4e9ff',
            font: { size: 18, family: 'Segoe UI, sans-serif' }
          },
          tooltip: {
            callbacks: {
              label(context) {
                const raw = context.raw;
                const confidence = raw.confidence ? `${Math.round(raw.confidence * 100)}%` : 'n/a';
                return `${raw.label}: Innovation ${raw.innovation}, Adoption ${raw.adoption}, Risk ${raw.risk}%, Confidence ${confidence}`;
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: Boolean(this.model?.axes?.x?.label),
              text: this.model?.axes?.x?.label,
              color: '#a5b4ff'
            },
            grid: { color: 'rgba(255, 255, 255, 0.08)' },
            ticks: { color: '#94a3ff' },
            min: axisDomainX.min,
            max: axisDomainX.max
          },
          y: {
            title: {
              display: Boolean(this.model?.axes?.y?.label),
              text: this.model?.axes?.y?.label,
              color: '#a5b4ff'
            },
            grid: { color: 'rgba(255, 255, 255, 0.08)' },
            ticks: { color: '#94a3ff' },
            min: axisDomainY.min,
            max: axisDomainY.max
          }
        }
      },
      plugins: [chartBackgroundPlugin]
    };
  }

  computeDomain(field) {
    if (!field || !this.rows?.length) {
      return { min: 0, max: 100 };
    }
    const values = this.rows
      .map(row => Number(row[field]))
      .filter(value => Number.isFinite(value));
    if (!values.length) {
      return { min: 0, max: 100 };
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1 || 5;
    return {
      min: Math.floor(min - padding),
      max: Math.ceil(max + padding)
    };
  }

  computeColor(row) {
    const field = this.currentColorField;
    if (!field || typeof row[field] !== 'number') {
      return 'rgba(102, 126, 234, 0.9)';
    }
    const domain = this.getDomain(field, this.model?.encoding?.color?.scale);
    const normalized = (row[field] - domain.min) / (domain.max - domain.min || 1);
    const hue = clamp(220 - normalized * 180, 10, 220);
    return `hsla(${hue}, 75%, 60%, 0.95)`;
  }

  computeRadius(row) {
    const field = this.currentSizeField;
    if (!field || typeof row[field] !== 'number') {
      return 10;
    }
    const scale = this.getDomain(field, this.model?.encoding?.size?.scale);
    return this.scaleValue(row[field], scale.min, scale.max, 8, 26);
  }

  getDomain(field, preferredScale) {
    if (preferredScale && field === this.currentColorField) {
      return preferredScale;
    }
    if (preferredScale && field === this.currentSizeField) {
      return preferredScale;
    }

    return this.computeDomain(field);
  }

  scaleValue(value, inMin, inMax, outMin, outMax) {
    if (inMax === inMin) {
      return outMin;
    }
    const ratio = (value - inMin) / (inMax - inMin);
    return outMin + ratio * (outMax - outMin);
  }

  async createSnapshot(config, dimensions) {
    const canvas = document.createElement('canvas');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    this.factory.appendChild(canvas);

    const chart = new window.Chart(canvas.getContext('2d'), config);
    const snapshot = await this.capture(canvas);

    chart.destroy();
    canvas.remove();
    return snapshot;
  }

  async capture(canvas) {
    if (window.createImageBitmap) {
      try {
        const bitmap = await createImageBitmap(canvas);
        return { bitmap, width: canvas.width, height: canvas.height };
      } catch (error) {
        console.warn('Falling back to data URL snapshot', error);
      }
    }

    return {
      dataUrl: canvas.toDataURL('image/png'),
      width: canvas.width,
      height: canvas.height
    };
  }
}

const controller = new ChartControls();
controller.init().catch(error => {
  console.error('Failed to initialize ChartControls', error);
});

export default ChartControls;
