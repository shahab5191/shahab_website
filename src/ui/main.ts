import vertexShaderSource from "./shaders/vertex.glsl?raw";
import fragmentShaderSource from "./shaders/fragment.glsl?raw";
import "./style.css";
import "./content";

const MAX_WAVE_LIFE = 3;
const MAX_WAVES = 256;
const LIGHT_RADIUS_SCALE = 0.05;
const LINE_WIDTH = 1;
const WAVE_GROWTH = 250;

const BACKGROUND_LINE_COUNT = 48;
const BACKGROUND_LINE_COLOR = "#777";
const LOGO_LINE_COLOR = "#ccc";
const LOGO_MARGIN = 0.12;
const LOGO_BASE_GAP = 8;
const LOGO_MIN_GAP = 2;

const LIGHT_COLOR = "#ff7a00";
const LIGHT_COLOR_SECONDARY = "#ff00aa";

const AMBIENT_BASE = 0.15;
const AMBIENT_ACTIVE = 0.35;
const AMBIENT_LERP_SPEED = 6;

function lightRadius(): number {
  return (
    Math.hypot(backgroundCanv.width, backgroundCanv.height) * LIGHT_RADIUS_SCALE
  );
}

function lightLenght() {
  return Math.hypot(backgroundCanv.width, backgroundCanv.height);
}

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [
    ((value >> 16) & 0xff) / 255,
    ((value >> 8) & 0xff) / 255,
    (value & 0xff) / 255,
  ];
}

interface Wave {
  x: number;
  y: number;
  r: number;
  life: number;
}

const waveList: Wave[] = [];

let lastTime = performance.now();
let ambient = AMBIENT_BASE;

let backgroundCanv: HTMLCanvasElement;
let gl: WebGLRenderingContext;
let program: WebGLProgram;
let positionAttributeLocation: number;
let positionBuffer: WebGLBuffer;
let uWavesLoc: WebGLUniformLocation | null;
let uMouseLoc: WebGLUniformLocation | null;
let colorUniformLocation: WebGLUniformLocation | null;
let secondaryColorUniformLocation: WebGLUniformLocation | null;
let uLightRadiusLoc: WebGLUniformLocation | null;
let uResolutionLoc: WebGLUniformLocation | null;
let uWaveCountLoc: WebGLUniformLocation | null;
let uAmbientLoc: WebGLUniformLocation | null;
let linesTexture: HTMLCanvasElement;
let waveData: Float32Array;
let glLinesTexture: WebGLTexture | null = null;
let logoGray: Float32Array | null = null;
let logoWidth = 0;
let logoHeight = 0;

function initCanvas(): void {
  const canvas = document.getElementById("background");
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("missing #background canvas");
  }
  backgroundCanv = canvas;
  backgroundCanv.width = backgroundCanv.clientWidth;
  backgroundCanv.height = backgroundCanv.clientHeight;

  const context = backgroundCanv.getContext("webgl", {
    alpha: false,
    antialias: false,
    powerPreference: "high-performance",
  });
  if (!context) throw new Error("could not acquire WebGL context");
  gl = context;
}

function drawBackgroundLines(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = BACKGROUND_LINE_COLOR;
  ctx.lineWidth = LINE_WIDTH;
  for (let i = 0; i < BACKGROUND_LINE_COUNT; i++) {
    const x = Math.random() * backgroundCanv.width;
    const y = Math.random() * backgroundCanv.height;
    const vertical = Math.random() < 0.5;
    const length = (Math.random() * 0.5 + 0.5) * lightLenght();
    ctx.beginPath();
    ctx.moveTo(x, y);
    if (vertical) {
      ctx.lineTo(x, y + length);
    } else {
      ctx.lineTo(x + length, y);
    }
    ctx.stroke();
  }
}

