#include <common>

precision mediump float;

uniform vec3 iResolution;
uniform float iTime;
uniform sampler2D spectrum;

varying vec2 vUv;

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
  vec3 c;
  float z = 0.1 * iTime;
  vec2 uv = vUv
  vec2 p = uv - 0.5;
  p.x *= iResolution.x / iResolution.y;
  float l = 0.2 * length(p);
  for (int i = 0; i < 3; i++) {
    z += 0.07;
    uv += p / l * (sin(z) + 1.0) * abs(sin(l * 9.0 - z * 2.0));
    c[i] = 0.01 / length(abs(mod(uv, 1.0) - 0.5));
  }
  float intensity = texture2D(spectrum, vec2(l, 0.5)).x;
  fragColor = vec4(c / l * intensity, iTime);
}

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
