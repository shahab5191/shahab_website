export const screenFrag = `
uniform sampler2D tDiffuse;
uniform float uTime;
uniform float scanlineHeight;
uniform float uDistortion;
uniform float uChromaticAberration;
uniform float uVignette;
uniform float scanlineDimFactor;
varying vec2 vUv;
void main() {
  vec2 uv = vUv;
  vec3 color = texture2D(tDiffuse, uv).rgb;
  float scanline = min(abs(sin(uv.y * 3.14159 * scanlineHeight)), scanlineDimFactor);
  color *= 1.0 - scanline;
  gl_FragColor = vec4(color, 1.0);
}
`;
