import * as THREE from 'three';
import{entity} from "./Entity.js";
import{GameDefs} from "./Game-defs.js";
import{math} from "./math.js";
import{voxelShader} from "./voxelShader.js";

export const cloudController = (function(){
    class CloudController extends entity.Component{
        static className = 'CloudController';

        get Name(){
            return CloudController.className;
        }

        constructor() {
            super();
            this.clouds = [];
        }

        InitEntity(){
            const threejs = this.FindEntity('renderer').GetComponent('ThreeJSController');
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            this.group = new THREE.Group();

            for(let i =0; i<20; ++i){
                const width = math.randomInt(5, 10) *20;
                const length = math.randomInt(5, 10) * 20;

                const x = math.randomInt(-150, 150) * 10;
                const y = math.randomInt(0, 0) * 25;
                const z = math.randomInt(-150, 150) * 10;

                const material = new THREE.ShaderMaterial({
                    uniforms: {
                        cloudMin:{
                            value: null
                        },
                        cloudMax:{
                            value: null
                        }
                    },

                    vertexShader: voxelShader.CLOUD.vectorShader,
                    fragmentShader: voxelShader.CLOUD.precisionShader,
                    side: THREE.FrontSide,
                    transparent: true
                });

                const box = new THREE.Mesh(geometry, material);
                box.position.set(x, y, z);
                box.scale.set(width, 50, length);
                this.group.add(box);
                this.clouds.push(box);
            }

            this.group.visible = !GameDefs.skipClouds;
            threejs.scene.add(this.group);
            this.CreateSun();
        }

        CreateSun(){
            const geometry = new THREE.PlaneGeometry(300, 300);

            const material = new THREE.ShaderMaterial({
                uniforms: {},
                vertexShader: voxelShader.SUN.vectorShader,
                fragmentShader: voxelShader.SUN.precisionShader,
                side: THREE.FrontSide,
                transparent: true,
                blending: THREE.AdditiveBlending,
            });
            const sun = new THREE.Mesh(geometry, material);
            sun.position.set(692, 39, -286);
            sun.rotateX(0.5 * 2.0 * Math.PI);
            sun.lookAt(0, 0, 0);
            this.group.add(sun);
        }

        Update(){
            const player = this.FindEntity('player');
            const cameraPosition = player.Position;

            this.group.position.set(cameraPosition.x, 250, cameraPosition.z);

            for(let i =0; i<this.clouds.length; ++i){
                const cloud = this.clouds[i];
                cloud.updateMatrixWorld(true);
                const material = cloud.material;
                material.uniforms.cloudMin.value = new THREE.Vector3(-0.5, -0.5, -0.5);
                material.uniforms.cloudMax.value = new THREE.Vector3(0.5, 0.5, 0.5);
                material.uniforms.cloudMin.value.applyMatrix4(cloud.matrixWorld);
                material.uniforms.cloudMax.value.applyMatrix4(cloud.matrixWorld);
            }
        }
    }

    return {
        CloudController:CloudController
    };
})();