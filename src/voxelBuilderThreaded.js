import * as THREE from 'three';
import {workerPool} from "./workerPool.js";
import {voxelBlockBuilder} from "./voxelBlockBuilder.js";
import {GameDefs} from "./Game-defs.js";

export const voxelBuilderThreaded = (() => {

    class SparseVoxelCellBlock{
        constructor(params){
            this.params = params;
            this.voxles = {};
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



    }


    return{
        VoxelBuilderThreaded : VoxelBuilderThreaded
    };
})();