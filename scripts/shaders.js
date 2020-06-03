import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/build/three.module.js';

let analyser, audioData, uniforms, lastBrightness, scene, nextScene = null;

let scenes = new Array();

const sliders = {
  'brightness': document.getElementById('brightnessRange'),
  'complexity': document.getElementById('complexityRange'),
  'contrast': document.getElementById('contrastRange'),
  'movement': document.getElementById('movementRange')
}

const shaders = {
  '000': 'audio7',
  '001': 'audio2',
  '010': 'audio3',
  '011': 'audio4',
  '100': 'audio5',
  '101': 'audio8',
  '110': 'audio1',
  '111': 'audio6',
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

    // Shadertoy
    iResolution:  { value: new THREE.Vector3() },   // viewport resolution (in pixels)
    iTime: { value: 0 },                            // shader playback time (in seconds)
    iTimeDelta: { value: null },                    // render time (in seconds)
    iFrame: { value: null },                        // shader playback frame
    iChannelTime: { value: null },                  // channel playback time (in seconds)
    iChannelResolution: { value: null },            // channel resolution (in pixels)
    iMouse: { value: null },                        // mouse pixel coords. xy: current (if MLB down), zw: click
    iChannel0: { value: new THREE.DataTexture(audioData, analyser.fftSize/2, 1, THREE.LuminanceFormat) },
    iCHannel1: { value: null },                     // input channel. XX = 2D/Cube
    iChannel2: { value: null },                     // input channel. XX = 2D/Cube
    iChannel3: { value: null },                     // input channel. XX = 2D/Cube
    iDate: {value: null },                          // (year, month, day, time in seconds)

    // Custom
    brightness: { value: 1.0 }                      // brightness master control
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
  scene = scenes['000'];
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
  requestAnimationFrame( animate );

  resizeRendererToDisplaySize(renderer);

  analyser.getByteFrequencyData(audioData);

  time *= 0.001;

  uniforms.iTime.value = time;
  uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
  uniforms.iChannel0.value.needsUpdate = true;

  let goal = '';
  for (let i of ['complexity', 'contrast', 'movement']) {
    if (sliders[i].value < 0.5) {
      goal += '0';
    } else {
      goal += '1';
    }
  }

  // If a new scene is needed
  if (scene != scenes[goal] && nextScene == null) {
    lastBrightness = sliders['brightness'].value;
    nextScene = scenes[goal];
  }
  // Bring down the brightness each frame
  if (nextScene != null) {
    uniforms.brightness.value -= 0.1;
  }
  // When the brightness has been turned down switch the scene
  if (uniforms.brightness.value < 0 && nextScene != null) {
    scene = nextScene;
    nextScene = null;
  }
  // Return brightness to previous amount a little bit each frame
  if (uniforms.brightness.value != lastBrightness && lastBrightness != null && nextScene == null){
    uniforms.brightness.value += 0.1;
  }
  // Once the brightness has returned, clear the brightness target
  if (uniforms.brightness.value >= lastBrightness) {
    lastBrightness = null;
  }
  // Otherwise, follow the brightness fader
  if (nextScene == null && lastBrightness == null) {
    uniforms.brightness.value = sliders['brightness'].value;
  }

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
