#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
#define MAX_WAVES 256
uniform vec4 u_color;
uniform vec4 u_waves[MAX_WAVES];
uniform vec2 u_mouse;
uniform float u_light_radius;
uniform float u_line_cell;
uniform float u_line_length;
uniform float u_line_width;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float lineMask(vec2 p) {
  vec2 id = floor(p / u_line_cell);
  float mask = 0.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 cid = id + vec2(float(x), float(y));
      vec2 center = (cid + vec2(hash21(cid), hash21(cid + 7.13))) * u_line_cell;
      vec2 dir = hash21(cid + 5.3) < 0.5 ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      float halfLen = u_line_length * (0.5 + 0.5 * hash21(cid + 3.71));

      vec2 a = center - dir * halfLen;
      vec2 b = center + dir * halfLen;
      vec2 pa = p - a;
      vec2 ba = b - a;
      float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
      float d = length(pa - ba * h);
      mask = max(mask, 1.0 - smoothstep(0.0, u_line_width, d));
    }
  }
  return mask;
}

void main() {
  vec3 color = vec3(0.0);
  for (int i = 0; i < MAX_WAVES; i++) {
    vec4 w = u_waves[i];
    if (w.w <= 0.0) continue;
    float d = length(gl_FragCoord.xy - w.xy);
    float x = d - w.z;
    float amp = exp(-x * x * 0.004);
    color += u_color.rgb * amp * w.w;
  }
  float t = length(gl_FragCoord.xy - u_mouse.xy) / u_light_radius;
  float glow = exp(-pow(t, 4.0) * 3.0);
  color += u_color.rgb * 1.5 * glow;
  color *= lineMask(gl_FragCoord.xy);
  gl_FragColor = vec4(color, 1.0);
}
