/**
 *
 * Created by zchen on 17/4/15.
 */


// enforce strict/clean programming
"use strict";

function Lobby(lid){
    // Public variables
    this.lid;
    this.lid = lid;
    this.sockets = {};
    this.count = 0;
    var that = this;


    this.addConnection = function (conn) {
        that.sockets[conn.id] = conn;
    }

    this.nextPlayerDirection = function (){
        return that.count % 2 != 1 ? "left" : "right";
    }

}

global.Lobby = Lobby;