function drawLinesTexture(): void {
  linesTexture = document.createElement("canvas");
  linesTexture.width = backgroundCanv.width;
  linesTexture.height = backgroundCanv.height;
  const ctx = linesTexture.getContext("2d");
  if (!ctx) throw new Error("could not get 2d context");

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, backgroundCanv.width, backgroundCanv.height);

  drawBackgroundLines(ctx);

  const gray = logoGray;
  if (!gray) return;

  const width = linesTexture.width;
  const height = linesTexture.height;
  const scale =
    Math.min(width / logoWidth, height / logoHeight) * (1 - LOGO_MARGIN);
  const drawWidth = logoWidth * scale;
  const drawHeight = logoHeight * scale;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;

  const sample = (x: number, y: number): number => {
    const fx = (x - offsetX) / scale;
    const fy = (y - offsetY) / scale;
    if (fx < 0 || fy < 0 || fx > logoWidth - 1 || fy > logoHeight - 1) {
      return 0;
    }
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const x1 = Math.min(x0 + 1, logoWidth - 1);
    const y1 = Math.min(y0 + 1, logoHeight - 1);
    const tx = fx - x0;
    const ty = fy - y0;
    const topLeft = gray[y0 * logoWidth + x0] ?? 0;
    const topRight = gray[y0 * logoWidth + x1] ?? 0;
    const bottomLeft = gray[y1 * logoWidth + x0] ?? 0;
    const bottomRight = gray[y1 * logoWidth + x1] ?? 0;
    const top = topLeft + (topRight - topLeft) * tx;
    const bottom = bottomLeft + (bottomRight - bottomLeft) * tx;
    return top + (bottom - top) * ty;
  };

  ctx.strokeStyle = LOGO_LINE_COLOR;
  ctx.lineWidth = LINE_WIDTH;

  let y = offsetY;
  while (y < offsetY + drawHeight) {
    let brightnessSum = 0;
    let brightnessCount = 0;
    for (let x = offsetX; x < offsetX + drawWidth; x += 8) {
      brightnessSum += sample(x, y);
      brightnessCount++;
    }
    const brightness =
      brightnessCount > 0 ? brightnessSum / brightnessCount : 0;

    let inRun = false;
    let runStart = 0;
    for (let x = offsetX; x <= offsetX + drawWidth; x++) {
      const white = sample(x, y) > 0.5;
      if (white && !inRun) {
        inRun = true;
        runStart = x;
      } else if (!white && inRun) {
        inRun = false;
        ctx.beginPath();
        ctx.moveTo(runStart, y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }

    y += LOGO_BASE_GAP + (LOGO_MIN_GAP - LOGO_BASE_GAP) * brightness;
  }
}

function loadLogo(): void {
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    logoWidth = canvas.width;
    logoHeight = canvas.height;
    const gray = new Float32Array(logoWidth * logoHeight);
    for (let i = 0; i < logoWidth * logoHeight; i++) {
      const r = pixels.data[i * 4] ?? 0;
      const g = pixels.data[i * 4 + 1] ?? 0;
      const b = pixels.data[i * 4 + 2] ?? 0;
      gray[i] = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    }
    logoGray = gray;
    drawLinesTexture();
    uploadLinesTexture();
  };
  image.src = "./logo.png";
}

function uploadLinesTexture(): void {
  if (!glLinesTexture) return;
  gl.bindTexture(gl.TEXTURE_2D, glLinesTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    linesTexture,
  );
}

function compileShader(type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("could not create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "shader compile failed");
  }
  return shader;
}

function initGl(): void {
  const verts = new Float32Array([-1, -1, 3, -1, -1, 3]);

  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const newProgram = gl.createProgram();
  if (!newProgram) throw new Error("could not create program");
  program = newProgram;

  const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = compileShader(
    gl.FRAGMENT_SHADER,
    fragmentShaderSource,
  );

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? "program link failed");
  }

  positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  uWavesLoc = gl.getUniformLocation(program, "u_waves");
  if (!uWavesLoc) throw new Error("could not get u_waves uniform location");
  colorUniformLocation = gl.getUniformLocation(program, "u_color");
  if (!colorUniformLocation)
    throw new Error("could not get u_color uniform location");
  secondaryColorUniformLocation = gl.getUniformLocation(
    program,
    "u_color_secondary",
  );
  if (!secondaryColorUniformLocation)
    throw new Error("could not get u_color_secondary uniform location");
  uMouseLoc = gl.getUniformLocation(program, "u_mouse");
  if (!uMouseLoc) throw new Error("could not get u_mouse uniform location");
  uLightRadiusLoc = gl.getUniformLocation(program, "u_light_radius");
  if (!uLightRadiusLoc)
    throw new Error("could not get uLightRadiusLoc uniform location");
  uResolutionLoc = gl.getUniformLocation(program, "u_resolution");
  if (!uResolutionLoc)
    throw new Error("could not get u_resolution uniform location");
  uWaveCountLoc = gl.getUniformLocation(program, "u_wave_count");
  if (!uWaveCountLoc)
    throw new Error("could not get u_wave_count uniform location");
  uAmbientLoc = gl.getUniformLocation(program, "u_ambient");
  if (!uAmbientLoc) throw new Error("could not get u_ambient uniform location");

  const buffer = gl.createBuffer();
  if (!buffer) throw new Error("could not create buffer");
  positionBuffer = buffer;

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionAttributeLocation);

  const glLinesTextureLocal = gl.createTexture();
  if (!glLinesTextureLocal) throw new Error("could not create texture");
  glLinesTexture = glLinesTextureLocal;
  gl.bindTexture(gl.TEXTURE_2D, glLinesTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    linesTexture,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  gl.useProgram(program);
  gl.uniform1i(gl.getUniformLocation(program, "u_lines_texture"), 0);
}

