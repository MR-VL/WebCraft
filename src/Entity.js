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

        get Name(){
            return this.name;
        }

        InitEntity(){
            for(let k in this.components){
                this.components[k].InitEntity();
            }
        }

        Destroy(){
            for(let k in this.components){
                this.components[k].Destroy();
            }
            this.components = null;
            this.parent = null;
            this.handlers = null;
        }

        SetActive(bool){
            this.parent.SetActive(this, bool);
        }

        SetDead(){
            this.dead = true;
        }

    }

    class Component{
        get name(){
            console.error('Unnamed Component: ' + this.constructor.name);
            return '__UNNAMED__';
        }

        constructor() {
            this.parent = null;
        }

        Destroy(){}

        SetParent(parent){
            this.parent = parent;
        }

        InitComponent(){}

        InitEntity(){}

        GetComponent(name){
            return this.parent.GetComponent(name);
        }

        get Manager(){
            return this.parent.Manager;
        }

        get Parent(){
            return this.parent;
        }

        FindEntity(name){
            return this.parent.FindEntity(name);
        }

        BroadCast(message){
             this.parent.Broadcast(message);
        }

        Update(_){}

        RegisterHandler(name, handler){
            this.parent.RegisterHandler(name, handler);
        }
    }
    return{
        Entity: Entity,
        Component: Component
    }

})();