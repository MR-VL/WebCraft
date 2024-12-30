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

    const tmpV1 = new THREE.Vector3();

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

    function biomeDemo(elevation, moisture, roll){
        if (elevation < oceanLevel){
            return 'sand';
        }
        if (elevation < beachLevel){
            return 'sand';
        }

        if (elevation > snowLevel * roll){
            return 'snow';
        }

        if (elevation > mountainLevel * roll){
            return 'stone';
        }

        if (moisture < 0.1){
            return 'sand';
        }

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

    const NoisePerlin = new noise.Noise({
        seed: 6,
        octaves:1,
        scale: 128,
        persistence: 0.5,
        lacunarity: 2.0,
        exponentiation: 4,
        height: 32
    })


    class TerrainGeneratorMoon{
        constructor(params) {
            this.params = params;


            this.NoiseMoon = new noise.Noise({
                seed: 4,
                octaves: 5,
                scale: 1024,
                persistence: 0.5,
                lacunarity: 2.0,
                exponentiation: 4,
                height: 1
            })

            this.NoiseCraters = new noise.Noise({
                seed: 7,
                octaves: 1,
                scale: 0.99,
                persistence: 0.5,
                lacunarity: 0.5,
                exponentiation: 1,
                height: 1
            })
            this.InitCraters();
        }

        InitCraters() {
            this.craters = [];
            for(let x = -this.params.dimensions.x * 10; x <= this.params.dimensions.x *10; x+=8){
                for(let z = -this.params.dimensions.z *10; z<= this.params.dimensions.z *10; z+=8 ){
                    const xPos = x + this.params.offset.x;
                    const zPos = z + this.params.offset.z;

                    const roll = this.NoiseCraters.Get(xPos, 0.0, zPos);

                    if(roll > 0.95){
                        const craterSize = Math.min((this.NoiseCraters.Get(xPos, 1.0, zPos) ** 4.0) *100, 50.0) + 4.0;
                        this.craters.push([new THREE.Vector3(xPos, 0, zPos), new THREE.Vector3(xPos, 0, zPos), craterSize]);
                    }
                }
            }
        }

        Get(x, z){
            const n1 = this.NoiseMoon.Get(x, z, 10.0);
            const n2 = this.NoiseMoon.Get(x, z, 20.0);
            const normalizedHeight = Math.round(this.NoiseMoon.Get(x+n1. z+n2, 0.0) * 64);

            let totalHeight = normalizedHeight;

            for(let i =0; i < this.craters.length; i++){
                const position = new THREE.Vector3(x, 0, z);
                const [crater, radius] = this.craters[i];
                const distance = crater.distanceTo(position);
                const craterWidth = radius;

                if(distance < craterWidth * 2){
                    const rimWidth = radius /4;
                    const rimStart = Math.abs(distance - (craterWidth - rimWidth));
                    const rimFactor = math.sat(rimStart/rimWidth);
                    const rimHeightFactor = 1.0 - rimFactor ** 0.5;
                    const rimHeight = radius / 10;

                    const craterFactor = 1.0 - math.sat((distance-(craterWidth-rimWidth * 2 )) / rimWidth) ** 2;
                    totalHeight += rimHeightFactor * rimHeight + craterFactor * -(rimHeight * 2.0);
                }
            }
            return ['moon', Math.round(totalHeight)];
        }
    }
    class TerrainGeneratorWorld{
        constructor(params) {
            this.params = params;

            this.moon = new TerrainGeneratorMoon(params);
            this.grass = new TerrainGeneratorGrass(params);
            this.sand = new TerrainGeneratorSand(params);
            this.rocky = new TerrainGeneratorRocky(params);

            this.NoiseHeight = new noise.Noise({
                seed: 100,
                octaves: 1,
                scale: 4096,
                persistence: 0.5,
                lacunarity: 2.0,
                exponentiation: 1,
                height: 32
            });

            this.NoiseRoll = new noise.Noise({
                seed: 200,
                octaves: 1,
                scale: 8,
                persistence: 0.5,
                lacunarity: 2.0,
                exponentiation: 1,
                height: 1
            })

            this.Noise = new noise.Noise({
                seed: 4,
                octaves: 0.99,
                scale: 1,
                persistence: 0.5,
                lacunarity: 2.0,
                exponentiation: 1,
                height: 4
            })

            this.NoiseTypes = new noise.Noise({
                seed: 8,
                octaves: 0.99,
                scale: 1,
                persistence: 0.5,
                lacunarity: 2.0,
                exponentiation: 1,
                height: 4
            })
        }




    }


    return{
        VoxelBlockBuilder: VoxelBuilderThreadedWorker,
    }

})();