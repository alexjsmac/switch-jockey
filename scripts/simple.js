import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/build/three.module.js';

let analyser,
    source,
    audioData,
    uniforms,
    scene;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const fragmentShader = `
uniform vec3 iResolution;
uniform float iTime;
uniform sampler2D iChannel0;

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
  vec3 c;
  float z = 0.1 * iTime;
  vec2 uv = fragCoord / iResolution.xy;
  vec2 p = uv - 0.5;
  p.x *= iResolution.x / iResolution.y;
  float l = 0.2 * length(p);
  for (int i = 0; i < 3; i++) {
    z += 0.07;
    uv += p / l * (sin(z) + 1.0) * abs(sin(l * 9.0 - z * 2.0));
    c[i] = 0.01 / length(abs(mod(uv, 1.0) - 0.5));
  }
  float intensity = texture2D(iChannel0, vec2(l, 0.5)).x;
  fragColor = vec4(c / l * intensity, iTime);
}

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
`

document.querySelector('button').addEventListener('click', function() {
  audioCtx.resume().then(() => {
    startMic();
    console.log('Playback resumed successfully');
  });
});

const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({canvas});
renderer.autoClearColor = false;

const camera = new THREE.OrthographicCamera(
  -1, // left
   1, // right
   1, // top
  -1, // bottom
  -1, // near,
   1, // far
);

function createScene() {
  scene = new THREE.Scene();
  const plane = new THREE.PlaneBufferGeometry(2, 2);

  uniforms = {
    iTime: { value: 0 },
    iResolution:  { value: new THREE.Vector3() },
    iChannel0: { value: new THREE.DataTexture(audioData, analyser.fftSize/2, 1, THREE.LuminanceFormat) }
  };

  const material = new THREE.ShaderMaterial({
    fragmentShader: fragmentShader,
    uniforms,
  });

  scene.add(new THREE.Mesh(plane, material));
}

navigator.getUserMedia  = navigator.getUserMedia ||
                        navigator.webkitGetUserMedia ||
                        navigator.mozGetUserMedia ||
                        navigator.msGetUserMedia;

function resizeRendererToDisplaySize(renderer) {
  const needResize = canvas.width !== window.innerWidth ||
    canvas.height !== window.innerHeight;
  if (needResize) {
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  return needResize;
}

function animate(time){
  requestAnimationFrame( animate );

  resizeRendererToDisplaySize(renderer);

  analyser.getByteFrequencyData(audioData);

  time *= 0.001;

  uniforms.iTime.value = time;
  uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
  uniforms.iChannel0.value.needsUpdate = true;

  renderer.render(scene, camera);
}

function startMic(){
  if (navigator.getUserMedia) {
    navigator.getUserMedia({ audio: true, video: false }, function( stream ) {

      analyser = audioCtx.createAnalyser();
      source = audioCtx.createMediaStreamSource(stream);

      source.connect(analyser);

      analyser.fftSize = 1024;
      audioData = new Uint8Array(analyser.frequencyBinCount);

      createScene();
      animate();
    }, function(){});
  } else {
    // fallback.
  }
}
