import './App.css'
import * as three from 'three'
import {EntityManager} from './EntityManager.tsx'
import {entity} from "./Entity.tsx";
import {threejs_component} from './threejs-component.tsx';
import {defs} from './defs.tsx';

class WebCraft{
    private entityManager: EntityManager;


    constructor() {
        this.Initialize();
    }

    public Initialize(){
         this.entityManager = new EntityManager();

    }

    public LoadControllers(){
        const {Entity} = entity();
        const threejs = new entity();

        //threejs.AddComponent(new ThreeJSController() )
    }

}