function Player(sid, pid, xPos, yPos, username, lid) {
    // Public variables
    this.sid;   // Socket id. Used to uniquely identify players via 
                // the socket they are connected from
    this.pid;   // Player id.
    this.fighter;// player's fighter
    this.lastUpdated; // timestamp of last paddle update
    this.runes = {};
    var that = this;

    // Constructor
    this.sid = sid;
    this.pid = pid;
    this.lastUpdated = new Date().getTime();
    this.fighter = new Fighter(xPos, yPos, 0);
    this.username = username;
    this.lastHit = 0;

    this.lid = lid;


    var performRune = function (rune) {
        if (rune.type === 'hp') {
            that.fighter.reset();
        } else if (rune.type === 'haste') {
            console.log("haste");
            that.fighter.haste();
            console.log(that.fighter.hasteCoef);
        }
    };

    this.addRune = function (rune) {
        console.log(rune.type);
        that.runes[rune.type] = rune;
        performRune(rune);
        if (rune.type === 'haste') {
            var timer = setInterval(function () {
                var d = new Date();
                for (r in that.runes) {
                    var ru = that.runes[r];
                    if ((d - ru.collected_at) >= ru.duration) {
                        that.fighter.resetVelocity();
                        clearInterval(timer);
                    }
                }
            }, 1000);
        }
    }
}

// For node.js require
global.Player = Player;