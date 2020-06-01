import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/build/three.module.js';

let analyser, audioData, uniforms;

let scenes = new Array();

const sliders = {
  'brightness': document.getElementById('brightnessRange'),
  'complexity': document.getElementById('complexityRange'),
  'contrast': document.getElementById('contrastRange'),
  'movement': document.getElementById('movementRange')
}

const shaders = {
  '0000': 'audio1',
  '0001': 'audio2',
  '0010': 'audio3',
  '0011': 'audio4',
  '0100': 'audio5',
  '0101': 'audio6',
  '0110': 'audio7',
  '0111': 'audio8',
  '1000': 'audio1',
  '1001': 'audio2',
  '1010': 'audio3',
  '1011': 'audio4',
  '1100': 'audio5',
  '1101': 'audio6',
  '1110': 'audio7',
  '1111': 'audio8'
}

const loadShaders = async () => {
  for (let i in shaders) {
    let response = await fetch(`assets/shaders/${shaders[i]}.frag`);
    let text = await response.text();
    shaders[i] = text;
  }
}

loadShaders();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

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
  const plane = new THREE.PlaneBufferGeometry(2, 2);

  uniforms = {
    iTime: { value: 0 },
    iResolution:  { value: new THREE.Vector3() },
    iChannel0: { value: new THREE.DataTexture(audioData, analyser.fftSize/2, 1, THREE.LuminanceFormat) }
  };

  for (let i in shaders) {
    const material = new THREE.ShaderMaterial({
      fragmentShader: shaders[i],
      uniforms,
    });

    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(plane, material));
    scenes[i] = scene;
  }
}

function resizeRendererToDisplaySize(renderer) {
  const needResize = canvas.width !== window.innerWidth ||
    canvas.height !== window.innerHeight;
  if (needResize) {
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  return needResize;
}

function animate(time){
  let scene;

  requestAnimationFrame( animate );

  resizeRendererToDisplaySize(renderer);

  analyser.getByteFrequencyData(audioData);

  time *= 0.001;

  uniforms.iTime.value = time;
  uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
  uniforms.iChannel0.value.needsUpdate = true;

  let goal = '';
  for (let i in sliders) {
    if (sliders[i].value < 0.5) {
      goal += '0';
    } else {
      goal += '1';
    }
  }

  scene = scenes[goal];
  renderer.render(scene, camera);
}

navigator.getUserMedia  = navigator.getUserMedia ||
                        navigator.webkitGetUserMedia ||
                        navigator.mozGetUserMedia ||
                        navigator.msGetUserMedia;

function startMic(){
  if (navigator.getUserMedia) {
    navigator.getUserMedia({ audio: true, video: false }, function( stream ) {

      analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);

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
