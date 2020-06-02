#include <common>

#if __VERSION__ < 130
#define TEXTURE2D texture2D
#else
#define TEXTURE2D texture
#endif

#define P 3.14159
#define E .001

#define T .03 // Thickness
#define W 2.  // Width
#define A .09 // Amplitude
#define V 1.  // Velocity

uniform vec3      iResolution;
uniform float     iTime;
uniform sampler2D iChannel0;
uniform float     brightness;

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
	vec2 c = fragCoord.xy / iResolution.xy;
	float s = texture2D(iChannel0, c * .5).r;
	c = vec2(0, A*s*sin((c.x*W+iTime*V)* 2.5)) + (c*2.-1.);
	float g = max(abs(s/(pow(c.y, 2.1*sin(s*P))))*T,
				  abs(.1/(c.y+E)));
	fragColor = vec4(g*g*s*.6, g*s*.44, g*g*.7, 1) * brightness;
}

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
