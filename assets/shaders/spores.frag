#include <common>

#if __VERSION__ < 130
#define TEXTURE2D texture2D
#else
#define TEXTURE2D texture
#endif

const int MAX_ITER = 100;
const float MAX_DIST = 20.0;
const float EPSILON = 0.001;
const float PI = 3.14159265;

bool HIT_HOLE = false;
bool HIT_BARREL = false;

vec3 rotateX(vec3 p, float ang) {
  mat3 rmat = mat3(
    1., 0., 0.,
    0., cos(ang), -sin(ang),
    0., sin(ang), cos(ang));
  return rmat * p;
}
vec3 rotateY(vec3 p, float ang) {
  mat3 rmat = mat3(
    cos(ang), 0., sin(ang),
    0., 1., 0.,
    -sin(ang), 0., cos(ang));
  return rmat * p;
}
vec3 rotateZ(vec3 p, float ang) {
  mat3 rmat = mat3(
    cos(ang), -sin(ang), 0.,
    sin(ang), cos(ang), 0.,
    0., 0., 1.);
  return rmat * p;
}

float sphere(vec3 pos, float r) {
  return length(pos) - r;
}

float barrel(vec3 pos) {
  float d = sphere(pos, 0.5);
  pos.y += 0.5;
  float holed = -sphere(pos, .25);
  d = max(d, holed);
  HIT_HOLE = (holed == d) ? true : HIT_HOLE;
  return d;
}

float placedBarrel(vec3 pos, float rx, float ry) {
  pos = rotateY(pos, ry);
  pos = rotateX(pos, rx);
  pos.y += 2.0;
  return barrel(pos);
}

float distfunc(vec3 pos) {
  pos += vec3(iTime);
  vec3 c = vec3(10.);
  pos = mod(pos,c)-0.5*c;

  pos = rotateX(pos, iTime);

  HIT_HOLE = false;
  HIT_BARREL = false;

  // Any of you smart people have a domain transformation way to
  // do a rotational tiling effect instead of this? :)
  float sphered = sphere(pos, 2.0);
  float d = sphered;
  d = min(d, placedBarrel(pos, 0., 0.));
  d = min(d, placedBarrel(pos, 0.8, 0.));
  d = min(d, placedBarrel(pos, 1.6, 0.));
  d = min(d, placedBarrel(pos, 2.4, 0.));
  d = min(d, placedBarrel(pos, 3.2, 0.));
  d = min(d, placedBarrel(pos, 4.0, 0.));
  d = min(d, placedBarrel(pos, 4.8, 0.));
  d = min(d, placedBarrel(pos, 5.6, 0.));
  d = min(d, placedBarrel(pos, 0.8, PI / 2.0));
  d = min(d, placedBarrel(pos, 1.6, PI / 2.0));
  d = min(d, placedBarrel(pos, 2.4, PI / 2.0));
  d = min(d, placedBarrel(pos, 4.0, PI / 2.0));
  d = min(d, placedBarrel(pos, 4.8, PI / 2.0));
  d = min(d, placedBarrel(pos, 5.6, PI / 2.0));
  d = min(d, placedBarrel(pos, 1.2, PI / 4.0));
  d = min(d, placedBarrel(pos, 2.0, PI / 4.0));
  d = min(d, placedBarrel(pos, 1.2, 3.0 * PI / 4.0));
  d = min(d, placedBarrel(pos, 2.0, 3.0 * PI / 4.0));
  d = min(d, placedBarrel(pos, 1.2, 5.0 * PI / 4.0));
  d = min(d, placedBarrel(pos, 2.0, 5.0 * PI / 4.0));
  d = min(d, placedBarrel(pos, 1.2, 7.0 * PI / 4.0));
  d = min(d, placedBarrel(pos, 2.0, 7.0 * PI / 4.0));
  HIT_BARREL = d != sphered;

  return d;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float m_x = (iMouse.x / iResolution.x) - 0.5;
    float m_y = (iMouse.y / iResolution.y) - 0.5;
    vec3 cameraOrigin = vec3(5.0 * sin(m_x * PI * 2.), m_y * 15.0, 5.0 * cos(m_x * PI * 2.));
    vec3 cameraTarget = vec3(0.0, 0.0, 0.0);
    vec3 upDirection = vec3(0.0, 1.0, 0.0);
    vec3 cameraDir = normalize(cameraTarget - cameraOrigin);
    vec3 cameraRight = normalize(cross(upDirection, cameraOrigin));
    vec3 cameraUp = cross(cameraDir, cameraRight);
    vec2 screenPos = -1.0 + 2.0 * gl_FragCoord.xy / iResolution.xy;
    screenPos.x *= iResolution.x / iResolution.y;
    vec3 rayDir = normalize(cameraRight * screenPos.x + cameraUp * screenPos.y + cameraDir);

    float totalDist = 0.0;
    vec3 pos = cameraOrigin;
    float dist = EPSILON;
    for (int i = 0; i < MAX_ITER; i++) {
        if (dist < EPSILON || totalDist > MAX_DIST) { break; }
        dist = distfunc(pos);
        totalDist += dist;
        pos += dist * rayDir;
    }

    if (dist < EPSILON) {
      vec2 eps = vec2(0.0, EPSILON);
      vec3 normal = normalize(vec3(
            distfunc(pos + eps.yxx) - distfunc(pos - eps.yxx),
            distfunc(pos + eps.xyx) - distfunc(pos - eps.xyx),
            distfunc(pos + eps.xxy) - distfunc(pos - eps.xxy)));
      vec3 lightdir = normalize(vec3(1., -1., 0.));
      float diffuse = max(0.2, dot(lightdir, normal));
      vec2 tc = vec2(pos.x, pos.z);
      vec3 texcol = texture(iChannel0, tc).rgb;

      vec3 lightcol = vec3(1.);
      vec3 darkcol = vec3(.4, .8, .9);
      float sma = 0.4;
      float smb = 0.6;

      if (HIT_HOLE) {
          lightcol = vec3(1., 1., 0.8);
      } else if (HIT_BARREL) {
        lightcol.r = 0.95;
      } else {
          sma = 0.2;
          smb = 0.3;
      }
      float facingRatio = smoothstep(sma, smb,
                                     abs(dot(normal, rayDir)));

      vec3 illumcol = mix(lightcol, darkcol, 1. - facingRatio);
      fragColor = vec4(illumcol, 1.0);
    } else {
      float strp = smoothstep(.8, .9, mod(screenPos.y * 10. + iTime, 1.));
      fragColor = vec4(mix(vec3(1., 1., 1.), vec3(.4, .8, .9), strp), 1.);
    }
}

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
