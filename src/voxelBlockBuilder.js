import * as THREE from 'three';

import {noise} from "./noise.js";
import {math} from "./math.js";
import {foliageDefs} from "./foliage-defs.js";
import {GameDefs} from "./Game-defs.js";

export const voxelBlockBuilder = (() => {

    const voxelHeight = 128;
    const oceanLevel = Math.floor(voxelHeight * 0.05);
    const beachLevel = oceanLevel + 4;
    const snowLevel = Math.floor(voxelHeight * 0.7);
    const mountainLevel = Math.floor(voxelHeight * 0.3);

    const oceanColor = new THREE.Color(0x125687);
    const beachColor = new THREE.Color(0xcfcb9a);
    const snowColor = new THREE.Color(0xf2f2f2);
    const stoneColor = new THREE.Color(0x9d9d9d);
    const GrassColor = new THREE.Color(0x7cbd6b);

    function biome(elevation, moisture){
        if (elevation < oceanLevel){
            return 'sand';
        }
        if(elevation < beachLevel){
            return 'sand';
        }

        if (elevation > snowLevel){
            return 'snow';
        }

        if (elevation > mountainLevel && moisture < 0.2){
            return 'stone';
        }

        //default will probably have to change later
        return 'grass';
    }


    class TerrainGeneratorFlat{
        constructor(){}

        Get(x, z){
            // TODO possible type conversion error here
            if (x === 0 && z === 0){
                return ['grass', 4097];
            }
            return ['grass', 0];
        }
    }

    const NPerlin = new noise.Noise({
        seed: 6,
        octaves:1,
        scale: 128,
        persistence: 0.5,
        lacunarity: 2.0,
        exponentiation: 4,
        height: 32
    })




    return{
        VoxelBlockBuilder: VoxelBuilderThreadedWorker,
    }

})();