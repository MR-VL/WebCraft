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
        const threejs = new entity.Entity();
        threejs.AddComponent(new threeJSComponents.ThreeJSController());
        this.entityManager.Add(threejs, 'renderer');

        this.renderer = threejs.GetComponent('THREEJSController');
        this.scene = threejs.GetComponent('THREEJSController').scene;
        this.camera = threejs.GetComponent('THREEJSController').camera;
        this.threejs = threejs.GetComponent('THREEJSController').threejs;

        const voxelManager = new entity.Entity();
        voxelManager.AddComponent(new sparseVoxelCellManager.SparseVoxelCellManager({
            cellSize: GameDefs.worldBlockSize,
            worldSize: GameDefs.worldSize
        }));

        this.entityManager.Add(voxelManager, 'voxels');

        const clouds = new entity.Entity();
        clouds.AddComponent(new cloudController.CloudController());
        this.entityManager.Add(clouds);

        const player = new entity.Entity();
        player.AddComponent(new playerController.PlayerController());
        player.AddComponent(new voxelTools.VoxelToolsInsert());
        player.AddComponent(new voxelTools.VoxelToolsDelete());
        player.SetPosition(new THREE.Vector3(...GameDefs.playerPOS));
        player.SetQuaternion(new THREE.Quaternion(...GameDefs.playerROT));

        this.entityManager.Add(player, 'player');

        const ui = new entity.Entity();
        ui.AddComponent(new uiController.UIController());
        this.entityManager.Add(ui, 'ui');
    }

    RAF(){

    }

}

let APP = null;

window.addEventListener('DOMContentLoaded', () => {
    APP = new WebCraft();
});
