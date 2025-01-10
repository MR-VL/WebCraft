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



    }


    return{
        VoxelBuilderThreaded : VoxelBuilderThreaded
    };
})();