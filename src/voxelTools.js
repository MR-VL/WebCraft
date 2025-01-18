import * as THREE from 'three';
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {entity} from "./Entity.js";
import {voxelShader} from "./voxelShader.js";
import {GameDefs} from "./Game-defs.js";

export const voxelTools = (() =>{
    class VoxelToolsInsert extends entity.Component{
        static className = "VoxelToolsInsert";

        get Name(){
            return VoxelToolsInsert.className;
        }

        constructor() {
            super();
            this.voxelType = 'stone';
            this.timer = 0;
            this.active = false;
        }

        InitComponent(){
            this.RegisterHandler('input.pressed', (message) => this.onInput(message));
            this.RegisterHandler('ui.blockChanged', (message) => this.OnBlockIcon(message));
            this.RegisterHandler('ui.toolChanged', (message) => this.OnToolChanged(message));
        }

        OnToolChanged(message){
            if (!GameDefs.showTools){
                return;
            }

            if(message.value !== 'build'){
                this.LoseFocus();
            }
            else{
                this.GainFocus();
            }
        }

        LoseFocus(){
            this.voxelMeshGroup.visible = false;
            this.placementMesh.visible = false;
            this.active = false;
        }


        GainFocus(){
            this.voxelMeshGroup.visible = true;
            this.placementMesh.visible = true;
            this.active = true;
        }

        OnBlockIcon(message){
            this.voxelType = message.value;
            this.UpdateVoxelMesh();
        }

        UpdateVoxelMesh(){
            const voxels = this.FindEntity('voxels').GetComponent('SparseVoxelCellManager');
            const colors = [];
            const uvSlices = [];

            for(let i = 0; i < 6; ++i){
                for(let j = 0; j < 4 * 3; ++j){
                    colors.push(1.0, 1.0, 1.0)
                    uvSlices.push(voxels.blockTypes[this.voxelType].textures[2]);
                }
            }
            this.voxelMesh.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            this.voxelMesh.geometry.setAttribute('uvSlice', new THREE.Float32BufferAttribute(uvSlices, 1));
        }

        InitEntity(){
            const scene = this.FindEntity('renderer').GetComponent('ThreeJSController').scene;
            const camera = this.FindEntity('renderer').GetComponent('ThreeJSController').uiCamera;
            const voxels = this.FindEntity('voxels').GetComponent('SparseVoxelCellManager');
            const geometry = new THREE.BoxBufferGeometry(1, 1, 1);

            const placement1 = new THREE.ShaderMaterial({
                uniforms: {
                    time: {value: 0.0},
                    edgeColor: {value: new THREE.Color(0x000000)}
                },
                vertexShader: voxelShader.PLACEMENT.vectorShader,
                fragmentShader: voxelShader.PLACEMENT.precisionShader,
                side: THREE.FrontSide,
                blending: THREE.NormalBlending,
                transparent: true,
                depthWrite: false
            });

            const placement2 = placement1.clone();
            placement2.side = THREE.BackSide;

            const mesh1 = new THREE.Mesh(geometry, placement1);
            const mesh2 = new THREE.Mesh(geometry, placement2);

            mesh1.renderOrder = 1;

            this.placementMesh = new THREE.Group();
            this.placementMesh.add(mesh1);
            this.placementMesh.add(mesh2);
            this.placementMesh.scale.setScalar(0.999);
            this.material1 = placement1;
            this.material2 = placement2;

            const voxelGeometry = new THREE.BoxBufferGeometry(1, 1, 1);

        }





    }

    class VoxelToolsDelete extends entity.Component{

    }

    return{
      VoxelToolsInsert:VoxelToolsInsert,
      VoxelToolsDelete:VoxelToolsDelete
    };
})();