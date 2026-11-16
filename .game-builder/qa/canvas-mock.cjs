// Navigation QA only. Supplies in-memory canvas images without a DOM or GPU.
// Rectangles/gradients have pixel data; text/path calls are intentionally only
// recorded, since this harness validates world geometry rather than artwork.
function installCanvasMock() {
  const canvases = [];
  const rgba = value => {
    if (typeof value !== 'string') return [128, 128, 128, 255];
    if (value[0] === '#') {
      let s = value.slice(1); if (s.length === 3) s = s.split('').map(x => x + x).join('');
      const v = parseInt(s, 16); return [v >> 16 & 255, v >> 8 & 255, v & 255, 255];
    }
    const m = value.match(/rgba?\(([^)]+)\)/);
    if (m) { const v = m[1].split(',').map(Number); return [v[0], v[1], v[2], Math.round((v[3] ?? 1) * 255)]; }
    return value === 'black' ? [0, 0, 0, 255] : value === 'transparent' ? [0, 0, 0, 0] : [255, 255, 255, 255];
  };
  function gradient(args, radial = false) {
    const stops = [];
    return { addColorStop(t, color) { stops.push([t, rgba(color)]); stops.sort((a, b) => a[0] - b[0]); },
      sample(x, y) {
        let t;
        if (radial) t = (Math.hypot(x - args[3], y - args[4]) - args[2]) / Math.max(.001, args[5] - args[2]);
        else { const dx = args[2] - args[0], dy = args[3] - args[1]; t = ((x - args[0]) * dx + (y - args[1]) * dy) / Math.max(.001, dx * dx + dy * dy); }
        let a = stops[0] || [0, [0, 0, 0, 0]], b = stops.at(-1) || a;
        for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) { a = stops[i - 1]; b = stops[i]; break; }
        const q = Math.max(0, Math.min(1, (t - a[0]) / Math.max(.001, b[0] - a[0])));
        return a[1].map((v, i) => v + (b[1][i] - v) * q);
      } };
  }
  class Canvas {
    constructor() { this._width = 300; this._height = 150; this.data = null; this.drawCalls = 0; this.ctx = new Context(this); canvases.push(this); }
    get width() { return this._width; } set width(v) { this._width = v; this.data = null; }
    get height() { return this._height; } set height(v) { this._height = v; this.data = null; }
    getContext(type) { if (type !== '2d') throw Error('Only 2D canvas is mocked'); return this.ctx; }
    get pixels() { return this.data ||= new Uint8ClampedArray(this.width * this.height * 4); }
  }
  class Context {
    constructor(canvas) { this.canvas = canvas; this.fillStyle = '#000'; this.globalAlpha = 1; this.globalCompositeOperation = 'source-over'; this._state = []; }
    fillRect(x, y, w, h) {
      const canvas = this.canvas, data = canvas.pixels, style = this.fillStyle;
      const solid = style?.sample ? null : rgba(style);
      const x0 = Math.max(0, Math.floor(x)), y0 = Math.max(0, Math.floor(y));
      const x1 = Math.min(canvas.width, Math.ceil(x + w)), y1 = Math.min(canvas.height, Math.ceil(y + h));
      for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) {
        const p = (yy * canvas.width + xx) * 4, c = solid || style.sample(xx, yy), a = c[3] / 255 * this.globalAlpha;
        if (this.globalCompositeOperation === 'destination-out') { data[p + 3] *= 1 - a; continue; }
        for (let k = 0; k < 3; k++) data[p + k] = c[k] * a + data[p + k] * (1 - a);
        data[p + 3] = Math.min(255, c[3] * this.globalAlpha + data[p + 3] * (1 - a));
      }
      canvas.drawCalls++;
    }
    clearRect(x, y, w, h) { const a = this.globalCompositeOperation; this.globalCompositeOperation = 'destination-out'; this.fillRect(x, y, w, h); this.globalCompositeOperation = a; }
    createLinearGradient(...a) { return gradient(a); } createRadialGradient(...a) { return gradient(a, true); }
    save() { this._state.push([this.fillStyle, this.globalAlpha, this.globalCompositeOperation]); }
    restore() { const s = this._state.pop(); if (s) [this.fillStyle, this.globalAlpha, this.globalCompositeOperation] = s; }
    beginPath() {} closePath() {} moveTo() {} lineTo() {} arc() {} ellipse() {} rect() {} clip() {}
    fill() { this.canvas.drawCalls++; } stroke() { this.canvas.drawCalls++; } strokeRect() { this.canvas.drawCalls++; }
    fillText() { this.canvas.drawCalls++; } strokeText() { this.canvas.drawCalls++; }
    translate() {} rotate() {} scale() {} setTransform() {} drawImage() {}
    measureText(text) { return { width: String(text).length * 12 }; }
    getImageData() { return { width: this.canvas.width, height: this.canvas.height, data: this.canvas.pixels }; }
    createImageData(w, h) { return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }; }
    putImageData(image) { this.canvas.data = image.data; }
  }
  global.document = { createElement(name) { if (name !== 'canvas') throw Error('Unexpected DOM element ' + name); return new Canvas(); } };
  return { canvases, summary() { return { count: canvases.length, drawCalls: canvases.reduce((n, c) => n + c.drawCalls, 0), pixelBytes: canvases.reduce((n, c) => n + (c.data?.length || 0), 0) }; } };
}
module.exports = { installCanvasMock };
