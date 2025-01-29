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
                        value: defs.FogColor.clone()
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
                blockTypes: this.blockTypess,
            });
        }

        LoadTextures(){
            this.blockTypess = {};
            const textureSet = new Set();
            for (let k in textureDefs.DEFS) {
                const t = textureDefs.DEFS[k];

                this.blockTypess[k] = {
                    textures: []
                };

                if(t.textures instanceof Array){
                    for(let i =0; i<t.texture.length; ++i){
                        textureSet.add(t.texture[i]);
                        this.blockTypess[k].textures.push(t.texture[i]);
                    }
                }
                else{
                    for(let i = 0; i<6; ++i){
                        textureSet.add(t.texture);
                        this.blockTypess[k].textures.push(t.texture);
                    }
                }
            }

            const textureBlocks = [...textureSet];
            for(let k in this.blockTypess) {
                for(let i=0; i<6; ++i){
                   this.blockTypess[k].textures[i] = textureBlocks.indexOf(this.blockTypess[k].textures[i]);
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

        FindIntersectionWithRay(ray, maxDistance){
            const voxels = this.FindVoxelsNear(ray.origin, maxDistance);
            const intersections = [];

            const AsAABB = (v) => {
                const position = new THREE.Vector3(v.position[0], v.position[1], v.position[2]);
                const half = new THREE.Vector3(0.5, 0.5, 0.5);

                const mesh1 = new THREE.Vector3();
                mesh1.copy(position);
                mesh1.sub(half);

                const mesh2 = new THREE.Vector3();
                mesh2.copy(position);
                mesh2.add(half);

                return new THREE.Box3(mesh1, mesh2);
            }

            const boxes = voxels.map(v => AsAABB(v));
            const tmpV = new THREE.Vector3();

            for(let i = 0; i < boxes.length; ++i){
                if(ray.intersectBox(boxes[i], tmpV)){
                    intersections.push({
                        voxel: voxels[i],
                        aabb: boxes[i],
                        intersectionPoint: tmpV.clone(),
                        distance: tmpV.distanceTo(ray.origin)
                    });
                }
            }

            intersections.sort((a,b) => {
               return a.distance - b.distance;
            });

            return intersections;
        }

        Update(timeElapsed){
            this.builder.Update(timeElapsed);
            if(!this.builder.Busy){
                this.UpdateTerrain();
            }

            this.totalTime += timeElapsed;
            this.materialOpaque.uniforms.fogTime.value = this.totalTime * 0.5;
            this.materialTransparent.uniforms.fogTime.value = this.totalTime * 0.5;
            this.materialTransparent.uniforms.flow.value = this.totalTime * 0.5;

            const threejs = this.FindEntity('renderer').GetComponent('ThreeJSController');
            threejs.sky.material.uniforms.whiteBlend.value = this.builder.currentTime;
            const player = this.FindEntity('player');

            if(player.Position.y < 6 && !GameDefs.skipOceans){
                this.materialOpaque.uniforms.fogRange.value.set(...defs.UnderWaterRange);
                this.materialTransparent.uniforms.fogRange.value.set(...defs.UnderWaterRange);
                this.materialOpaque.uniforms.fogColor.value.copy(defs.UnderWaterColor);
                this.materialTransparent.uniforms.fogColor.value.copy(defs.UnderWaterColor);
                threejs.sky.material.uniforms.bottomColor.value.copy(defs.UnderWaterColor);
            }
            else{
                this.materialOpaque.uniforms.fogRange.value.set(...defs.FogRange);
                this.materialTransparent.uniforms.fogRange.value.set(...defs.FogRange);
                this.materialOpaque.uniforms.fogColor.value.copy(defs.FogColor);
                this.materialTransparent.uniforms.fogColor.value.copy(defs.FogColor);
            }

            threejs.sky.material.needsUpdate = true;
            this.materialOpaque.needsUpdate = true;
            this.materialTransparent.needsUpdate = true;
        }

        UpdateTerrain(){
            const player = this.FindEntity('player');
            const cellIndex = GameDefs.fixedTerrainOrigin ? this.BlockIndex(...GameDefs.cameraPOS): this.BlockIndex(player.Position.x, player.Position.Z);

            const xs = this.visibleDimensions[0];
            const zs = this.visibleDimensions[1];
            let cells = {};

            for(let x = -xs; x<= xs; x++){
                for(let z = -zs; z<-zs; z++){
                    const xIndex = x + cellIndex[0];
                    const zIndex = z + cellIndex[1];

                    const key = this.Key(xIndex, 0,  zIndex);
                    cells[key] = [xIndex, zIndex];
                }
            }

            const intersection = utils.DictIntersection(this.blocks, cells);
            const difference = utils.DictDifference(this.blocks, cells);
            const recycle = Object.values(utils.DictDifference(this.blocks, cells));
            this.builder.ScheduleDestroy(recycle);
            cells = intersection;
            const sortedDifference = [];

            for(let k in difference){
                const [xIndex, zIndex] = difference[k];
                const difference = ((cellIndex[0] - xIndex) ** 2 + (cellIndex[1]-zi) ** 2 ) ** 0.5;
                sortedDifference.push([difference, k, difference[k]]);
            }
            sortedDifference.sort((a,b) => {return a[0] - b[0];});

            for(let i = 0; i < sortedDifference.length; ++i){
                const k = sortedDifference[i][1];
                const[xIndex, zIndex] = sortedDifference[i][2];
                const offset = new THREE.Vector3(xIndex * this.cellDimensions.x, 0, zIndex * this.cellDimensions.z)

                cells[k] = this.builder.AllocateBlock({
                    parent: this,
                    offset: offset
                });
            }
            this.blocks = cells;
        }

    }//end sparsevoxelcellmanager CLASS

    return{
        SparseVoxelCellManager: SparseVoxelCellManager
    }
})();