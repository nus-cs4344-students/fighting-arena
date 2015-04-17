/**
 * Created by zchen on 17/4/15.
 */
function Rune(type, xpos, ypos) {
    this.collected_at;
    this.type = type;
    this.x = xpos;
    this.y = ypos;
    this.duration = 10000;
    this.name = undefined;
}

Rune.WIDTH = 32;
Rune.HEIGHT = 32;
global.Rune = Rune;