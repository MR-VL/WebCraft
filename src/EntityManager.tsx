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





    }


