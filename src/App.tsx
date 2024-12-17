import './App.css'
import * as three from 'three'
import {EntityManager} from './EntityManager.tsx'
import {Entity} from "./Entity.tsx";
import {threejs_component} from './threejs-component.js';
class WebCraft{
    private entityManager: EntityManager;


    constructor() {
        this.Initialize();
    }

    public Initialize(){
         this.entityManager = new EntityManager.EntityManager();

    }

    public LoadControllers(){
        const threejs = new Entity.Entity();
        threejs.AddComponent(new threejs_component.ThreeJSController() )
    }

}