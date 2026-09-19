precision mediump float;
#define MAX_WAVES 100
uniform vec4 u_color;
uniform float u_time;
uniform vec4 u_waves[MAX_WAVES];

void main() {
  vec3 color = vec3(0.0);
  for (int i = 0; i < MAX_WAVES; i++) {
    vec4 w = u_waves[i];
    if (w.w <= 0.0) continue;
    float t = length(gl_FragCoord.xy - w.xy) / w.z;
    if (t >= 1.0) continue;
    color += u_color.rgb * (1.0 - t * t) * w.w;
  }
  gl_FragColor = vec4(color, 1.0);
}
