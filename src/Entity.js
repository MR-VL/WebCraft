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
            //loops through and calls the func to init each component
            for(let k in this.components){
                this.components[k].InitEntity();
            }
        }

        Destroy(){
            //goes over each component and calls the destroy function to free up memory
            for(let k in this.components){
                this.components[k].Destroy();
            }
            //set fields to null since component was destroyed
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

        RegisterHandler(name, handler){
            //adds the name to the handlers
            if(!(name in this.handlers)){
                this.handlers[name] = [];
            }
            //pushes name to handler
            this.handlers[name].push(handler);
        }

        get Manager(){
            //parent manages all subs
            return this.parent;
        }

        AddComponent(component){
            //pass current obj to set it as parent
            component.SetParent(this);
            //store name and associate it with val
            this.components[component.NAME] = component;
            //initialize it
            component.InitComponent();
        }

        GetComponent(name){
            return this.components[name];
        }
        FindEntity(name){
            return this.parent.Get(name);
        }

        BroadCast(message){
            if(!(message.topic in this.handlers)){
                return;
            }

            for (let curHandler of this.handlers[message.topic]){
                curHandler(message);
            }
        }

        SetPosition(position){
            this.position.copy(position);
            this.BroadCast({
                topic: 'update position',
                value: this.position
            })
        }

        get Position(){
            return this.position;
        }

        SetQuaternion(rotation){
            this.rotation.copy(rotation);

            this.BroadCast({
                topic: 'update.rotation',
                value: this.rotation
            })
        }

        get Quaternion(){
            return this.rotation;
        }

        Update(timeElapsed){
            for(let k in this.components){
                this.components[k].Update(timeElapsed);
            }
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
             this.parent.BroadCast(message);
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