function bindGeometry(): void {
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionAttributeLocation);
}

const lastMousePos = {
  x: 0,
  y: 0,
};

const currentMousePos = {
  x: 0,
  y: 0,
};

const SPAWN_DISTANCE = 40;

window.addEventListener("mousemove", (e) => {
  const x = e.clientX;
  const y = backgroundCanv.height - e.clientY;

  currentMousePos.x = x;
  currentMousePos.y = y;
  if (
    lastMousePos.x >= 0 &&
    Math.hypot(x - lastMousePos.x, y - lastMousePos.y) < SPAWN_DISTANCE
  ) {
    return;
  }
  lastMousePos.x = x;
  lastMousePos.y = y;
  if (waveList.length >= MAX_WAVES) {
    waveList.shift();
  }
  waveList.push({
    x,
    y,
    r: lightRadius() / 2,
    life: MAX_WAVE_LIFE,
  });
});

function resizeCanvas(): void {
  backgroundCanv.width = backgroundCanv.clientWidth;
  backgroundCanv.height = backgroundCanv.clientHeight;
  gl.viewport(0, 0, backgroundCanv.width, backgroundCanv.height);
}

window.addEventListener("resize", () => {
  resizeCanvas();
  drawLinesTexture();
  uploadLinesTexture();
});

function draw(now: number): void {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  const ambientTarget = document.body.classList.contains("is-content-open")
    ? AMBIENT_ACTIVE
    : AMBIENT_BASE;
  ambient += (ambientTarget - ambient) * Math.min(1, dt * AMBIENT_LERP_SPEED);

  for (let i = 0; i < waveList.length; i++) {
    const wave = waveList[i]!;
    wave.r += dt * WAVE_GROWTH;
    wave.life -= dt;
    if (wave.life < 0) {
      waveList.splice(i, 1);
      i--;
    }
  }

  gl.viewport(0, 0, backgroundCanv.width, backgroundCanv.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  bindGeometry();

  const [r, g, b] = hexToRgb(LIGHT_COLOR);
  gl.uniform4fv(colorUniformLocation, [r, g, b, 1]);
  const [sr, sg, sb] = hexToRgb(LIGHT_COLOR_SECONDARY);
  gl.uniform4fv(secondaryColorUniformLocation, [sr, sg, sb, 1]);
  let count = 0;
  waveData = new Float32Array(MAX_WAVES * 4);
  for (const wave of waveList) {
    if (count >= MAX_WAVES) break;
    const i = count * 4;
    waveData[i] = wave.x;
    waveData[i + 1] = wave.y;
    waveData[i + 2] = wave.r;
    waveData[i + 3] = wave.life / MAX_WAVE_LIFE;
    count++;
  }
  gl.uniform4fv(uWavesLoc, waveData);
  gl.uniform2f(uMouseLoc, currentMousePos.x, currentMousePos.y);

  gl.uniform1f(uLightRadiusLoc, lightRadius());
  gl.uniform2f(uResolutionLoc, backgroundCanv.width, backgroundCanv.height);
  gl.uniform1i(uWaveCountLoc, waveList.length);
  gl.uniform1f(uAmbientLoc, ambient);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);

  requestAnimationFrame(draw);
}

initCanvas();
drawLinesTexture();
initGl();
loadLogo();
requestAnimationFrame(draw);
