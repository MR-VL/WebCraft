export const GameDefs= (()=>{
    const Intro={
        enabled: false,
        foliageEnabled: false,
        introEnabled: false,
        oceanEnabled: false,
        hardcodedFoliageEnabled: true,
        playerPOS: [-1826.1306923527645, 27.940844444445403, -220.6986696117536],
        playerROT: [-0.0380279893805328, 0.3364980691628503, 0.013601301436886065, 0.9408176901358577],
        cameraPOS: [-2150, -557],
        cameraDeceleration: [-10, 0, -10],
        introRate: 0.0005,
        worldSize: 24
    }

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


        playerPOS: [-1826.1306923527645, 27.940844444445403, -220.6986696117536],
        playerROT: [-0.0380279893805328, 0.3364980691628503, 0.013601301436886065, 0.9408176901358577],
        cameraPOS: [0, 0],
        cameraDeceleration: [-10, 0, -10],
        introRate: 0.0005,
        worldBlockSize: 16,
        worldSize: 24
    }
})();