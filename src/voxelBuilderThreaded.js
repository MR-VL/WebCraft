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

    }// end sparsevoxelcellblock class

    return{
        VoxelBuilderThreaded : VoxelBuilderThreaded
    };
})();