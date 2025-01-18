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



    }

    class VoxelToolsDelete extends entity.Component{

    }

    return{
      VoxelToolsInsert:VoxelToolsInsert,
      VoxelToolsDelete:VoxelToolsDelete
    };
})();