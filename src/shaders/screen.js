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
uniform float screenWidth;
uniform float uMaskPitch;
uniform float uMaskStrength;
uniform float uBandSpeed;
uniform float uBandHeight;
uniform float uBandStrength;
varying vec2 vUv;

const float TAU = 6.2831853;

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

  vec2 snappedUv = vec2(
      (floor(uv.x * screenWidth) + 0.5) / screenWidth,
      (floor(uv.y * scanlineCount) + 0.5) / scanlineCount
  );

  vec3 color = texture2D(tDiffuse, snappedUv).rgb;
  float phase = TAU * gl_FragCoord.x / uMaskPitch;
  vec3 mask = 0.5 + 0.5 * cos(phase - vec3(0.0, TAU / 3.0, 2.0 * TAU / 3.0));
  mask = mix(vec3(1.0), mask, uMaskStrength);
  color *= mask / (1.0 - 0.5 * uMaskStrength);

  float y = uv.y * scanlineCount;
  float d = abs(fract(y) - 0.5);
  float aa = fwidth(y);
  float dimMask = smoothstep(1.0 / 3.0 - aa, 1.0 / 3.0 + aa, d);
  color *= 1.0 - scanlineDimFactor * dimMask;

  float distanceToCenter = distance(uv, vec2(0.5));
  float vignette = smoothstep(0.2, uVignetteDimFactor, distanceToCenter);
  color *= 1.0 - uVignette * vignette;

  float bandPhase = fract(uTime * uBandSpeed * -1.0);
  float bandDelta = fract(uv.y - bandPhase + 0.5) - 0.5;
  float bandDist = abs(bandDelta);
  float bandDarken = smoothstep(0.2, 0.0, bandDist);
  color *= 1.0 - uBandStrength * bandDarken;

  gl_FragColor = vec4(color, 1.0);
}
`;
