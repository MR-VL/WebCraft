import {Entity} from "./Entity.tsx";

    export class EntityManager{
        private ids: number;
        private entitiesMap: Record<string, Entity>;
        private entities: Entity[];

        constructor() {
            this.ids = 0;
            this.entitiesMap = {};
            this.entities = [];
        }

        private GenerateName(): string{
            this.ids += 1;
            return "__name__ " + this.ids;
        }

        public Get(name: string): Entity | undefined{
            return this.entitiesMap[name];
        }

        public Filter(callback: (e:Entity) => boolean): Entity[]{
            return this.entities.filter(callback);
        }

        public Add(entity: Entity, name?: string): void{
            if(!name){
                name = this.GenerateName();
            }

            this.entitiesMap[name] = entity;
            this.entities.push(entity);

            entity.SetParent(this);
            entity.SetName(name);
            entity.InitEntity();

        }

        public SetActive(entity, bool){
            const index = this.entities.indexOf(entity);
            if(!bool){
                if(index<0){
                    return;
                }
                this.entities.splice(index,1);
            }
            else{
                if (index >=0){
                    return;
                }
                this.entities.push(entity);
            }
        }

        public Update(timeElapsed){
            const dead = [];
            const alive = [];

            for (let i = 0; i< this.entities.length; i++){
                const entity = this.entities[i];
                entity.Update(timeElapsed)

                if(entity.dead){
                    dead.push(entity);
                }
                else{
                    alive.push(entity);
                }

                for(let i = 0; i<dead.length; i++){
                    const ent = dead[i];
                    delete this.entitiesMap[ent.name];

                    ent.Destroy();
                }

                this.entities = alive;
            }

            return{
                EntityManager:EntityManager
            }
        }


    }


