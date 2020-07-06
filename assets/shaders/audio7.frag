#if __VERSION__ < 130
#define TEXTURE2D texture2D
#else
#define TEXTURE2D texture
#endif

uniform vec3      iResolution;
uniform float     iTime;
uniform sampler2D iChannel0;
uniform float     brightness;

float squared(float value) { return value * value; }

float getAmp(float frequency) { return TEXTURE2D(iChannel0, vec2(frequency / 512.0, 0)).x; }

float getWeight(float f) {
    return (+ getAmp(f-2.0) + getAmp(f-1.0) + getAmp(f+2.0) + getAmp(f+1.0) + getAmp(f)) / 5.0; }

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uvTrue = fragCoord.xy / iResolution.xy;
    vec2 uv = -1.0 + 2.0 * uvTrue;

	float lineIntensity;
    float glowWidth;
    vec3 color = vec3(0.0);

    float i = 0.0;

	for(float i = 0.0; i < 5.0; i++) {

		uv.y += (0.2 * sin(uv.x + i/7.0 - iTime * 0.6));
        float Y = uv.y + getWeight(squared(i) * 20.0) *
            (TEXTURE2D(iChannel0, vec2(uvTrue.x, 1)).x - 0.5);
        lineIntensity = 0.4 + squared(1.6 * abs(mod(uvTrue.x + i / 1.3 + iTime,2.0) - 1.0));
		glowWidth = abs(lineIntensity / (150.0 * Y));
		color += vec3(glowWidth * (2.0 + sin(iTime * 0.13)),
                      glowWidth * (2.0 - sin(iTime * 0.23)),
                      glowWidth * (2.0 - cos(iTime * 0.19)));
	}

	fragColor = vec4((color / 2.0) * (getWeight(squared(i) * 20.0) * 2.5), 1.0) * brightness;
}

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}

// Visual Features
// complexity=1
// contrast=0
// movement=1
