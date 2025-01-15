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
                    },
                    noiseMap:{
                        value: null
                    },
                    fogColor:{
                        value: defs.fogColor.clone()
                    },
                    fogDensity:{
                        value: 0.000065
                    },
                    fogRange:{
                        value: new THREE.Vector2(250,250)
                    },
                    fogTime:{
                        value: 0.0
                    },
                    fade:{
                        value: 1.0
                    },
                    flow:{
                        value: 0.0
                    }
                },

                vertexShader: voxelShader.VOXEL.vectorShader,
                fragmentShader: voxelShader.VOXEL.precisionShader,
                side: THREE.FrontSide
            });
            this.materialTransparent = this.materialOpaque.clone();
            this.materialTransparent.side = THREE.FrontSide;
            this.materialTransparent.transparent = true;

            this.LoadTextures();

            this.builder = new voxelBuilderThreaded.VoxelBuilderThreaded({
                scene: this.scene,
                dimensions: this.cellDimensions,
                materialOpaque: this.materialOpaque,
                materialTransparent: this.materialTransparent,
                blockTypes: this.blockTypes,
            });
        }


    }

    return{
        SparseVoxelCellManager: SparseVoxelCellManager
    }
})();