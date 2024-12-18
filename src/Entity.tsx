import * as three from 'three'
import {EntityManager} from "./EntityManager.tsx";

export const entity = (() => {
    class Entity {
        private name: string | null = null;
        private components: {} = {};
        private position: three.Vector3 = new three.Vector3();
        private rotation: three.Quaternion = new three.Quaternion;
        private handlers: {} = {};
        private parent: EntityManager | null = null;
        dead: boolean = false;

        SetParent(parent: EntityManager): void {
            this.parent = parent;
        }

        SetName(name: string): void {
            this.name = name;
        }

        InitEntity(): void {
            for (let k in this.components) {
                this.components[k].InitEntity();
            }
        }

        SetDead() {
            this.dead = true;
        }

        Destroy() {
            for (let k in this.components) {
                this.components[k].Destroy();
            }

            this.components = {};
            this.parent = null;
            this.handlers = {};
        }

        Update(timeElapsed) {
            for (let k in this.components) {
                this.components[k].Update(timeElapsed);
            }
        }

        AddComponent(component) {
            component.SetParent(this);
            this.components[component.Name] = component;
            component.InitComponent();
        }

    }

     class Component {
        get Name() {
            console.error('Unnamed Component: ' + this.constructor.name);
            return 'ERROR'
        }

        Update(_) {
        }

        InitEntity() {
        }

        InitComponent() {
        }

        Destroy() {
        };


    }
    return {
        Entity: Entity,
        Component: Component

    };
})

