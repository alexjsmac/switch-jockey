let uniforms, lastBrightness, scene, nextScene = null;

const scenes = new Array();
const shaders = new Array();

const sliders = {
  'brightness': document.getElementById('brightnessRange'),
  'change': document.getElementById('changeRange'),
  'level': document.getElementById('levelRange'),
  'complexity': document.getElementById('complexityRange'),
  'contrast': document.getElementById('contrastRange'),
  'movement': document.getElementById('movementRange'),
  'valence': document.getElementById('valenceRange'),
  'arousal': document.getElementById('arousalRange')
}

const visualFeatureList = ['complexity', 'contrast', 'movement'];

function readVisualFeatures(text) {
  let visualFeatures = new Array();
  for (let i in visualFeatureList) {
    var regex = new RegExp("^// " + visualFeatureList[i] + "=(.*)$", "m");
    var match = regex.exec(text);
    if (match) {
      visualFeatures.push(parseFloat(match[1]));
    }
  }
  return visualFeatures;
}

const loadShaders = async () => {
  for (let i = 1; i < 9; i++) {    // How to get the number of shaders now?
    let response = await fetch(`assets/shaders/audio${i}.frag`);
    let code = await response.text();
    let visualFeatures = readVisualFeatures(code);
    shaders.push({
      'name': `audio${i}`,
      'coordinates': visualFeatures,
      'code': code
    })
  }
}

loadShaders();

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
      fragmentShader: shaders[i]['code'],
      uniforms,
    });

    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(plane, material));
    scenes.push({'coordinates': [shaders[i]['coordinates']], 'scene': scene});
  }
  scene = scenes[0]['scene'];  // Set initial scene
}

function resizeRendererToDisplaySize(renderer) {
  const needResize = canvas.width !== window.innerWidth ||
    canvas.height !== window.innerHeight;
  if (needResize) {
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  return needResize;
}

function findNearestNeighbour(goal) {
  let nearestNeighbour = null;
  let shortestDistance = 1000000;
  for (let i in scenes) {
    let distance = math.distance(scenes[i]['coordinates'][0], goal);
    if (distance < shortestDistance) {
      nearestNeighbour = scenes[i];
      shortestDistance = distance;
    }
  }
  return nearestNeighbour;
}

function interpretAudioFeatures(preds) {
  let goal;
  let valence = parseFloat(sliders['valence'].value);
  let arousal = parseFloat(sliders['arousal'].value);
  if (valence < -0.33 && arousal < -0.33) {
    goal = [0,0,0];
  } else if (valence < -0.33 && arousal >= -0.33 && arousal < 0.33) {
    goal = [0,0,0.5];
  } else if (valence < -0.33 && arousal >= 0.33) {
    goal = [0,0,1];
  } else if (valence >= -0.33 && valence < 0.33 && arousal < -0.33) {
    goal = [0.5,0.5,0];
  } else if (valence >= -0.33 && valence < 0.33 && arousal >= -0.33 && arousal < 0.33) {
    goal = [0.5,0.5,0.5];
  } else if (valence >= -0.33 && valence < 0.33 && arousal >= 0.33) {
    goal = [0.5,0.5,1];
  } else if (valence >= 0.33 && arousal < -0.33) {
    goal = [1,1,0];
  } else if (valence >= 0.33 && arousal >= -0.33 && arousal < 0.33) {
    goal = [1,1,0.5];
  } else if (valence >= 0.33 && arousal >= 0.33) {
    goal = [1,1,1];
  }
  return goal;
}

function checkScene(nearestNeighbour) {
  // If a new scene is needed
  if (scene != nearestNeighbour['scene'] && nextScene == null) {
    lastBrightness = sliders['brightness'].value;
    nextScene = nearestNeighbour['scene'];
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
}

function animate(time){
  requestAnimationFrame(animate);

  resizeRendererToDisplaySize(renderer);

  analyser.getByteFrequencyData(audioData);

  time *= 0.001;

  uniforms.iTime.value = time;
  uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
  uniforms.iChannel0.value.needsUpdate = true;

  let goal = interpretAudioFeatures();
  sliders['complexity'].value = goal[0];
  sliders['contrast'].value = goal[1];
  sliders['movement'].value = goal[2];

  var d = Math.random();
  if (d < sliders['change'].value) {
    let nearestNeighbour = findNearestNeighbour(goal);
    checkScene(nearestNeighbour);
  }

  if (sliders['level'].value < 0.025) {
    uniforms.brightness.value -= 0.01;
  }
  else {
    uniforms.brightness.value = sliders['brightness'].value;
  }

  renderer.render(scene, camera);
}

function startShaders(){
  createScene();
  animate();
}
