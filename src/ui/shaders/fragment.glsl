precision mediump float;
#define MAX_WAVES 256
uniform vec4 u_color;
uniform vec4 u_waves[MAX_WAVES];
uniform vec2 u_mouse;
uniform float u_light_radius;

void main() {
  vec3 color = vec3(0.0);
  for (int i = 0; i < MAX_WAVES; i++) {
    vec4 w = u_waves[i];
    if (w.w <= 0.0) continue;
    float d = length(gl_FragCoord.xy - w.xy);
    float x = d - w.z;
    if (x > 0.0) continue;
    float amp = exp(x * 0.02) * cos(x * 0.13);
    amp = max(amp, 0.0);
    color += u_color.rgb * amp * w.w;
  }
  float t = length(gl_FragCoord.xy - u_mouse.xy);
  if (t < u_light_radius) {
    t /= u_light_radius;
    t = 1.0 - t * t;
    color += vec3(1.0, 0.0, 0.0) * t;
  }
  gl_FragColor = vec4(color, 1.0);
}
