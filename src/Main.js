import * as THREE from 'three';
import {threeJSComponents} from "./threeJSComponent.js";
import {sparseVoxelCellManager} from "./sparseVoxelCellManager.js";
import {entityManager} from "./EntityManager.js";
import {entity} from "./Entity.js";
import {cloudController} from "./cloudController.js";
import {playerController} from "./playerController.js";
import {voxelTools} from "./voxelTools.js";
import {GameDefs} from "./Game-defs.js";
import {uiController} from "./uiController.js";
import {defs} from "./defs.js";

class WebCraft{
    constructor() {
        this.Initialize();
    }

    Initialize() {
        this.entityManager = new entityManager.EntityManager();
        this.LoadControllers();
        this.previousRAF = null;
        this.RAF();
    }

    LoadControllers() {

    }

    RAF(){

    }

}

let APP = null;

window.addEventListener('DOMContentLoaded', () => {
    APP = new WebCraft();
});
