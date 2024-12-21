import * as THREE from 'three';

export const entity = (() => {

    class Entity{
        // initialize all class private variables to a default value
        constructor() {
            this.name = null;
            this.components = {};
            this.position = new THREE.Vector3();
            this.rotation = new THREE.Quaternion();
            this.handlers = {};
            this.parent = null;
            this.dead = false;
        }

        SetParent(parent){
            this.parent = parent;
        }

        SetName(name){
            this.name = name;
        }

        InitEntity(){
            for(let k in this.components){
                this.components[k].InitEntity();
            }
        }

    }


})