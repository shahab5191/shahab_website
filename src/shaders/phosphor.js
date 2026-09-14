export const phosphorVert = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const phosphorFrag = `
uniform vec3 uDecay;
uniform sampler2D tPrev;
uniform sampler2D tCurr;
varying vec2 vUv;

void main() {
  vec3 prev = texture2D(tPrev, vUv).rgb;
  vec3 curr = texture2D(tCurr, vUv).rgb;
  gl_FragColor = vec4(max(curr, prev * uDecay), 1.0);
}
`;
