#if __VERSION__ < 130
#define TEXTURE2D texture2D
#else
#define TEXTURE2D texture
#endif

uniform vec3 iResolution;
uniform float iTime;
uniform sampler2D iChannel0;

float hz(float hz)
{
    float u = hz/11000.0;
    return TEXTURE2D(iChannel0,vec2(u,0.25)).x;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord.xy / iResolution.xy;

    // 3 dancing magenta, cyan & yellow sine waves
    float v1 = 0.02 + 0.4*hz(100.0);
    float v2 = 0.02 + 0.4*hz(500.0);
    float v3 = 0.02 + 0.4*hz(2000.0);
    vec3 col = vec3(0.0, 0.0, 0.0);
    float v1x = uv.x - 0.5 + sin(5.0*iTime + 1.5*uv.y)*v1;
    float v2x = uv.x - 0.2 + sin(3.0*iTime + 0.8*uv.y)*v2;
    float v3x = uv.x - 0.3 + sin(7.0*iTime + 3.2*uv.y)*v3;
    col += vec3(1.0,0.0,1.0) * abs(0.066/v1x) * v1;
    col += vec3(1.0,1.0,0.0) * abs(0.066/v2x) * v2;
    col += vec3(0.0,1.0,1.0) * abs(0.066/v3x) * v3;

    // with a lighted disco floor pattern
    float uvy2 = 0.4*iTime-uv.y;
    float a1 = max(0.0,0.25*hz(200.0)) *
        max(0.0,min(1.0,sin(50.0*uv.x)*sin(50.0*uvy2)));
    col += vec3(1.0,1.0,1.0) * a1;

    fragColor = vec4(col,1.0);
}

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
