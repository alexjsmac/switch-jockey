import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/build/three.module.js';

const audioContext = new AudioContext();

// One-liner to resume playback when user interacted with the page.
document.querySelector('button').addEventListener('click', function() {
  audioContext.resume().then(() => {
    console.log('Playback resumed successfully');
  });
});

async function loadShader(url) {
  try {
    const response = await fetch(url);
    const data = await response.text();
    return data
  } catch (err) {
    console.error(err);
  }
}

async function main() {

  var microphone_stream = null,
      gain_node = null,
      script_processor_fft_node = null,
      analyser = null,
      audioData = null;

  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({canvas});
  renderer.autoClearColor = false;
  renderer.setSize( window.innerWidth/2, window.innerHeight/2 );

  const camera = new THREE.OrthographicCamera(
    -1, // left
     1, // right
     1, // top
    -1, // bottom
    -1, // near,
     1, // far
  );

  const handleSuccess = function(stream) {

    gain_node = audioContext.createGain();
    gain_node.connect(audioContext.destination);

    microphone_stream = audioContext.createMediaStreamSource(stream);

    script_processor_fft_node = audioContext.createScriptProcessor(2048, 1, 1);
    script_processor_fft_node.connect(gain_node);

    analyser = audioContext.createAnalyser();
    analyser.smoothingTimeConstant = 0;
    analyser.fftSize = 2048;

    microphone_stream.connect(analyser);

    analyser.connect(script_processor_fft_node);

    script_processor_fft_node.onaudioprocess = function() {
      audioData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(audioData);
    };
  };

  navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(handleSuccess);

  let scene = new THREE.Scene();
  const scene1 = new THREE.Scene();
  const scene2 = new THREE.Scene();
  const plane = new THREE.PlaneBufferGeometry(2, 2);

  const fragmentShader1 = await loadShader('assets/shaders/shader1.frag');
  const fragmentShader2 = await loadShader('assets/shaders/shader2.frag');

  const uniforms = {
    iTime: { value: 0 },
    iResolution:  { value: new THREE.Vector3() },
    iChannel0: { value: audioData }
  };

  const material1 = new THREE.ShaderMaterial({
    fragmentShader: fragmentShader1,
    uniforms,
  });
  scene1.add(new THREE.Mesh(plane, material1));

  const material2 = new THREE.ShaderMaterial({
    fragmentShader: fragmentShader2,
    uniforms,
  });
  scene2.add(new THREE.Mesh(plane, material2));

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  function render(time) {
    time *= 0.001;  // convert to seconds

    resizeRendererToDisplaySize(renderer);

    const canvas = renderer.domElement;
    uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
    uniforms.iTime.value = time;
    uniforms.iChannel0.value = audioData;

    const slider = document.getElementById('movementRange');
    if (slider.value <= 0.5) {
      if (scene != scene1) {
        scene = scene1;
      }
    } else {
      if (scene != scene2) {
        scene = scene2;
      }
    }
    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();
