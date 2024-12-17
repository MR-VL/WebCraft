import * as three from 'three'
import {EntityManager} from "./EntityManager.tsx";
export class Entity{
    private name: string | null = null;
    private components: {[key:string]:Component} = {};
    private position: three.Vector3 = new three.Vector3();
    private rotation: three.Quaternion = new three.Quaternion;
    private handlers: {[key:string]:Array<(msg: any) => void>} = {};
    private parent: EntityManager | null = null;
    private dead: boolean = false;

    SetParent(parent: EntityManager):void{
        this.parent = parent;
    }

    SetName(name: string):void{
        this.name = name;
    }

    InitEntity(): void{
        for(let k in this.components){
            this.components[k].InitEntity();
        }
    }

}

export class Component{
    get Name(){
        console.error('Unnamed Component: ' + this.constructor.name);
        return 'ERROR'
    }


    InitEntity() {}
}

