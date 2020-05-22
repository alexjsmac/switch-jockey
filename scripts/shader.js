import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/build/three.module.js';

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
  const scene1 = new THREE.Scene();
  const scene2 = new THREE.Scene();
  const plane = new THREE.PlaneBufferGeometry(2, 2);

  const fragmentShader1 = await loadShader('assets/shaders/shader1.txt');
  const fragmentShader2 = await loadShader('assets/shaders/shader2.txt');

  const uniforms = {
    iTime: { value: 0 },
    iResolution:  { value: new THREE.Vector3() },
  };

  const material1 = new THREE.ShaderMaterial({
    fragmentShader: fragmentShader1,
    uniforms,
  });
  scene1.add(new THREE.Mesh(plane, material1));
  console.log(scene1);

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

    const slider = document.getElementById('movementRange');
    if (slider.value > 0.5) {
      renderer.render(scene1, camera);
    } else {
      renderer.render(scene2, camera);
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();
