import * as THREE from 'three';
import {workerPool} from "./workerPool.js";
import {voxelBlockBuilder} from "./voxelBlockBuilder.js";
import {GameDefs} from "./Game-defs.js";

export const voxelBuilderThreaded = (() => {

    class SparseVoxelCellBlock{
        constructor(params){
            this.params = params;
            this.voxels = {};
            this.group = new THREE.Group();
            this.buildID = 0;
            this.lastBuildID = -1;
            this.building = false;
            this.dirty = false;
            this.builder = new voxelBlockBuilder.VoxelBlockBuilder();
            params.scene.add(this.group);
        }

        Destroy(){
            this.ReleaseAssets();
            this.group.parent.remove(this.group);
        }

        ReleaseAssets(){
            this.group.traverse(current => {
                if(current.material){
                    current.material.dispose();
                }
                if(current.geometry){
                    current.geometry.dispose();
                }
            });
            if (this.opaqueMesh){
                this.group.remove(this.opaqueMesh);
            }

            if(this.transparentMesh){
                this.group.remove(this.transparentMesh);
            }
        }

        Show(){
            this.group.visible = true;
        }

        Hide(){
            this.group.visible = false;
        }

        get Destroyed(){
            return !this.group.parent;
        }

        get Dirty(){
            return this.dirty
        }

        Key(x, y, z){
            return x + '.' + y + '.' + z;
        }

        InsertVoxelAt(position, type, skippable){
            const key = this.Key(...position);
            if(key in this.voxels && skippable){
                return;
            }

            //todo code cleanup
            const voxel = {
                position: [...position],
                type: type,
                visible: true
            };

            this.voxels[key] = voxel;
            this.buildID++;
            this.dirty = true;

            const neighbors = this.params.parent.GetAdjacentBlocks(this.params.offset.x, this.params.offset.z);

            for(let xi = -1; xi <= 1; ++xi){
                for(let yi = -1; yi <= 1; ++yi){
                    for(let zi = -1; zi <= 1; ++zi){
                        for(let ni=0; ni < neighbors.length; ++ni){
                            const key = this.Key(position[0]+xi, position[1]+yi, position[2]+zi);
                            if(key in neighbors[ni].voxels){
                                neighbors[ni].buildID++;
                                neighbors[ni].dirty = true;
                            }
                        }
                    }
                }
            }
        }

        RemoveVoxelAt(position){
            this.buildID++;
            this.dirty = true;

            const params = {
                buildID: this.buildID,
                offset: this.params.offset.toArray(),
                dimensions: this.params.dimensions.toArray(),
                blockTypes: this.params.blockTypes,
                currentTime: 0.0
            };

            this.builder.Init(params);

            const keyVoxel = this.Key(...position);
            this.voxels[keyVoxel].visible = false;
            const fillVoxels = this.builder.RemoveVoxelAndFill(position, this.voxels);
            for(let key in fillVoxels){
                this.params.parent.InsertVoxelAt(fillVoxels[key].position, fillVoxels[key].type, true);
            }

            const neighbors = this.params.parent.GetAdjacentBlocks(this.params.offset.x, this.params.offset.z);

            //todo possible cleanup / make into function due to reuse
            for(let xi = -1; xi <= 1; ++xi){
                for(let yi = -1; yi <= 1; ++yi){
                    for(let zi = -1; zi <= 1; ++zi){
                        for(let ni=0; ni < neighbors.length; ++ni){
                            const key = this.Key(position[0]+xi, position[1]+yi, position[2]+zi);
                            if(key in neighbors[ni].voxels){
                                neighbors[ni].buildID++;
                                neighbors[ni].dirty = true;
                            }
                        }
                    }
                }
            }
        }

        PartialRebuild(){
            const neighbors = this.params.parent.GetAdjacentBlocks(this.params.offset.x, this.params.offset.z);
            const neighborVoxels = {};
            const xNegative = this.params.offset.x -1;
            const zNegative = this.params.offset.z-1;
            const xPositive = this.params.offset.x + this.params.dimensions.x;
            const zPositive = this.params.offset.z + this.params.dimensions.z;

            for(let ni =0; ni<neighbors.length; ++ni){
                const neighbor = neighbors[ni];
                for(let key in neighbors.voxels){
                    const vox = neighbor.voxels[key];
                    //todo possible type cast
                    if(vox.position[0] === xNegative || vox.position[0] === xPositive || vox.position[2]=== zNegative || vox.position[2]===zPositive){
                        neighborVoxels[key] = vox;
                    }
                }
            }

            const params = {
                buildID: this.buildID,
                offset: this.params.offset.toArray(),
                dimensions: this.params.dimensions.toArray(),
                blockTypes: this.params.blockTypes,
                currentTime: 0.0
            };

            this.builder.Init(params);
            const data = this.builder.PartialRebuild(this.voxels, neighborVoxels);
            this.RebuildMeshFromData(data);
            this.dirty = false;
        }

        HasVoxelAt(x, y, z){
            const key = this.Key(x, y, z);
            if (!(key in this.voxels)){
                return false;
            }

            return this.voxels[key].visible;
        }

        FindVoxelsNear(position, radius){
            const xPositive = Math.ceil(position.x + (radius + 1));
            const yPositive = Math.ceil(position.y + (radius + 1));
            const zPositive = Math.ceil(position.z + (radius + 1));
            const xNegative = Math.floor(position.x - (radius + 1));
            const yNegative = Math.floor(position.y - (radius + 1));
            const zNegative = Math.floor(position.z - (radius + 1));

            const voxels = [];
            for (let xi = xNegative; xi <= xPositive; ++xi) {
                for (let yi = yNegative; yi <= yPositive; ++yi) {
                    for (let zi = zNegative; zi <= zPositive; ++zi) {
                        const k = this.Key(xi, yi, zi);
                        if (k in this.voxels) {
                            if (this.voxels[k].visible) {
                                voxels.push(this.voxels[k]);
                            }
                        }
                    }
                }
            }

            return voxels;
        }

        BuildGeometry(data, material){
            const geometry = new THREE.BufferGeometry();
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = false;
            mesh.receiveShadow = true;

            geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
            geometry.setAttribute('normal', new THREE.Float32BufferAttribute(data.normals, 3));
            geometry.setAttribute('uv', new THREE.Float32BufferAttribute(data.uvs, 2));
            geometry.setAttribute('uvSlice', new THREE.Float32BufferAttribute(data.uvSlices, 1));
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(data.colors, 3));
            geometry.setIndex(new THREE.BufferAttribute(data.indices, 1));

            geometry.attributes.position.needsUpdate = true;
            geometry.attributes.normal.needsUpdate = true;
            geometry.attributes.uv.needsUpdate = true;
            geometry.attributes.color.needsUpdate = true;

            geometry.computeBoundingBox();
            geometry.computeBoundingSphere();
            return mesh;
        }

        RebuildMeshFromData(data){
            this.ReleaseAssets();

            if(data.opaque.positions.length > 0){
                this.opaqueMesh = this.BuildGeometry(data.opaque, this.params.materialOpaque);
                this.group.add(this.opaqueMesh);
            }
            if(data.transparent.positions.length > 0){
                this.transparentMesh = this.BuildGeometry(data.transparent, this.params.materialTransparent);
                this.group.add(this.transparentMesh);
            }

            this.voxels = data.voxelss;
            this.lastBuildID = data.buildID;
        }

    }// end sparsevoxelcellblock class


     //todo add preset depending on hardware or have it to where user can change
    // 7 sometimes lags on generation at least on my computer
    const numWorkers = 7;


    class VoxelBuilderThreaded{
        constructor(params) {
            this.old = [];
            this.blocks = [];
            this.workerPool = new workerPool.WorkerPool(numWorkers);
            this.params = params;
            this.currentTime = 0.01;
        }

        OnResult(block, message){
            if(message.subject === 'buildChunkResult'){
                block.RebuildMeshFromData(message.data);
                block.Show();
            }
        }

        AllocateBlock(params){
            const blockParams = {...this.params, ...params};
            const block = new SparseVoxelCellBlock(blockParams);

            block.Hide();
            this.blocks.push(block);
            this.RebuildBlock(block);
            return block;
        }

        RebuildBlock(block){
            if(block.building){
                return;
            }

            const message = {
                subject: 'buildChunk',
                params: {
                    buildID: block.buildID,
                    offset: block.params.offset.toArray(),
                    dimensions: this.params.dimensions.toArray(),
                    blockTypes: this.params.blockTypes,
                    currentTime: this.currentTime
                }
            };

            block.building = true;
            this.workerPool.enqueue(message => {
                block.building = false;
                this.OnResult(block, message);
            });
        }

        ScheduleDestroy(blocks){
            this.old.push(...blocks);
        }

        DestroyBlocks(blocks){
            for(let current of blocks){
                current.Destroy();
            }
        }

        get Busy(){
           return this.workerPool.Busy;
        }

        Update(timeElapsed){
            if(!this.Busy){
                this.DestroyBlocks(this.old);
                this.old = [];
            }

            this.blocks = this.blocks.filter(block => !block.Destroyed);

            for(let i=0; i<this.blocks.length; ++i){
                if(GameDefs.introEnabled){
                    this.RebuildBlock(this.blocks[i]);
                }

                if(this.blocks[i].Dirty){
                    this.blocks[i].PartialRebuild();
                }
            }

            if(GameDefs.introEnabled){
                this.currentTime += timeElapsed * GameDefs.introRate;
            }
            else{
                this.currentTime = 2;
            }
        }
    }//end voxelBuilderthreaded
    return{
        VoxelBuilderThreaded : VoxelBuilderThreaded
    };
})();