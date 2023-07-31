import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { useEffect, useState } from 'react';
import { useMyContext } from '../provider';

export default function Model() {
    var mixer, inf;
    const [state, {}] = useMyContext();
    const [influences, setInfluences] = useState([]);
    
    useEffect(() => {
        if(state.faces.length > 0)
        {
            setInfluences(state.faces);
        }
    }, [state])

    useEffect(() => {

        const clock = new THREE.Clock();
        const container = document.getElementById("model");
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
                //setInfluences(inf);
                inf[0] = 0.5;
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
            
            if(inf != undefined && state.faces.length > 0)
                inf[0] = state.faces[0];
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

    return (
        <div id="model" className=""></div>
    )
}