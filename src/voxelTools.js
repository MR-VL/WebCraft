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






    }

    class VoxelToolsDelete extends entity.Component{

    }

    return{
      VoxelToolsInsert:VoxelToolsInsert,
      VoxelToolsDelete:VoxelToolsDelete
    };
})();