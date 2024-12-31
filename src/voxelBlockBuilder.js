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

        Biome(x, z, elevation, moisture){
            const mp = math.smootherstep(moisture, 0, 1);
            const ep = math.smootherstep(elevation / 128.0, 0, 1);

            const m1e1 = ['sand', 0];
            const m1e2 = this.moon.Get(x,z);
            const m2e1 = ['grass', 0];
            const m2e2 = ['stone', 0];

            const r1 = math.lerp(mp, m1e1[1], m2e1[1]);
            const r2 = math.lerp(mp, m1e2[1], m2e2[1]);
            const r3 = math.lerp(ep, r1, r2);

            const f1 = mp < 0.5 ? m1e1[0] : m2e1[0];
            const f2 = mp < 0.5 ? m1e2[0] : m2e2[0];
            const f3 = ep < 0.5 ? f1 : f2;

            return [f3, Math.floor(r3)];
        }

        Get2(x, z){
            const height = this.NoiseHeight.Get(x, 0.0, z);
            const elevation = Math.floor(height);
            const moisture = this.NoiseMoisture.Get(x, 0.0, z);
            return this.Biome(x, z, elevation, moisture);
        }

        ChooseTerrainType(x,z){
            const cellSize = 1024.0;
            const cellIndex = [Math.floor(x/cellSize), Math.floor(z/cellSize)];
            const cellPosition = [cellIndex[0] * cellSize, cellIndex[1] * cellSize];
            const cellCenter = [Math.round(this.Noise.Get(cellIndex[0], 0.0, cellIndex[1]) * cellSize),
                                        Math.round(this.Noise.Get(cellIndex[0], 1.0, cellIndex[1]) * cellSize)];
            cellCenter[0] = cellPosition[0] + cellSize * 0.5;
            cellCenter[1] = cellPosition[1] + cellSize * 0.5;

            const distance = ((x-cellCenter[0]) ** 2 + (z-cellCenter[1]) ** 2) ** 0.5;
            const fallOff = math.sat((distance - cellSize * 0.25) / (cellSize * 0.25));
            const biomeType = Math.round(this.NoiseTypes.Get(cellIndex[0], 0.0, cellIndex[1]));

            let result = null;
            //TODO possible type mismatch
            if(biomeType === 0){
                result = this.rocky.Get(x,z);
            }
            else if (biomeType === 1){
                result = this.sand.Get(x,z);
            }
            else if (biomeType === 2){
                result = this.grass.Get(x,z);
            }
            else if (biomeType === 3){
                result = ['snow', 15];
            }
            else if (biomeType === 4){
                result = this.moon.Get(x,z)
            }
            else{
                result = this.grass.Get(x,z);
            }

            result[1] = math.lerp(math.smootherstep(fallOff, 0.0, 1.0), result[1], 0.0);
            const roll = this.NoiseRoll.Get(x, 2.0, z);

            const typeFallOff = math.sat((distance - cellSize * 0.375) / (cellSize * 0.125));

            if(typeFallOff > roll){
                result[0] = 'grass';
            }
            if(result[1] < oceanLevel){
                result[0] = 'sand';
            }
            return result;
        }

        Get(x,z){
            const result = this.ChooseTerrainType(x,z);
            result[1] = Math.round(result[1]);
            return result;
        }
    }

    class TerrainGeneratorRocky{
        constructor(params) {
            this.params = params;

            this.NoiseTerrain = new noise.Noise({
                seed: 9,
                octaves: 6,
                scale: 500.005,
                persistence: 0.5,
                lacunarity: 2.0,
                exponentiation: 6,
                height: 64,
                ridged: true
            })

            this.NoiseRoll = new noise.Noise({
                seed: 200,
                octaves: 2,
                scale: 8,
                persistence: 0.5,
                lacunarity: 2.0,
                exponentiation: 1,
                height: 1,
            })

            this.NoiseHeight = new noise.Noise({
                seed: 100,
                octaves: 1,
                scale: 64,
                persistence: 0.5,
                lacunarity: 2.0,
                exponentiation: 1,
                height: 1,
                range: [0.25, 1]
            })
        }

        Get(x, z){
            const height = this.NoiseTerrain.Get(x, 0.0, z) * this.NoiseHeight.Get(x, 0.0, z);
            const elevation = Math.floor(height);
            const roll = this.NoiseRoll.Get(x, 0.0, z);
            const heightFactor = (elevation / 32.0);

            let type = 'stone';
            if (roll > heightFactor){
                type = 'dirt';
            }

            return [type, elevation];
        }
    }

    class TerrainGeneratorSand{
        constructor(params){
            this.params = params;

            this.NoiseTerrain = new noise.Noise({
                seed: 4,
                octaves: 4,
                scale: 500.005,
                persistence: 0.5,
                lacunarity: 2.0,
                exponentiation: 6,
                height: 1,
                range: [-1, 1]
            })

            this.NoiseHeight = new noise.Noise({
                seed: 4,
                octaves: 3,
                scale: 500.005,
                persistence: 0.5,
                lacunarity: 2.0,
                exponentiation: 1,
                height: 64
            })
        }

        Get(x, z){
            const noise1 = [this.NoiseTerrain.Get(x, 0.0, z), this.NoiseTerrain.Get(x, 1.0, z)];
            const height = this.NoiseHeight.Get(x + noise1[0], 0.0, z + noise1[1]);
            const elevation = Math.floor(height);
            return ['sand', elevation];
        }
    }

    class TerrainGeneratorGrass{
        constructor(params){
            this.params = params;

            this.NoiseTerrain = new noise.Noise({
                seed: 4,
                octaves: 6,
                scale: 4096,
                persistence: 0.5,
                lacunarity: 2.0,
                exponentiation: 6,
                height: 1
            })

            this.NoiseHeight = new noise.Noise({
                seed: 4,
                octaves: 3,
                scale: 4096,
                persistence: 0.5,
                lacunarity: 0.5,
                exponentiation: 1,
                height: 512
            })

            this.NoisePlateaus  = new noise.Noise({
                seed: 5,
                octaves: 4,
                scale: 512,
                persistence: 0.5,
                lacunarity: 2.0,
                exponentiation: 2,
                height: 1
            })

            this.NoisePlateausNumber = new noise.Noise({
                seed: 6,
                octaves: 4,
                scale: 1024,
                persistence: 0.5,
                lacunarity: 2.0,
                exponentiation: 1,
                height: 20
            })

            this.NoiseMoisture = new noise.Noise({
                seed: 3,
                octaves: 3,
                scale: 512,
                persistence: 0.5,
                lacunarity: 2.0,
                exponentiation: 2,
                height: 1
            })
        }

        Get(x, y){
            const normalizedHeight = this.NoiseTerrain.Get(x, y, 0.0);
            const areaHeight = this.NoiseHeight.Get(x, y, 0);
            let variableHeight = areaHeight * normalizedHeight;

            if(this.NoisePlateaus.Get(x, y, 0.0) > 0.25){
                const numPlateaus = Math.round(10 + this.NoisePlateaus.Get(x, y, 0));
                const plateauHeight = Math.round(areaHeight / numPlateaus);
                variableHeight = Math.round(variableHeight / plateauHeight) * plateauHeight;
            }

            const elevation = Math.floor(variableHeight);
            const moisture = this.NoiseMoisture.Get(x, y, 0.0);

            return [biome(elevation, moisture), elevation];
        }
    }

    return{
        VoxelBlockBuilder: VoxelBuilderThreadedWorker,
    }

})();