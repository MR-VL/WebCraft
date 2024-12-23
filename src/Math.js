export const math = (function(){
    return{
        randomRange: function(a,b){
            //create random number and multiply it by the range of a through b
            // the add a to it so that it starts from a
            return Math.random() * (b-a) + a;
        },

        randomNormal: function(){
            //generate sum of 4 random numbers
            // nums can either be 1 or 0
            // min: 0 max: 4 or any number between
            const sum = Math.random()+ Math.random()+ Math.random()+ Math.random();
            // first take the average of the number
            // scale it
            // subtract 1 so final range is [-1 , 1)
            return (sum / 4.0) * 2.0 -1;
        },

        randomInt: function(a,b){
            // generate random number 0 or 1
            // find the range (b-a) and multiply the number earlier times it
            // add a so that it starts from a
            return Math.round(Math.random() * (b-a) + a);
        },

        lerp: function (x, a, b){
            //b-a calculates range
            // x* multiplies it by desired amount
            // +a adds the original starting point so it coincides with original range
            return x* (b-a) + a;
        }


    };
})();