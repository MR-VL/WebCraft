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
    }


})