import vertexShaderSource from "./shaders/vertex.glsl?raw";
import fragmentShaderSource from "./shaders/fragment.glsl?raw";
import "./style.css";

const MAX_WAVE_LIFE = 3;
const MAX_WAVES = 256;
const LIGHT_RADIUS = 200;

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

  const buffer = gl.createBuffer();
  if (!buffer) throw new Error("could not create buffer");
  positionBuffer = buffer;

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionAttributeLocation);
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

const SPAWN_DISTANCE = 15;

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
    r: LIGHT_RADIUS / 1.5,
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
    wave.r += dt * 100;
    wave.life -= dt;
    if (wave.life < 0) {
      waveList.splice(i, 1);
      i--;
    }
  }

  gl.useProgram(program);
  gl.viewport(0, 0, backgroundCanv.width, backgroundCanv.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  bindGeometry();

  gl.uniform4fv(colorUniformLocation, [1, 0, 0, 1]);
  let count = 0;
  const waveData = new Float32Array(MAX_WAVES * 4);
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

  gl.uniform1f(uLightRadiusLoc, LIGHT_RADIUS);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);

  requestAnimationFrame(draw);
}

initCanvas();
initGl();
requestAnimationFrame(draw);
