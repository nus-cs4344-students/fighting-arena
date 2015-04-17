function Player(sid, pid, xPos, yPos, username, lid) {
    // Public variables
    this.sid;   // Socket id. Used to uniquely identify players via 
                // the socket they are connected from
    this.pid;   // Player id. In this case, 1 or 2 
    this.fighter;// player's paddle object 
    this.lastUpdated; // timestamp of last paddle update

    // Constructor
    this.sid = sid;
    this.pid = pid;
    this.lastUpdated = new Date().getTime();
    this.fighter = new Fighter(xPos, yPos, 0);
    this.username = username;
    this.lastHit = 0;

    this.lid = lid;
    /*
     * priviledge method: getDelay
     *
     * Return the current delay associated with this player.
     * The delay has a random 20% fluctuation.
     */
}

// For node.js require
global.Player = Player;