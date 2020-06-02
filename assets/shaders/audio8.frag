#if __VERSION__ < 130
#define TEXTURE2D texture2D
#else
#define TEXTURE2D texture
#endif

uniform vec3      iResolution;
uniform float     iTime;
uniform sampler2D iChannel0;
uniform float     brightness;

float circle(vec2 uv, float r, float blur) {
 	float d = length((uv)*5.0);
    float c = smoothstep(r, r-blur, d);
    return c;
}

mat2 rotate2d(vec2 uv, float angle) {
 	return mat2(-cos(angle),sin(angle),-sin(angle),-cos(angle));
}

mat2 scale2d(vec2 scale) {
	return mat2(scale.x,0.0,0.0,scale.y);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
    uv -= 0.5;
    uv.x *= iResolution.x/iResolution.y;

    float f = TEXTURE2D(iChannel0, vec2(20.0)).r;

    uv *= 6.0;

    float c = circle(uv, 5.5*sin(iTime)+6.0+f, 0.2);
    vec3 color = vec3(c);
    vec3 color2 = color;
    vec2 leftCircle = uv + vec2(0.5*sin(iTime),0.0);
    vec2 rightCircle = uv + vec2(-0.5*sin(iTime),0.0);
    float d = length(leftCircle);
    float d2 = length(rightCircle);

    uv = rotate2d(uv,100.0*sin(iTime/10.0))*uv;
    uv = scale2d(vec2(5.0*sin(iTime/5.0)+2.5))*uv;

    color *= vec3(fract(d*20.0*f),fract(d*20.0*f),uv.x);
    color2 *= vec3(fract(d2*20.0*f),uv.x,fract(d2*20.0*f));
    color += color2;
    color += vec3(0.0,sin(uv.y*20.0)*sin(iTime/5.0),sin(uv.y*20.0));

	fragColor = vec4(color,1.0) * brightness;
}

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
