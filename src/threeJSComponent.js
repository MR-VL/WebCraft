import * as THREE from "three";

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';

import {GammaCorrectionShader} from "three/examples/jsm/shaders/GammaCorrectionShader.js";
import {FXAAShader} from "three/examples/jsm/shaders/FXAAShader.js";

import {entity} from "./Entity.js";
import {GameDefs} from "./Game-defs.js";
import {defs} from "./defs.js";

export const threeJSComponents = (() =>{
    const vertexShader = `
      varying vec3 vWorldPosition;
      
      void main() {
        vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
        vWorldPosition = worldPosition.xyz;
      
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }`;

    const fragmentShader =  `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform vec3 playerPos;
      uniform float offset;
      uniform float exponent;
      uniform float whiteBlend;
      uniform float time;
      uniform samplerCube background;
      
      varying vec3 vWorldPosition;
      
      float sdPlane(vec3 p, vec3 n, float h) {
        // n must be normalized
        return dot(p, n) + h;
      }
    
      void main() {
        vec3 viewDirection = normalize(vWorldPosition - cameraPosition);
        vec3 stars = sRGBToLinear(textureCube(background, viewDirection)).xyz;
     
        float h = normalize(vWorldPosition + offset).y;
        float t = max(pow(max(h, 0.0), exponent), 0.0);
      
        float f = exp(min(0.0, -vWorldPosition.y * 0.0125));
      
        float heightMix = clamp((playerPos.y - 500.0) / 1000.0, 0.0, 1.0);
        heightMix = smoothstep(0.0, 1.0, heightMix);
        heightMix = smoothstep(0.0, 1.0, heightMix);
    
        float wrapFactor = playerPos.y / 500.0;
        float normalMix = clamp((viewDirection.y + wrapFactor) / (1.0 + wrapFactor), 0.0, 1.0);
        normalMix = pow(normalMix, 0.250);
    
        vec3 topMix = mix(topColor, stars, heightMix * normalMix);
    
        // Normal
        vec3 sky = mix(topMix, bottomColor, f);
        // Moon
        // vec3 sky = mix(stars, bottomColor, f);
        float skyMix = clamp(whiteBlend, 0.0, 1.0);
        sky = mix(bottomColor, sky, skyMix * skyMix);
        gl_FragColor = vec4(sky, 1.0);
        // gl_FragColor = vec4(vec3(normalMix * normalMix), 1.0);
      }`;

    class ThreeJSController extends entity.Component{
        static className = "ThreeJSController";

        get NAME(){
            return ThreeJSController.className;
        }

        constructor() {
            super();
        }

        InitEntity(){
            this.threejs = new THREE.WebGLRenderer({antialias:false});

            this.threejs.shadowMap.enabled = true;
            this.threejs.shadowMap.type= THREE.PCFSoftShadowMap;
            this.threejs.setPixelRatio(window.devicePixelRatio);
            this.threejs.setSize( window.innerWidth, window.innerHeight );
            this.threejs.domElement.id = 'threejs';

            document.getElementById('container').appendChild(this.threejs.domElement);
            window.addEventListener('resize', () => {this.OnResize();}, false);

            const fov = 60;
            const aspect = 1920 / 1080;
            const near = 0.5;
            const far = 10000.0;
            this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
            this.camera.position.set(15, 50, 15);
            this.camera.lookAt(0, 0, 0);

            this.uiCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);

            this.scene = new THREE.Scene();
            this.scene.add(this.camera);

            this.uiScene = new THREE.Scene();
            this.uiScene.add(this.uiCamera);

            let light = new THREE.DirectionalLight(0xb1b6d0, 0.7);
            light.position.set(-10, 500, 10);
            light.target.position.set(0, 0, 0);
            this.scene.add(light);
            this.uiScene.add(light.clone());

            this.sun = light;

            const params = {
                minFilter: THREE.LinearFilter,
                maxFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat,
                type: THREE.FloatType
            };

            const hdr = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, params);
            hdr.stencilBuffer = false;
            hdr.depthBuffer = true;
            hdr.depthTexture = new THREE.DepthTexture();
            hdr.depthTexture.format = THREE.DepthFormat;
            hdr.depthTexture.type = THREE.UnsignedIntType;

            this.fxaa = new ShaderPass(FXAAShader);

            const uiPass = new RenderPass(this.uiScene, this.uiCamera);
            uiPass.clear = false;

            this.composer = new EffectComposer(this.threejs, hdr);
            this.composer.addPass(new RenderPass(this.scene, this.camera));
            this.composer.addPass(uiPass);
            this.composer.addPass(this.fxaa);
            this.composer.addPass(new ShaderPass(GammaCorrectionShader));


            const mesh1 = new THREE.Mesh(
                new THREE.BoxBufferGeometry(0.1, 0.01, 0.01),
                new THREE.MeshBasicMaterial({
                    color: new THREE.Color(0xFFFFFF),
                    depthWrite: false,
                    depthTest: false
                })
            );
            mesh1.position.set(0, 0, -2);

            const mesh2 = new THREE.Mesh(
                new THREE.BoxBufferGeometry(0.1, 0.01, 0.01),
                new THREE.MeshBasicMaterial({
                    color: new THREE.Color(0xFFFFFF),
                    depthWrite: false,
                    depthTest: false
                })
            );
            mesh2.position.set(0, 0, -2);

            this.uiCamera.add(mesh1);
            this.uiCamera.add(mesh2);

            if(!GameDefs.showTools){
                mesh1.visible = false;
                mesh2.visible = false;
            }

            //todo orbit ctrl

            this.LoadSky();
            this.OnResize();
        }

        OnResize(){
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.threejs.setSize( window.innerWidth, window.innerHeight );
            this.composer.setSize( window.innerWidth, window.innerHeight );

            const pixelRatio = this.threejs.getPixelRatio();

            this.fxaa.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio);
            this.fxaa.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio);
        }

        LoadSky(){
            const hemisphereLight = new THREE.HemisphereLight(0x483965, 0xFFFFFF, 0.9);
            this.scene.add(hemisphereLight);
            this.uiScene.add(hemisphereLight);

            const loader = new THREE.CubeTextureLoader();
            const texture = loader.load([
                './resources/space/posx.jpg',
                './resources/space/negx.jpg',
                './resources/space/posy.jpg',
                './resources/space/negy.jpg',
                './resources/space/posz.jpg',
                './resources/space/negz.jpg'
            ]);

            texture.encoding = THREE.sRGBEncoding;

            const uniforms = {
                "topColor": {value: defs.SkyColor.clone()},
                "bottomColor": {value: defs.FogColor.clone()},
                "offset": {value:0},
                "exponent": {value: 0.5},
                "background": {value: texture},
                "whiteBlend": {value: 0.0},
                "playerPos": {value: new THREE.Vector3()},
                time:{
                    value:0.0
                }
            };

            const skyGeo = new THREE.SphereBufferGeometry(5000, 32, 15);
            const skyMat = new THREE.ShaderMaterial({
                uniforms: uniforms,
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                side: THREE.BackSide
            });

            const sky = new THREE.Mesh(skyGeo, skyMat);
            this.sky = sky;
            this.scene.add(sky);
        }

        Update(timeElapsed){
            const player = this.FindEntity('player');
            if(!player){
                return;
            }

            const position = player.position;
            const forward = new THREE.Vector3(0, 0, -1);
            forward.applyQuaternion(player.Quaternion);
            forward.multiplyScalar(750);

            this.sun.position.copy(position);
            this.sun.position.add(new THREE.Vector3(-50, 200, -10));
            this.sun.target.position.copy(position);
            this.sun.updateMatrixWorld();
            this.sun.target.updateMatrix();

            this.sky.position.copy(new THREE.Vector3(position.x, 0, position.z));
            this.sky.material.uniforms.playerPos.value.copy(position);
            this.sky.material.uniforms.time.value += timeElapsed;
            this.sky.material.needsUpdate = true;
        }

        Render(){
            this.uiCamera.position.copy(this.camera.position);
            this.uiCamera.quaternion.copy(this.camera.quaternion);
            this.composer.render();
        }
    }

    return{
        ThreeJSController: ThreeJSController
    }

})();