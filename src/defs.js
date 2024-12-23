import * as THREE from 'three'

export const defs = (() =>{

    return{
        FogRange: [100, 300],
        UnderWaterRange: [0,50],
        FogColor: new THREE.Color(0xcdd8f1).convertSRGBToLinear(),
        MoonColor: new THREE.Color(0x).convertSRGBToLinear(),
        UnderWaterColor: new THREE.Color(0x).convertSRGBToLinear(),
        SkyColor: new THREE.Color(0x).convertSRGBToLinear(),
        PlayerPOS: [255.311252087425, 100, 290.98564212457086],
        PlayerROT:[0.02753162419089479, -0.7573631733845853, 0.031998988835540886, 0.6516280365237096]
    }
})();