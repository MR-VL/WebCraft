import * as THREE from 'three';

export const textureDefs = (() => {
    return {
        DEFS: {
            ocean: {
                colour: new THREE.Color(0xFFFFFF),
                texture: 'ocean.png',
            },
            dirt: {
                colour: new THREE.Color(0xFFFFFF),
                texture: 'dirt.png',
            },
            sand: {
                colour: new THREE.Color(0xFFFFFF),
                texture: 'sand.png',
            },
            stone: {
                colour: new THREE.Color(0xFFFFFF),
                texture: 'stone.png',
            },
            tree_bark: {
                colour: new THREE.Color(0xFFFFFF),
                texture: 'treeBark.png',
            },
            tree_leaves: {
                colour: new THREE.Color(0xFFFFFF),
                texture: 'treeLeaves.png',
            },
            moon: {
                colour: new THREE.Color(0xFFFFFF),
                texture: 'moon.png',
            },
            snow: {
                colour: new THREE.Color(0xFFFFFF),
                texture: [
                    'snow-side.png', 'snow-side.png',
                    'snow.png', 'snow.png',
                    'snow-side.png', 'snow-side.png'
                ],
            },
            grass: {
                colour: new THREE.Color(0xFFFFFF),
                texture: [
                    'grass-side.png', 'grass-side.png',
                    'grass.png', 'dirt.png',
                    'grass-side.png', 'grass-side.png'
                ],
            },
        },
    };
})();