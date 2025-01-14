import * as THREE from 'three';
import {entity} from "./Entity.js";
import {utils} from "./Utils.js";
import {voxelBuilderThreaded} from "./voxelBuilderThreaded.js";
import {voxelShader} from "./voxelShader.js";
import {textures} from "./textures.js";
import {textureDefs} from "./textureDefs.js";
import {defs} from "./defs.js";
import {GameDefs} from "./Game-defs.js";

export const sparseVoxelCellManager = (() =>{

    class SparseVoxelCellManager extends entity.Component{
        static className = "SparseVoxelCellManager";
        get Name(){
            return "SparseVoxelCellManager".className;
        }

        constructor(params) {
            super();
            this.blocks = {};
            this.cellDimensions = new THREE.Vector3(params.cellSize, params.cellSize, params.cellSize);
            this.visibleDimensions = [params.worldSize, params.worldSize];
            this.dirtyBlocks = {};
            this.ids = 0;
            this.totalTime = 0.0;
        }

        InitEntity(){
            this.scene = this.FindEntity('renderer').GetComponent("ThreeJSController").scene;
            this.materialOpaque = new THREE.ShaderMaterial({
                uniforms: {
                    diffuseMap:{
                        value: null
                    }
                },

            })



        }


    }

    return{
        SparseVoxelCellManager: SparseVoxelCellManager
    }
})();