import * as THREE from 'three';
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {entity} from "./Entity.js";
import {voxelShader} from "./voxelShader.js";
import {GameDefs} from "./Game-defs.js";

export const voxelTools = (() =>{
    class VoxelToolsInsert extends entity.Component{
        static className = "VoxelToolsInsert";


        get Name(){
            return VoxelToolsInsert.className;
        }

        constructor() {
            super();
            this.voxelType = 'stone';
            this.timer = 0;
            this.active = false;
        }

        InitComponent(){
            this.RegisterHandler('input.pressed', (message) => this.onInput(message));
            this.RegisterHandler('ui.blockChanged', (message) => this.OnBlockIcon(message));
            this.RegisterHandler('ui.toolChanged', (message) => this.OnToolChanged(message));
        }

        OnToolChanged(message){
            if (!GameDefs.showTools){
                return;
            }

            if(message.value !== 'build'){
                this.LoseFocus();
            }
            else{
                this.GainFocus();
            }
        }

        LoseFocus(){
            this.voxelMeshGroup.visible = false;
            this.placementMesh.visible = false;
            this.active = false;
        }


        GainFocus(){
            this.voxelMeshGroup.visible = true;
            this.placementMesh.visible = true;
            this.active = true;
        }

        OnBlockIcon(message){
            this.voxelType = message.value;
            this.UpdateVoxelMesh();
        }

        UpdateVoxelMesh(){
            const voxels = this.FindEntity('voxels').GetComponent('SparseVoxelCellManager');
            const colors = [];
            const uvSlices = [];

            for(let i = 0; i < 6; ++i){
                for(let j = 0; j < 4 * 3; ++j){
                    colors.push(1.0, 1.0, 1.0)
                    uvSlices.push(voxels.blockTypes[this.voxelType].textures[2]);
                }
            }
            this.voxelMesh.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            this.voxelMesh.geometry.setAttribute('uvSlice', new THREE.Float32BufferAttribute(uvSlices, 1));
        }

        InitEntity(){
            const scene = this.FindEntity('renderer').GetComponent('ThreeJSController').scene;
            const camera = this.FindEntity('renderer').GetComponent('ThreeJSController').uiCamera;
            const voxels = this.FindEntity('voxels').GetComponent('SparseVoxelCellManager');
            const geometry = new THREE.BoxBufferGeometry(1, 1, 1);

            const placement1 = new THREE.ShaderMaterial({
                uniforms: {
                    time: {value: 0.0},
                    edgeColor: {value: new THREE.Color(0x000000)}
                },
                vertexShader: voxelShader.PLACEMENT.vectorShader,
                fragmentShader: voxelShader.PLACEMENT.precisionShader,
                side: THREE.FrontSide,
                blending: THREE.NormalBlending,
                transparent: true,
                depthWrite: false
            });

            const placement2 = placement1.clone();
            placement2.side = THREE.BackSide;

            const mesh1 = new THREE.Mesh(geometry, placement1);
            const mesh2 = new THREE.Mesh(geometry, placement2);

            mesh1.renderOrder = 1;

            this.placementMesh = new THREE.Group();
            this.placementMesh.add(mesh1);
            this.placementMesh.add(mesh2);
            this.placementMesh.scale.setScalar(0.999);
            this.material1 = placement1;
            this.material2 = placement2;

            const voxelGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
            this.voxelMesh = new THREE.Mesh(voxelGeometry, voxels.materialOpaque.clone());
            this.voxelMesh.position.set(1.25, -1.25, -4);
            this.voxelMesh.rotateY(0.125 * 2 * Math.PI);
            this.voxelMesh.material.depthWrite = false;
            this.voxelMesh.material.depthTest = false;
            this.voxelMeshGroup = new THREE.Group();
            this.voxelMeshGroup.add(this.voxelMesh);
            this.voxelMeshGroup.position.set(0, 0, 2);
            this.voxelMeshRotationEnd = this.voxelMeshGroup.quaternion.clone();
            this.voxelMeshGroup.rotateX(-0.125 * 2 * Math.PI);
            this.voxelMeshRotationStart = this.voxelMeshGroup.quaternion.clone();
            this.voxelMeshGroup.quaternion.identity();

            camera.add(this.voxelMeshGroup);
            const rotateFrames = new THREE.QuaternionKeyframeTrack(
                '.quaternion',
                [0, 1],
                [...this.voxelMeshRotationStart.toArray(), this.voxelMeshRotationEnd.toArray()]
            );

            const rotateClip = new THREE.AnimationClip('rotation', -1, [rotateFrames]);
            this.mixer = new THREE.AnimationMixer(this.voxelMeshGroup);
            this.action = this.mixer.clipAction(rotateClip);

            scene.add(this.placementMesh);
            this.UpdateVoxelMesh();
            this.LoseFocus();
        }

        OnInput(message){
            if(!this.active){
                return;
            }

            if(message.value === 'enter'){
                this.PerformAction();
            }
        }

        PerformAction() {
            //todo code cleanup
            if(!this.active){
                return;
            }

            if(!this.placementMesh.visible){
                return;
            }

            const voxels = this.FindEntity('voxels').GetComponent('SparseVoxelCellManager');
            const possibleCoordinates = [this.placementMesh.position.x, this.placementMesh.position.y, this.placementMesh.position.z];

            if(!voxels.HasVoxelAt(...possibleCoordinates) ){
                voxels.InsertVoxelAt(possibleCoordinates, this.voxelType);

                this.action.setLoop(THREE.LoopOnce, 1);
                this.action.clampWhenFinished = true;
                this.action.timeScale = 3.0;
                this.action.reset();
                this.action.play();
            }
        }

        Update(timeInSeconds){
            if(!this.active){
                return;
            }

            this.mixer.update(timeInSeconds);
            this.timer += timeInSeconds;
            this.material1.uniforms.time.value = this.timer;
            this.material2.uniforms.time.value = this.timer;
            this.material1.needsUpdate = true;
            this.material2.needsUpdate = true;

            const voxels = this.FindEntity('voxels').GetComponent('SparseVoxelCellManager');
            this.voxelMesh.material.uniforms.diffuseMap.value = voxels.materialOpaque.uniforms.diffuseMap.value;
            this.placementMesh.visible = false;

            const player = this.FindEntity('player');
            const forward = new THREE.Vector3(0, 0, -1);
            forward.applyQuaternion(player.quaternion);
            const ray = new THREE.Ray(player.Position, forward);
            const intersections = voxels.FindIntersectionsWithRay(ray, 5). filter(i => i.voxel.visible);

            if(!intersections.length){
                return;
            }

            const possibleCoordinates = [...intersections[0].voxel.position];
            const coordinates = this.FindClosestSide(possibleCoordinates, ray);
            if(!coordinates){
                return;
            }

            if(!voxels.HasVoxelAt(...coordinates) ){
                this.placementMesh.position.set(...coordinates);
                this.placementMesh.visible = true;
            }
        }

        FindClosestSide(possibleCoordinates, ray) {
            const sides = [
                [...possibleCoordinates], [...possibleCoordinates], [...possibleCoordinates],
                [...possibleCoordinates], [...possibleCoordinates], [...possibleCoordinates],
            ];
            sides[0][0] -= 1;
            sides[1][0] += 1;
            sides[2][1] -= 1;
            sides[3][1] += 1;
            sides[4][2] -= 1;
            sides[5][2] += 1;

            const AsAABB = (v) => {
                const position = new THREE.Vector3(...v);
                const half = new THREE.Vector3(0.5, 0.5, 0.5);

                const mesh1 = new THREE.Vector3();
                mesh1.copy(position);
                mesh1.sub(half);

                const mesh2 = new THREE.Vector3();
                mesh2.copy(position);
                mesh2.copy(position);

                return new THREE.Box3(mesh1,mesh2);
            }

            const boxes = sides.map(v => AsAABB(v));
            const tempV = new THREE.Vector3();

            const intersections = [];
            for(let i=0; i<boxes.length; ++i){
                if(ray.intersectBox(boxes[i], tempV)){
                    intersections.push({
                        position: sides[i],
                        distance: tempV.distanceTo(ray.origin)
                    });
                }
            }

            intersections.sort((a,b) => {
                return a.distance - b.distance;
            });

            if(intersections.length > 0){
                return intersections[0].position;
            }
            return null;
        }
    }//end voxel tools insert

    class VoxelToolsDelete extends entity.Component{
        static className = 'VoxelToolsDelete';
        get Name(){
            return VoxelToolsDelete.className;
        }

        constructor() {
            super();
            this.timer = 0;
            this.active = true;
        }

        InitEntity(){
            this.LoadModel();
        }

        InitComponent(){
            this.RegisterHandler('input.pressed', (message) => this.OnInput(message));
            this.RegisterHandler('ui.toolChanged', (message) => this.OnToolChanged(message));
        }

        OnToolChanged(message){
            if(!GameDefs.showTools){
                return;
            }
            if(message.value != 'break'){
                this.LoseFocus();
            }
            else{
                this.GainFocus();
            }
        }

        LoseFocus(){
            this.balls.visible = false;
            this.placementMesh.visible = false;
            this.active = false;
        }

        GainFocus(){
            this.balls.visible = true;
            this.placementMesh.visible = true;
            this.active = true;
        }

        LoadModel(){
            const scene = this.FindEntity('renderer').GetComponent('ThreeJSController').scene;
            const camera = this.FindEntity('renderer').GetComponent('ThreeJSController').uiCamera;
            this.balls = new THREE.Group();
            camera.add(this.balls);

            const loader = new GLTFLoader();
            //todo add texture
            loader.load('./resources/pickaxe/scene.gltf', (gltf) => {
                gltf.scene.traverse(current => {
                    if(current.material){
                        current.material.depthWrite = false;
                        current.material.depthTest = false;
                    }
                });

                this.mesh = gltf.scene;
                this.mesh.position.set(2, 2, 1);
                this.mesh.scale.setScalar(0.1);
                this.mesh.rotateZ(0.25 * 2 * Math.PI);
                this.mesh.rotateY(-0.1 * 2 * Math.PI);

                this.group = new THREE.Group();
                this.group.add(this.mesh);
                this.group.position.set(0, -3, -4);
                const endRotation = this.group.quaternion.clone();
                this.group.rotateX(-0.25 * 2 * Math.PI);
                const startRotation = this.group.quaternion.clone();
                this.group.quaternion.identity();

                this.balls.add(this.group);
                const rotationFrames = new THREE.QuaternionKeyframeTrack(
                    '.quaternion',
                    [0, 1, 2],
                    [...endRotation.toArray(), ...startRotation.toArray(), ...endRotation.toArray()]
                );

                const rotationClip = new THREE.AnimationClip('rotation', -1, [rotationFrames]);
                this.mixer = new THREE.AnimationMixer(this.group);
                this.action = this.mixer.clipAction(rotationClip);
            });

            const geometry = new THREE.BoxBufferGeometry(1, 1, 1);
            const position1 = new THREE.ShaderMaterial({
                uniforms:{
                    time: {value:0.0},
                    edgeColor: {value: new THREE.Color(0xFF0000)}
                },
                vertexShader:voxelShader.PLACEMENT.vectorShader,
                fragmentShader:voxelShader.PLACEMENT.precisionShader,
                side: THREE.FrontSide,
                blending: THREE.NormalBlending,
                transparent: true,
                depthWrite: false,
            });

            const position2 = position1.clone();
            position2.side = THREE.BackSide;

            const mesh1 = new THREE.Mesh(geometry, position1);
            const mesh2 = new THREE.Mesh(geometry, position2);
            mesh1.renderOrder = 1;
            this.placementMesh = new THREE.Group();
            this.placementMesh.add(mesh1);
            this.placementMesh.add(mesh2);
            this.placementMesh.scale.setScalar(1.0001);
            this.material1 = position1;
            this.material2 = position2;
            scene.add(this.placementMesh);
            this.LoseFocus();
        }

        OnInput(message){
            if(!this.active){
                return;
            }

            if(message.value == 'enter'){
                this.PerformAction();
            }
        }

        PerformAction(){
            if(!this.active){
                return;
            }
            if(!this.placementMesh.visible){
                return;
            }

            const voxels = this.FindEntity('voxels').GetComponent('SparseVoxelCellManager');
            const possibleCoordinates = [
                this.placementMesh.position.x, this.placementMesh.position.y,this.placementMesh.position.z
            ];

            if(voxels.HasVoxelAt(...possibleCoordinates)){
                voxels.RemoveVoxelAt(possibleCoordinates);

                if(this.action){
                    this.action.setLoop(THREE.LoopOnce, 1);
                    this.action.clampWhenFinished = true;
                    this.action.timeScale = 10.0;
                    this.action.reset();
                    this.action.play();
                }
            }
        }

        Update(timeInSeconds){
            if(!this.active){
                return;
            }

            if(this.mixer){
                this.mixer.update(timeInSeconds)
            }

            this.timer += timeInSeconds;
            this.material1.uniforms.time.value = this.timer;
            this.material2.uniforms.time.value = this.timer;
            this.material1.needsUpdate = true;
            this.material2.needsUpdate = true;

            const voxels = this.FindEntity('voxels').GetComponent('SparseVoxelCellManager');

            const player = this.FindEntity('player');
            const forward = new THREE.Vector3(0, 0, -1);
            forward.applyQuaternion(player.quaternion);

            const ray = new THREE.Ray(player.Position, forward);
            const intersections = voxels.FindIntersectionsWithRay(ray, 4);
            if(!intersections.length){
                return;
            }

            const possibleCoordinates = [...intersections[0].voxel.position];
            if(voxels.HasVoxelAt(...possibleCoordinates)){
                this.placementMesh.position.set(...possibleCoordinates);
                this.placementMesh.visible = true;
            }
        }
    }//end voxel tools delete

    return{
      VoxelToolsInsert:VoxelToolsInsert,
      VoxelToolsDelete:VoxelToolsDelete
    };
})();