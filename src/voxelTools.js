import * as THREE from 'three';
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {entity} from "./Entity.js";
import {voxelShader} from "./voxelShader.js";
import {GameDefs} from "./Game-defs.js";

export const voxelTools = (() =>{
    class VoxelToolsInsert extends entity.Component{

    }

    class VoxelToolsDelete extends entity.Component{

    }

    return{
      VoxelToolsInsert:VoxelToolsInsert,
      VoxelToolsDelete:VoxelToolsDelete
    };
})();