import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/build/three.module.js';

let analyser,
    source,
    audioData,
    uniforms,
    scene;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const fragmentShader = `
#include <common>

uniform vec3      iResolution;
uniform float     iTime;
uniform sampler2D iChannel0;

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
  // Normalized pixel coordinates (from 0 to 1)
	vec2 uv = fragCoord / iResolution.xy;

	// first texture row is frequency data
	float fft  = texture2D( iChannel0, vec2(uv.x,0.25) ).x;

    // second texture row is the sound wave
	float wave = texture2D( iChannel0, vec2(uv.x,0.75) ).x;

	// convert frequency to colors
	vec3 col = vec3(1.0)*fft;

    // add wave form on top
	col += 1.0 -  smoothstep( 0.0, 0.01, abs(wave - uv.y) );

    col = pow( col, vec3(1.0,0.5,2.0) );

	// output final color
	fragColor = vec4(col,1.0);
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

function copyAudioDataToTexture(audioData) {
  let textureArray = new Uint8Array(4 * audioData.length)
  for (let i = 0; i < audioData.length; i++) {
    textureArray[4 * i + 0] = audioData[i] // R
    textureArray[4 * i + 1] = audioData[i] // G
    textureArray[4 * i + 2] = audioData[i] // B
    textureArray[4 * i + 3] = 255          // A
  }
  return textureArray;
}

function createScene() {
  scene = new THREE.Scene();
  let texArray = copyAudioDataToTexture(audioData);
  const texture = new THREE.DataTexture(texArray, audioData.length, 1, THREE.UnsignedByteType);
  const plane = new THREE.PlaneBufferGeometry(2, 2);

  uniforms = {
    iTime: { value: 0 },
    iResolution:  { value: new THREE.Vector3() },
    iChannel0: texture
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
  uniforms.iChannel0.image.data = copyAudioDataToTexture(audioData);

  time *= 0.001;
  uniforms.iTime.value = time;

  uniforms.iResolution.value.set(canvas.width, canvas.height, 1);

  renderer.render(scene, camera);
}

function startMic(){
  if (navigator.getUserMedia) {
    navigator.getUserMedia({ audio: true, video: false }, function( stream ) {

      analyser = audioCtx.createAnalyser();
      source = audioCtx.createMediaStreamSource( stream );

      source.connect(analyser);

      analyser.fftSize = 512;
      audioData = new Uint8Array(analyser.frequencyBinCount);

      createScene();
      animate();
    }, function(){});
  } else {
    // fallback.
  }
}
