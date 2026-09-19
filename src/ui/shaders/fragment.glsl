#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
#define MAX_WAVES 256
#define MAX_LINES 128
uniform vec4 u_color;
uniform vec4 u_waves[MAX_WAVES];
uniform vec4 u_lines[MAX_LINES];
uniform vec2 u_mouse;
uniform float u_light_radius;

float lineMask(vec2 p) {
  float mask = 0.0;
  float w = 1.0;
  for (int i = 0; i < MAX_LINES; i++) {
    vec4 line = u_lines[i];
    if (line.w < -0.5) continue;
    float along = line.w < 0.5 ? p.x : p.y;
    float perp = line.w < 0.5 ? p.y : p.x;
    float dAlong = max(max(line.y - along, along - line.z), 0.0);
    float dPerp = perp - line.x;
    float d = length(vec2(dAlong, dPerp));
    mask = max(mask, 1.0 - smoothstep(0.0, w, d));
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
