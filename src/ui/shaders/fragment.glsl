precision mediump float;
#define MAX_WAVES 256
uniform vec4 u_color;
uniform vec4 u_waves[MAX_WAVES];
uniform vec2 u_mouse;
uniform float u_light_radius;
uniform vec2 u_resolution;
uniform int u_wave_count;
uniform sampler2D u_lines_texture;

void main() {
  vec3 color = vec3(0.0);
  for (int i = 0; i < MAX_WAVES; i++) {
    if (i >= u_wave_count) break;
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
  color += u_color.rgb * 0.15;
  color *= texture2D(u_lines_texture, gl_FragCoord.xy / u_resolution).r;
  gl_FragColor = vec4(color, 1.0);
}
