export const utils = (function() {
    return{
        DictIntersection: function(dictA, dictB) {
            const intersection = {};
            for(let current in dictB){
                if(current in dictA){
                    intersection[current] = dictA[current];
                }
            }
            return intersection;
        },

        DictDifference: function(dictA, dictB) {
            const difference = {...dictA};
            for(let current in dictB){
                delete difference[current];
            }
            return difference;
        }
    };
})();