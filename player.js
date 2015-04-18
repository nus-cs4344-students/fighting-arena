function Player(sid, pid, xPos, yPos, username, lid) {
    // Public variables
    this.sid;            // Socket id. Used to uniquely identify players via
                         // the socket they are connected from
    this.pid;            // Player id.
    this.fighter;        // player's fighter
    this.lastUpdated;    // timestamp of last paddle update
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


    /* Private method that applys runes effects on fighter */
    var performRune = function (rune) {
        if (rune.type === 'hp') {
            that.fighter.reset();
        } else if (rune.type === 'haste') {
            that.fighter.haste();
        }
    };

    /* Public method that add runes to fighter */
    this.addRune = function (rune) {
        that.runes[rune.type] = rune;
        performRune(rune);
        if (rune.type === 'haste') {
            // timer for haste rune expiration
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