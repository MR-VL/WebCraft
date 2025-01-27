export const entityManager = (() => {
    class EntityManager {
        //private class declarations
        constructor() {
            this.ids = 0;
            this.entitiesMap = {};
            this.entities = {};
        }

        GenerateName() {
            //creates entity names with incrementing ID
            this.ids += 1;
            return '__name__' + this.ids;
        }

        Get(name) {
            //return the value at a given position with name
            return this.entitiesMap[name];
        }

        Filter(block) {
            return this.entities.filter(block);
        }

        //adds a new entity
        Add(en, name) {
            //if no name is provided generate a new name
            if (!name) {
                name = this.GenerateName();
            }
            //map the name to the entity
            this.entitiesMap[name] = en;
            //push the entity to the entities
            this.entities.push(en);

            //set its parent and name
            en.SetParent(this);
            en.SetName(name);
            //initialize the entity
            en.InitEntity();
        }


        SetActive(entity, bool) {
            //determine if the entity already exists
            //if entity is found will return index
            //if it doesn't exist will return -1
            const index = this.entities.indexOf(entity);

            //mark inactive
            if (!bool) {
                //if entity is not in the entities just return nothing more needed to do
                if (index < 0) {
                    return;
                }
                //entity exists
                //remove the 1 entity at the index
                this.entities.splice(index, 1);
            }
            //mark active
            else {
                //if the entity is already in entities return
                if (index >= 0) {
                    return;
                }
                //if not add it to the entities
                this.entities.push(entity);
            }
        }
        Update(timeElapsed){
            //takes time since last update
            const dead = [];
            const alive = [];

            for(let i=0; i< this.entities.length; ++i){
                // get current entity from array
                const entity = this.entities[i];

                //loop through and determine if each entity is alive or dead
                entity.Update(timeElapsed);

                //determine if alive or dead and store appropriately
                if(entity.dead){
                    dead.push(entity);
                }
                else{
                    alive.push(entity);
                }
            }

            //loop through the dead array
            for(let i = 0; i<dead.length; ++i){
                //grab current index
                const entity = dead[i];
                //delete the name from the entities map
                delete this.entitiesMap[entity.name];
                //destroy the entity
                entity.destroy();
            }
            //only include the alive entities
            this.entities = alive;
        }
    }

    return{
        EntityManager:EntityManager
    };
})();