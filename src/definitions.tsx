export const definitions = (() => {

    const defaults = {
        enabled: false,
        foliageEnabled: false,
        introEnabled: false,
        oceanEnabled: false,
        hardcodedFoliageEnabled: true,
        playerPOS: [0,20,0],
        playerROT: [0,0,0],
        cameraPOS: [0,0],
        cameraDeceleration: [-5, 0, 5],
        introRate: 0.0005,
        worldSize: 20
    };

    return{
        enabled: false,
        foliageEnabled: true,
        hardcodedFoliageEnabled: false,
        introEnabled: false,
        skipOceans: false,
        skipClouds: false,
        skipFoliageNoise: false,
        skipPruning: false,
        skipExteriorBlocks: false,
        skipAO: false,
        skipVariableLuminance: false,
        skipGravity: false,
        useFlatTerrain: false,
        showTools: true,
        fixedTerrainOrigin: false,
        playerPOS: [0,20,0],
        playerROT: [0,0,0],
        cameraPOS: [0,0],
        cameraDeceleration: [-5, 0, 5],
        introRate: 0.0005,
        worldBlockSize: 12,
        worldSize: 20
    }



})();