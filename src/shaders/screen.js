export const screenFrag = `
uniform sampler2D tDiffuse;
uniform float uTime;
uniform float scanlineCount;
uniform float uDistortion;
uniform float uChromaticAberration;
uniform float uVignette;
uniform float scanlineDimFactor;
varying vec2 vUv;
void main() {
  vec2 uv = vUv;
  vec3 color = texture2D(tDiffuse, uv).rgb;
  float y = uv.y * scanlineCount;
  float d = abs(fract(y) - 0.5);
  float aa = fwidth(y);
  float dimMask = smoothstep(1.0 / 3.0 - aa, 1.0 / 3.0 + aa, d);
  color *= 1.0 - scanlineDimFactor * dimMask;
  gl_FragColor = vec4(color, 1.0);
}
`;
