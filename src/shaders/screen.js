export const screenFrag = `
uniform sampler2D tDiffuse;
uniform float uTime;
uniform float scanlineCount;
uniform float uDistortion;
uniform float uChromaticAberration;
uniform float uVignette;
uniform float scanlineDimFactor;
uniform float uAspect;
uniform float uVignetteDimFactor;
varying vec2 vUv;

// Bulges the center outward and compresses the edges, simulating convex CRT
// glass. aspect keeps the curve circular in screen space rather than
// elliptical, since the screen plane is stretched vertically.
vec2 barrelDistort(vec2 uv, float k, float aspect) {
  vec2 p = uv * 2.0 - 1.0;
  p.x *= aspect;
  float r2 = dot(p, p);
  p *= 1.0 + k * r2;
  p.x /= aspect;
  return p * 0.5 + 0.5;
}

void main() {
  vec2 uv = barrelDistort(vUv, uDistortion, uAspect);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0);
    return;
  }
  vec3 color = texture2D(tDiffuse, uv).rgb;
  float y = uv.y * scanlineCount;
  float d = abs(fract(y) - 0.5);
  float aa = fwidth(y);
  float dimMask = smoothstep(1.0 / 3.0 - aa, 1.0 / 3.0 + aa, d);
  color *= 1.0 - scanlineDimFactor * dimMask;

  float distanceToCenter = distance(uv, vec2(0.5));
  float vignette = smoothstep(0.2, uVignetteDimFactor, distanceToCenter);
  color *= 1.0 - uVignette * vignette;

  gl_FragColor = vec4(color, 1.0);
}
`;
