export const entityManager = (() => {
    class EntityManager{
        //private class declarations
        constructor() {
            this.ids = 0;
            this.entitiesMap = {};
            this.entities={};
        }

        GenerateName(){
            //creates entity names with incrementing ID
            this.ids += 1;
            return '__name__' + this.ids;
        }

        Get(x){
            //return the value at a given position
            return this.entitiesMap[x];
        }

        Filter(block){
            return this.entities.filter(block);
        }

        //adds a new entity
        Add(entity, name){
            //if no name is provided generate a new name
            if(!name){
                name = this.GenerateName();
            }
            //map the name to the entity
            this.entitiesMap[name] = entity;
            //push the entity to the entities
            this.entities.push(entity);

            //set its parent and name
            entity.SetParent(this);
            entity.SetName(name);
            //initialize the entity
            entity.InitEntity();
        }


        SetActive(entity, bool){
            //determine if the entity already exists
            //if entity is found will return index
            //if it doesn't exist will return -1
            const index = this.entities.indexOf(entity);

            //mark inactive
            if(!bool) {
                //if entity is not in the entities just return nothing more needed to do
                if (index < 0) {
                    return;
                }
                //entity exists
                //remove the 1 entity at the index
                this.entities.splice(index, 1);
            }
            //mark active
            else{
                //if the entity is already in entities return
                if(index >= 0){
                    return;
                }
                //if not add it to the entities
                this.entities.push(entity);
            }
        }
    }

})