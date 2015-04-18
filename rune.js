/**
 * Created by zchen on 17/4/15.
 */
function Rune(type, xpos, ypos) {
    //public variables
    this.collected_at;      //time that the rune was collected
    this.type = type;       //rune type
    this.x = xpos;          //x-position
    this.y = ypos;          //y-position
    this.duration = 10000;  //rune duration
    this.name = undefined;  //rune name
}

//constans
Rune.WIDTH = 32;
Rune.HEIGHT = 32;

global.Rune = Rune;