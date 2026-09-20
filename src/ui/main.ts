import vertexShaderSource from "./shaders/vertex.glsl?raw";
import fragmentShaderSource from "./shaders/fragment.glsl?raw";
import "./style.css";

const MAX_WAVE_LIFE = 3;
const MAX_WAVES = 256;
const LIGHT_RADIUS_SCALE = 0.05;
const LINE_NUM = 30;
const LINE_WIDTH = 1;
const LINE_LENGTH = 600;
const WAVE_GROWTH = 250;

function lightRadius(): number {
  return (
    Math.hypot(backgroundCanv.width, backgroundCanv.height) * LIGHT_RADIUS_SCALE
  );
}

interface Wave {
  x: number;
  y: number;
  r: number;
  life: number;
}

const waveList: Wave[] = [];

let lastTime = performance.now();

let backgroundCanv: HTMLCanvasElement;
let gl: WebGLRenderingContext;
let program: WebGLProgram;
let positionAttributeLocation: number;
let positionBuffer: WebGLBuffer;
let uWavesLoc: WebGLUniformLocation | null;
let uMouseLoc: WebGLUniformLocation | null;
let colorUniformLocation: WebGLUniformLocation | null;
let uLightRadiusLoc: WebGLUniformLocation | null;
let uResolutionLoc: WebGLUniformLocation | null;
let uWaveCountLoc: WebGLUniformLocation | null;
let linesTexture: HTMLCanvasElement;
let waveData: Float32Array;

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

function drawLinesTexture(): void {
  linesTexture = document.createElement("canvas");
  linesTexture.width = backgroundCanv.width;
  linesTexture.height = backgroundCanv.height;
  const ctx = linesTexture.getContext("2d");
  if (!ctx) throw new Error("could not get 2d context");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, backgroundCanv.width, backgroundCanv.height);
  for (let i = 0; i < LINE_NUM; i++) {
    const x = Math.random() * backgroundCanv.width;
    const y = Math.random() * backgroundCanv.height;
    const vertical = Math.random() < 0.5 ? true : false;
    const length = (Math.random() * 0.5 + 0.5) * LINE_LENGTH;
    ctx.beginPath();
    ctx.moveTo(x, y);
    if (vertical) {
      ctx.lineTo(x, y + length);
    } else {
      ctx.lineTo(x + length, y);
    }
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = LINE_WIDTH;
    ctx.stroke();
  }
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

  const buffer = gl.createBuffer();
  if (!buffer) throw new Error("could not create buffer");
  positionBuffer = buffer;

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionAttributeLocation);

  const glLinesTexture = gl.createTexture();
  if (!glLinesTexture) throw new Error("could not create texture");
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

window.addEventListener("resize", resizeCanvas);

function draw(now: number): void {
  const dt = (now - lastTime) / 1000;
  lastTime = now;
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

  gl.uniform4fv(colorUniformLocation, [1, 0.48, 0, 1]);
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
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);

  requestAnimationFrame(draw);
}

initCanvas();
drawLinesTexture();
initGl();
requestAnimationFrame(draw);
