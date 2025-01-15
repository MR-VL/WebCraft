import * as THREE from 'three';
import {entity} from "./Entity.js";
import {utils} from "./Utils.js";
import {voxelBuilderThreaded} from "./voxelBuilderThreaded.js";
import {voxelShader} from "./voxelShader.js";
import {textures} from "./textures.js";
import {textureDefs} from "./textureDefs.js";
import {defs} from "./defs.js";
import {GameDefs} from "./Game-defs.js";
import {noise} from "./noise.js";

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

        LoadTextures(){
            this.blockTypes = {};
            const textureSet = new Set();
            for (let k in textureDefs.DEFS) {
                const t = textureDefs.DEFS[k];

                this.blockTypes[k] = {
                    textures: []
                };

                if(t.textures instanceof Array){
                    for(let i =0; i<t.texture.length; ++i){
                        textureSet.add(t.texture[i]);
                        this.blockTypes[k].textures.push(t.texture[i]);
                    }
                }
                else{
                    for(let i = 0; i<6; ++i){
                        textureSet.add(t.texture);
                        this.blockTypes[k].textures.push(t.texture);
                    }
                }
            }

            const textureBlocks = [...textureSet];
            for(let k in this.blockTypes) {
                for(let i=0; i<6; ++i){
                   this.blockTypes[k].textures[i] = textureBlocks.indexOf(this.blockTypes[k].textures[i]);
                }
            }

            const path = './resources/blocks/';
            const diffuse = new textures.TextureAtlas();
            diffuse.Load('diffuse', textureBlocks.map(t => path + t));
            diffuse.onLoad = () => {
                this.materialOpaque.uniforms.diffuseMap.value = diffuse.Info['diffuse'].atlas;
                this.materialTransparent.uniforms.diffuseMap.value = diffuse.Info['diffuse'].atlas;
            };

            const loader = new THREE.TextureLoader();
            const noiseTexture = loader.load('/resources/simplex.png');
            noiseTexture.wrapS = THREE.RepeatWrapping;
            noiseTexture.wrapT = THREE.RepeatWrapping;
            noiseTexture.minFilter = THREE.LinearMipMapLinearFilter;
            noiseTexture.maxFilter = THREE.NearestFilter;
            this.materialOpaque.uniforms.noiseMap.value = noiseTexture;
            this.materialTransparent.uniforms.noiseMap.value = noiseTexture;
        }

        Key(x, y, z) {
            return x + '.' + y + '.' + z;
        }

        BlockIndex(xPositive, zPositive) {
            const x = Math.floor(xPositive / this.cellDimensions.x);
            const z = Math.floor(xPositive / this.cellDimensions.z);
            return [x, z];
        }

        FindBlock(xPositive, zPositive) {
            const [currentX, currentZ] = this.BlockIndex(xPositive, zPositive);
            const key = this.Key(currentX, 0,  currentZ);
            if(key in this.blocks){
                return this.blocks[key];
            }
            return null;
        }

        GetAdjacentBlocks(xPositive, zPositive) {
            const blocks = [];
            for(let xi = -1; xi <=1; ++xi){
                for(let zi = -1; zi <= 1; ++zi){
                    if(xi === 0 && zi === 0){
                        continue;
                    }
                    const [currentX, currentZ] = this.BlockIndex(xPositive, zPositive);
                    const key = this.Key(currentX + xi, 0, currentZ + zi);
                    if(key in this.blocks){
                        blocks.push(this.blocks[key]);
                    }
                }
            }
            return blocks;
        }

        InsertVoxelAt(position, type, skippable){
            const block = this.FindBlock(position[0], position[2]);
            if(!block){
                return;
            }

            block.InsertVoxelAt(position, type, skippable);
        }

        RemoveVoxelAt(position){
            const block = this.FindBlock(position[0], position[2]);
            if(!block){
                return;
            }
            block.RemoveVoxelAt(position);
        }

        HasVoxelAt(x, y, z){
            const block = this.FindBlock(x, z);
            if(!block){
                return false;
            }

            return block.HasVoxelAt(x, y, z);
        }

        FindVoxelsNear(position, radius){
            const [xNegative, zNegative] = this.BlockIndex(position.x - radius, position.z - radius);
            const [xPositive, zPositive] = this.BlockIndex(position.x + radius, position.z + radius);

            const voxels = [];
            for(let xi = xNegative; xi <= xPositive; xi++){
                for(let zi = zNegative; zi <= zPositive; zi++){
                    const key = this.Key(xi, 0, zi);
                    if(key in this.blocks){
                        const current = this.blocks[key];

                        voxels.push(...current.FindVoxelsNear(position, radius));
                    }
                }
            }
            return voxels;
        }

    }

    return{
        SparseVoxelCellManager: SparseVoxelCellManager
    }
})();