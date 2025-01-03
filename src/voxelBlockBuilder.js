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

            for(let i =0; i < this.craters.length; ++i){
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

    const NoiseLuminance = new noise.Noise({
        seed: 10,
        octaves: 1,
        scale: 0.99,
        persistence: 0.5,
        lacunarity: 2.0,
        exponentiation: 4,
        height: 1
    })

    const noiseFadeIn = new noise.Noise({
        seed: 11,
        octaves: 4,
        scale: 2.01,
        persistence: 0.5,
        lacunarity: 2.0,
        exponentiation: 1,
        height: 1
    })

    const NoiseFoliage = new noise.Noise({
        seed: 7,
        octaves: 1,
        scale: 0.99,
        persistence: 0.5,
        lacunarity: 2.0,
        exponentiation: 1,
        height: 1
    })

    class SDFList{
        constructor(){
            this.sdfs = [];
        }

        Add(sdf){
            this.sdfs.push(sdf);
        }

        Intersects(aabb){
            for(let i = 0; i < this.sdfs.length; ++i){
                const index = this.sdfs[i];
                if(s.AABB.intersectsBox(aabb)){
                    return true;
                }
            }
            return false;
        }

        Evaluate(x, y, z){
            const position = new THREE.Vector3(x, y, z);

            for(let i = 0; i<this.sdfs.length; ++i){
                const index = this.sdfs[i];
                if (index.AABB.containsPoint(position)) {
                    const result = index.Evaluate(position);
                    if(result){
                        return result;
                    }
                }
            }
        }
    }

    class VoxelBuilderThreadedWorker {
        constructor() {
            this.Create();
        }

        Create() {
            const pxGeometry = new THREE.PlaneBufferGeometry(1, 1);
            pxGeometry.rotateY(Math.PI / 2);
            pxGeometry.translate(0.5, 0, 0);

            const nxGeometry = new THREE.PlaneBufferGeometry(1, 1);
            nxGeometry.rotateY(-Math.PI / 2);
            nxGeometry.translate(-0.5, 0, 0);

            const pyGeometry = new THREE.PlaneBufferGeometry(1, 1);
            pyGeometry.rotateX(-Math.PI / 2);
            pyGeometry.translate(0.5, 0, 0);

            const nyGeometry = new THREE.PlaneBufferGeometry(1, 1);
            nyGeometry.rotateX(Math.PI / 2);
            nyGeometry.translate(0, -0.5, 0);

            const pzGeometry = new THREE.PlaneBufferGeometry(1, 1);
            pzGeometry.translate(0, 0, 0.5);

            const nzGeometry = new THREE.PlaneBufferGeometry(1, 1);
            nzGeometry.rotateX(Math.PI);
            nzGeometry.translate(0, 0, -0.5)

            const invertUvs = [pxGeometry, nxGeometry, pzGeometry, nzGeometry];

            for (let geometry of invertUvs) {
                for (let i = 0; i < geometry.attributes.uv.array.length; i += 2) {
                    geometry.attributes.uv.array[i + 1] = 1.0 - geometry.attributes.uv.array[i + 1];
                }
            }

            this.geometries = [
                pxGeometry, nxGeometry,
                pyGeometry, nyGeometry,
                pzGeometry, nyGeometry
            ];
        }

        Init(params) {
            this.params = params;
            this.params.offset = new THREE.Vector3(...params.offset);
            this.params.dimensions = new THREE.Vector3(...params.dimensions);

            if (GameDefs.useFlatTerrain) {
                this.terrainGenerator = new TerrainGeneratorFlat(params);
                //test for nightfall TODO night
                //this.terrainGenerator = new TerrainGeneratorMoon(params);
            }
        }

        GenerateNoise(x, y) {
            return this.terrainGenerator.Get(x, y);
        }

        Key(x, y, z) {
            return x + '.' + y + '.' + z;
        }

        PruneHiddenVoxels(cells) {
            if (GameDefs.skipPruning) {
                return Object.assign({}, cells);
            }

            const prunedVoxels = {};

            for (let k in cells) {
                const currentCell = cells[k];

                const k1 = this.Key(
                    currentCell.position[0] + 1,
                    currentCell.position[1],
                    currentCell.position[2]
                );

                const k2 = this.Key(
                    currentCell.position[0] - 1,
                    currentCell.position[1],
                    currentCell.position[2]
                );

                const k3 = this.Key(
                    currentCell.position[0],
                    currentCell.position[1] + 1,
                    currentCell.position[2]
                );

                const k4 = this.Key(
                    currentCell.position[0],
                    currentCell.position[1] - 1,
                    currentCell.position[2]
                );

                const k5 = this.Key(
                    currentCell.position[0],
                    currentCell.position[1],
                    currentCell.position[2] + 1
                );

                const k6 = this.Key(
                    currentCell.position[0],
                    currentCell.position[1],
                    currentCell.position[2] - 1
                );

                const keys = [k1, k2, k3, k4, k5, k6];
                let visible = false;

                for (let i = 0; i < keys.length; ++i) {
                    const faceHidden = (keys[i] in cells);
                    //todo line below might be redundant
                    currentCell.facesHidden[i] = faceHidden;

                    if (!faceHidden) {
                        visible = true;
                    }

                    if (visible) {
                        prunedVoxels[k] = currentCell;
                    }
                }
            }
            return prunedVoxels;
        }

        CreateFoliageSDFS() {
            const sdfs = new SDFList();

            if (GameDefs.hardcodedFoliageEnabled) {
                const xPos = 10;
                const yPos = 0;
                const zPos = 10;

                //TODO add more foliage

                sdfs.Add(foliageDefs.TREE1(19568, 0, 1608));

            }

            if (GameDefs.foliageEnabled) {
                for (let x = -this.params.dimensions.x * 4; x < this.params.dimensions.x * 4; x += 16) {
                    for (let z = -this.params.dimensions.z * 4; z < this.params.dimensions.z * 4; z += 16) {
                        const xPos = x + this.params.offset.x;
                        const zPos = z + this.params.offset.z;

                        const roll = NoiseFoliage.Get(xPos, 0.0, zPos);
                        if (roll > 0.8) {
                            const [atlasType, yOffset] = this.GenerateNoise(xPos, zPos);
                            const yPos = yOffset;

                            if (yPos <= oceanLevel) {
                                continue;
                            }

                            // todo type correction
                            if (atlasType === 'grass') {
                                let treeType = foliageDefs.TREE1;
                                if (NoiseFoliage.Get(xPos, 1.0, zPos) < 0.15) {
                                    treeType = foliageDefs.TREE2;
                                }
                                sdfs.Add(treeType(xPos, yPos, zPos));
                            } else if (atlasType === 'sand') {
                                let treeType = foliageDefs.PALMTREE;
                                sdfs.Add(treeType(xPos, yPos, zPos));
                            }
                        }
                    }
                }
            }
            return sdfs;
        }

        CreateTerrain() {
            const cells = {};

            const xn = GameDefs.skipExteriorBlocks ? 0 : -1;
            const zn = GameDefs.skipExteriorBlocks ? 0 : -1;
            const xp = (GameDefs.skipExteriorBlocks ? this.params.dimensions.x : this.params.dimensions.x + 1);
            const zp = (GameDefs.skipExteriorBlocks ? this.params.dimensions.x : this.params.dimensions.x + 1);

            for (let x = xn; x < xp; x++) {
                for (let z = zn; z < zp; z++) {
                    const xPos = x + this.params.offset.x;
                    const zPos = z + this.params.offset.z;

                    const [atlasType, yOffset] = this.GenerateNoise(xPos, zPos);
                    const yPos = yOffset;

                    const k = this.Key(xPos, yPos, zPos);

                    //todo Visible might be issue with block display on game
                    cells[k] = {
                        position: [xPos, yPos, zPos],
                        type: atlasType,
                        visible: true,
                        facesHidden: [false, false, false, false, false],
                        ao: [null, null, null, null, null, null]
                    };

                    if (GameDefs.introEnabled) {
                        for (let yi = yPos - 1; yi > -20; yi--) {
                            const ky = this.Key(xPos, yi, zPos);

                            cells[ky] = {
                                position: [xPos, yi, zPos],
                                type: 'dirt',
                                visible: true,
                                facesHidden: [false, false, false, false, false],
                                ao: [null, null, null, null, null, null]
                            };
                        }
                    }

                    //cliff gen
                    let lowestAdjacent = yOffset;
                    for (let xi = -1; xi < 1; xi++) {
                        for (let zi = -1; zi <= 1; zi++) {
                            const [_, otherOffset] = this.GenerateNoise(xPos + xi, zPos + zi);
                            lowestAdjacent = Math.min(otherOffset, lowestAdjacent);
                        }
                    }

                    if (lowestAdjacent < yOffset) {
                        for (let yi = lowestAdjacent + 1; yi < yOffset; yi++) {
                            const ki = this.Key(xPos, yi, zPos);
                            cells[ki] = {
                                position: [xPos, yi, zPos],
                                type: atlasType,
                                visible: true,
                                facesHidden: [false, false, false, false, false],
                                ao: [null, null, null, null, null, null]
                            };

                            if (atlasType === 'grass' || atlasType === 'snow') {
                                cells[ki].type = 'dirt';
                            }
                        }
                    }
                }
            }
            return cells;
        }

        ApplySDFsToVoxels(sdfs, cells) {
            const param1 = this.params.offset.clone();
            const param2 = this.params.offset.clone().add(this.params.dimensions);
            const aabb = new THREE.Box3(param1, param2);

            if (sdfs.Intersects(aabb) || true) {
                for (let x = -1; x < this.params.dimensions.x + 1; x++) {
                    for (let z = -1; z < this.params.dimensions.z + 1; z++) {
                        const xPos = x + this.params.offset.x;
                        const zPos = z + this.params.offset.z;
                        const [_, yOffset] = this.GenerateNoise(xPos, zPos);

                        for (let y = 0; y < 100; y++) {
                            const yPos = yOffset + y;
                            const key = this.Key(xPos, yPos, zPos);
                            if (key in cells) {
                                continue;
                            }

                            const result = sdfs.Evaluate(xPos, yPos, zPos);
                            if (result) {
                                let roll = 0;
                                if (result === 'treeLeaves' && !GameDefs.skipFoliageNoise) {
                                    roll = NoiseFoliage.Get(xPos, yPos, zPos);
                                }
                                if (roll < 0.7) {
                                    cells[key] = {
                                        position: [xPos, yPos, zPos],
                                        type: result,
                                        visible: true,
                                        facesHidden: [false, false, false, false, false],
                                        ao: [null, null, null, null, null]
                                    };
                                }
                            }
                        }
                    }
                }
            }
        }

        CreateOcean(groundVoxels) {
            const cells = {};

            for (let x = -1; x < this.params.dimensions.x + 1; x++) {
                for (let z = -1; z < this.params.dimensions.z + 1; z++) {
                    const xPos = x + this.params.offset.x;
                    const zPos = z + this.params.offset.z;

                    const [_, yPos] = this.GenerateNoise(xPos, zPos);

                    if (yPos < oceanLevel) {
                        const keyOcean = this.Key(xPos, oceanLevel, zPos);
                        cells[keyOcean] = {
                            position: [xPos, oceanLevel, zPos],
                            type: 'ocean',
                            visible: true,
                            facesHidden: [false, false, false, false, false],
                            ao: [null, null, null, null, null]
                        };

                        if (GameDefs.introEnabled) {
                            for (let yi = 1; yi < 20; ++yi) {
                                const ky = this.Key(xPos, oceanLevel - yi, zPos);

                                if (!(ky in groundVoxels)) {
                                    cells[ky] = {
                                        position: [xPos, yi, zPos],
                                        type: 'ocean',
                                        visible: true,
                                        facesHidden: [false, false, false, false, false],
                                        ao: [null, null, null, null, null]
                                    };
                                }
                            }
                        }
                    }
                }
            }
            return cells;
        }

        BuildAO(cells) {
            if (GameDefs.skipAO) {
                return;
            }
            for (let k in cells) {
                const currentCell = cells[k];

                const occlusion = (x, y, z) => {
                    const key = this.Key(currentCell.position[0] + x, currentCell.position[1] + y, currentCell.position[2] + z);
                    if (key in cells) {
                        return 0.75;
                    }
                    return 1.0;
                }

                //+x
                if (!currentCell.facesHidden[0]) {
                    currentCell.ao[0] = [
                        occlusion(1, 0, 1) * occlusion(1, 1, 0) * occlusion(1, 1, 1),
                        occlusion(1, 0, -1) * occlusion(1, 1, 0) * occlusion(1, 1, -1),
                        occlusion(1, 0, 1) * occlusion(1, -1, 0) * occlusion(1, -1, 1),
                        occlusion(1, 0, -1) * occlusion(1, -1, 0) * occlusion(1, -1, -1)
                    ];
                }

                //-x
                if (!currentCell.facesHidden[1]) {
                    currentCell.ao[1] = [
                        occlusion(-1, 0, -1) * occlusion(-1, 1, 0) * occlusion(-1, 1, -1),
                        occlusion(-1, 0, 1) * occlusion(-1, 1, 0) * occlusion(-1, 1, 1),
                        occlusion(-1, 0, -1) * occlusion(-1, -1, 0) * occlusion(-1, -1, -1),
                        occlusion(-1, 0, 1) * occlusion(-1, -1, 0) * occlusion(-1, -1, 1)
                    ];
                }

                //+y
                if (!currentCell.facesHidden[2]) {
                    currentCell.ao[2] = [
                        occlusion(0, 1, -1) * occlusion(-1, 1, 0) * occlusion(-1, 1, -1),
                        occlusion(0, 1, -1) * occlusion(1, 1, 0) * occlusion(1, 1, -1),
                        occlusion(0, 1, 1) * occlusion(-1, 1, 0) * occlusion(-1, 1, 1),
                        occlusion(0, 1, 1) * occlusion(1, 1, 0) * occlusion(1, 1, 1)
                    ];
                }

                //-y
                if (!currentCell.facesHidden[3]) {
                    currentCell.ao[3] = [
                        occlusion(0, -1, 1) * occlusion(-1, -1, 0) * occlusion(-1, -1, 1),
                        occlusion(0, -1, 1) * occlusion(1, -1, 0) * occlusion(1, -1, 1),
                        occlusion(0, -1, -1) * occlusion(-1, -1, 0) * occlusion(-1, -1, -1),
                        occlusion(0, -1, -1) * occlusion(1, -1, 0) * occlusion(1, -1, -1)
                    ];
                }

                //+z
                if (!currentCell.facesHidden[4]) {
                    currentCell.ao[4] = [
                        occlusion(-1, 0, 1) * occlusion(0, 1, 1) * occlusion(-1, 1, 1),
                        occlusion(1, 0, 1) * occlusion(0, 1, 1) * occlusion(1, 1, 1),
                        occlusion(-1, 0, 1) * occlusion(0, -1, 1) * occlusion(-1, -1, 1),
                        occlusion(1, 0, 1) * occlusion(0, -1, 1) * occlusion(1, -1, 1)
                    ];
                }

                //-z
                if (!currentCell.facesHidden[5]) {
                    currentCell.ao[5] = [
                        occlusion(1, 0, -1) * occlusion(0, 1, -1) * occlusion(1, 1, -1),
                        occlusion(-1, 0, -1) * occlusion(0, 1, -1) * occlusion(-1, 1, -1),
                        occlusion(1, 0, -1) * occlusion(0, -1, -1) * occlusion(1, -1, -1),
                        occlusion(-1, 0, -1) * occlusion(0, -1, -1) * occlusion(-1, -1, -1)
                    ];
                }
            }
            return cells;
        }

        ApplyFadeIn(cells) {
            if (this.params.currentTime < 0.0 || this.params.currentTime > 1.0) {
                return;
            }

            const timeBiased = this.params.currentTime ** 2;
            const yLowerBound = timeBiased;
            const yUpperBound = timeBiased + 0.1;
            const yRange = yUpperBound - yLowerBound;

            const toRemove = [];
            for (let k in cells) {
                const currentCell = cells[k];
                const roll = noiseFadeIn.Get(...currentCell.position);

                const yNormalized = (currentCell.position[1] + 50.0) / 250.0;
                const yFactor = (yNormalized - yLowerBound) / yRange;
                if (roll < yFactor) {
                    toRemove.push(k);
                }
            }

            for (let i = 0; i < toRemove.length; ++i) {
                delete cells[toRemove[i]];
            }
        }

        RemoveExteriorVoxels(cells) {
            const toRemove = [];
            const xMin = this.params.offset.x;
            const zMin = this.params.offset.z;
            const xMax = xMin * 2;
            const zMax = zMin * 2;

            for (let k in cells) {
                const currentCell = cells[k];
                if (currentCell.position[0] < xMin || currentCell.position[0] >= xMax
                    || currentCell.position[2] < zMin || currentCell.position[2] >= zMax) {
                    toRemove.push(k);
                }
            }

            for (let i = 0; i < toRemove.length; ++i) {
                delete cells[toRemove[i]];
            }
        }

        MergeCustomVoxels(cells) {
            const customVoxels = this.params.customVoxels;
            const toRemove = [];
            for (let k in customVoxels) {
                const currentCell = customVoxels[k];
                if (currentCell.visible) {
                    currentCell.facesHidden = [false, false, false, false, false];
                    currentCell.ao = [null, null, null, null, null, null];
                } else {
                    toRemove.push(k);
                }
            }

            Object.assign(cells, customVoxels);
            for (let i = 0; i < toRemove.length; ++i) {
                delete cells[toRemove[i]];
            }
        }

        RemoveVoxelAndFill(position, voxels) {
            const keyVoxel = this.Key(...position);
            const custom = {};

            custom[keyVoxel] = {
                position: [...position],
                visible: false
            };

            const [_, groundLevel] = this.GenerateNoise(position[0], position[2]);

            if (position[1] <= groundLevel) {
                for (let xi = -1; xi <= 1; xi++) {
                    for (let yi = -1; yi <= 1; yi++) {
                        for (let zi = -1; zi <= 1; zi++) {
                            const xPos = position[0] + xi;
                            const yPos = position[1] + yi;
                            const zPos = position[2] + zi;

                            const [voxelType, groundLevelAdjacent] = this.GenerateNoise(xPos, yPos);
                            const key = this.Key(xPos, yPos, zPos);

                            if (!(key in voxels) && yPos < groundLevelAdjacent) {
                                let type = 'dirt';
                                //todo type casting
                                if (voxelType === 'sand') {
                                    type = 'sand';
                                }

                                if (yPos < groundLevelAdjacent - 2) {
                                    type = 'stone';
                                }

                                if (voxelType === 'moon') {
                                    type = 'moon';
                                }

                                custom[key] = {
                                    position: [xPos, yPos, zPos],
                                    type: type,
                                    visible: true
                                };
                            }
                        }
                    }
                }
            }
            return custom;
        }

        Rebuild() {
            const terrainVoxels = this.CreateTerrain();
            const sdfs = this.CreateFoliageSDFS();
            this.ApplySDFsToVoxels(sdfs, terrainVoxels);

            const oceanVoxels = !GameDefs.skipOceans ? this.CreateOcean(terrainVoxels) : {};

            this.ApplyFadeIn(oceanVoxels);
            this.ApplyFadeIn(terrainVoxels);

            const prunedGroundVoxels = this.PruneHiddenVoxels(terrainVoxels);
            const prunedOceanVoxels = this.PruneHiddenVoxels(oceanVoxels);

            this.BuildAO(prunedGroundVoxels);

            const prunedVoxels= Object.assign({}, prunedOceanVoxels, prunedGroundVoxels);

            this.RemoveExteriorVoxels(prunedVoxels);

            const data = this.BuildMeshDataFromVoxels(prunedVoxels);
            const voxels = Object.assign({}, terrainVoxels, oceanVoxels);

            this.RemoveExteriorVoxels(voxels);

            for(let k in voxels) {
                const current = voxels[k];
                voxels[k] = {
                    type: current.type,
                    position: current.position,
                    visible: current.visible
                };
            }

            data.voxels = voxels;
            return data;
        }


    }//voxelBuilderThreadedWorker

    return{
        VoxelBlockBuilder: VoxelBuilderThreadedWorker,
    }

})();