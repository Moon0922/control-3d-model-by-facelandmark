import React, { useEffect, useRef, useState } from "react";
import "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import "@mediapipe/face_mesh";
import Webcam from "react-webcam";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";

import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

const inputResolution = {
  width: 320,
  height: 240,
};

const videoConstraints = {
  width: inputResolution.width,
  height: inputResolution.height,
  facingMode: "user",
};

function App() {
  const [loaded, setLoaded] = useState(false);
  var mixer, inf;

  useEffect(() => {

    const clock = new THREE.Clock();
    const container = document.getElementById("scene");
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 20);
    camera.position.set(- 1.8, 0.8, 3);

    const scene = new THREE.Scene();

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.useLegacyLights = false;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    container.appendChild(renderer.domElement);
    new GLTFLoader()
      .setMeshoptDecoder(MeshoptDecoder)
      .load('/demo.glb', (gltf) => {
        const mesh = gltf.scene.children[0];
        scene.add(mesh);
        mixer = new THREE.AnimationMixer(mesh);
        const head = mesh.getObjectByName('mesh013');
        inf = head.morphTargetInfluences;
        const gui = new GUI();
        gui.close();

        for (const [key, value] of Object.entries(head.morphTargetDictionary)) {
          gui.add(inf, value, 0, 1, 0.01)
            .name(key.replace('blendShape1.', ''))
            .listen(inf);
        }

      });
    const environment = new RoomEnvironment(renderer);
    const pmremGenerator = new THREE.PMREMGenerator(renderer);

    scene.background = new THREE.Color(0x666666);
    scene.environment = pmremGenerator.fromScene(environment).texture;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 2.5;
    controls.maxDistance = 5;
    controls.minAzimuthAngle = - Math.PI / 2;
    controls.maxAzimuthAngle = Math.PI / 2;
    controls.maxPolarAngle = Math.PI / 1.8;
    controls.target.set(0, 0.15, - 0.2);

    const stats = new Stats();
    container.appendChild(stats.dom);

    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
      controls.update();
      stats.update();
    });

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);

    });

  }, [])

  const runDetector = async (video) => {
    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    const detectorConfig = {
      runtime: "tfjs",
    };
    const detector = await faceLandmarksDetection.createDetector(
      model,
      detectorConfig
    );
    const detect = async (net) => {
      const estimationConfig = { flipHorizontal: false };
      const faces = await net.estimateFaces(video, estimationConfig);
      requestAnimationFrame(() => {
        if (faces[0]) {
          let keyPoint = faces[0].keypoints;
          var lip_width = Math.sqrt((keyPoint[62].x - keyPoint[292].x) * (keyPoint[62].x - keyPoint[292].x) + (keyPoint[62].y - keyPoint[292].y) * (keyPoint[62].y - keyPoint[292].y));
          var lip_height =  Math.sqrt((keyPoint[13].x - keyPoint[14].x) * (keyPoint[13].x - keyPoint[14].x) + (keyPoint[13].y - keyPoint[14].y) * (keyPoint[13].y - keyPoint[14].y));
          inf[2] = lip_height / lip_width * 3;

          var left_eye_width = Math.sqrt((keyPoint[33].x - keyPoint[133].x) * (keyPoint[33].x - keyPoint[133].x) + (keyPoint[33].y - keyPoint[133].y) * (keyPoint[33].y - keyPoint[133].y));
          var left_eye_height =  Math.sqrt((keyPoint[159].x - keyPoint[145].x) * (keyPoint[159].x - keyPoint[145].x) + (keyPoint[159].y - keyPoint[145].y) * (keyPoint[159].y - keyPoint[145].y));

          inf[0] = left_eye_height / left_eye_width;
          if(inf[0] < 0.23)
            inf[0] = inf[0];
          else if(inf[0] < 0.3)
            inf[0] = 1 - inf[0] * 2;
          else
            inf[0] = 1 - inf[0] * 3;
          var right_eye_width = Math.sqrt((keyPoint[362].x - keyPoint[263].x) * (keyPoint[362].x - keyPoint[263].x) + (keyPoint[362].y - keyPoint[263].y) * (keyPoint[362].y - keyPoint[263].y));
          var right_eye_height =  Math.sqrt((keyPoint[386].x - keyPoint[374].x) * (keyPoint[386].x - keyPoint[374].x) + (keyPoint[386].y - keyPoint[374].y) * (keyPoint[386].y - keyPoint[374].y));

          inf[1] = right_eye_height / right_eye_width;
          if(inf[1] < 0.23)
            inf[1] = 1;
          else if(inf[0] < 0.3)
            inf[1] = 1 - inf[1] * 2;
          else
          	inf[1] = 1 - inf[1] * 3;
        }
      });
    };
    setInterval(() => {
      detect(detector);  
    }, 100);
  };

  const handleVideoLoad = (videoNode) => {
    const video = videoNode.target;
    if (video.readyState !== 4) return;
    if (loaded) return;
    runDetector(video);
    setLoaded(true);
  };

  return (
    <div className="container">
      <div id="scene"></div>
      <div style={{ position: 'absolute', bottom: '0px', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: "center" }}>
          <Webcam
            width={inputResolution.width}
            height={inputResolution.height}
            style={{ visibility: "visible" }}
            videoConstraints={videoConstraints}
            onLoadedData={handleVideoLoad}
          />
        </div>
      </div>
      {loaded ? <></> : <header>Loading...</header>}
    </div>
  );
}

export default App;
