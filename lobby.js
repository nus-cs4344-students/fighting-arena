/**
 *
 * Created by zchen on 17/4/15.
 */


"use strict";

function Lobby(lid){
    // Public variables
    this.lid;
    this.lid = lid;
    this.sockets = {};
    this.count = 0;
    this.hasteRune;
    this.hpRune;
    this.players = {};
    var that = this;

    /* Public Method to add connection to
     * lobby
     */
    this.addConnection = function (conn) {
        that.sockets[conn.id] = conn;
    };

    /* Public method to calculate next player's
     * facing direction
     */
    this.nextPlayerDirection = function (){
        return that.count % 2 != 1 ? "left" : "right";
    };

}

global.Lobby = Lobby;
