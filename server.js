/*
 * PongServer.js
 * A skeleton server for two-player Pong game.
 * Assignment 2 for CS4344, AY2013/14.
 * Modified from Davin Choo's AY2012/13 version.
 *
 * Changes from AY2012/13:
 *  - migrate from socket.io to sockjs
 *
 * Usage: 
 *   node PongServer.js
 */

// enforce strict/clean programming
"use strict"; 

var LIB_PATH = "./";
require(LIB_PATH + 'setting.js');
require(LIB_PATH + 'player.js');
require(LIB_PATH + 'fighter.js');

function Server() {
    // Private Variables
    var port;         // Game port 
    var count;        // Keeps track how many people are connected to server 
    var nextPID;      // PID to assign to next connected player (i.e. which player slot is open) 
    var gameInterval; // Interval variable used for gameLoop 
    var ball;         // the game ball 
    var sockets;      // Associative array for sockets, indexed via player ID
    var players;      // Associative array for players, indexed via socket ID
    var positions = [[Setting.WIDTH/4, Setting.HEIGHT/4], [Setting.WIDTH/4, Setting.HEIGHT*3/4],
        [Setting.WIDTH*3/4, Setting.HEIGHT*3/4],[Setting.WIDTH*3/4, Setting.HEIGHT/4]];
    /*
     * private method: broadcast(msg)
     *
     * broadcast takes in a JSON structure and send it to
     * all players.
     *
     * e.g., broadcast({type: "abc", x: 30});
     */
    var broadcast = function (msg) {
        var id;
        for (id in sockets) {
            sockets[id].write(JSON.stringify(msg));
        }
    };

    /*
     * private method: unicast(socket, msg)
     *
     * unicast takes in a socket and a JSON structure 
     * and send the message through the given socket.
     *
     * e.g., unicast(socket, {type: "abc", x: 30});
     */
    var unicast = function (socket, msg) {
        socket.write(JSON.stringify(msg));
    };

    /*
     * private method: reset()
     *
     * Reset the game to its initial state.  Clean up
     * any remaining timers.  Usually called when the
     * connection of a player is closed.
     */
    var reset = function () {
        // Clears gameInterval and set it to undefined
        if (gameInterval !== undefined) {
            clearInterval(gameInterval);
            gameInterval = undefined;
        }
    };

    var newPlayer = function (conn) {

        // Send message to new player (the current client)
        // Create player object and insert into players with key = conn.id
        var xx = positions[count][0];
        var yy = positions[count][1];
        var direction = count<2 ? "left" :  "right";

        players[conn.id] = new Player(conn.id, nextPID, xx, yy);
        sockets[conn.id] = conn;

        unicast(conn,{type:"assign",pid:nextPID});
        broadcast({
            type: "newPlayer",
            count: count,
            pid:nextPID,
            x: xx,
            y: yy,
            direction: direction,
        });
        //count actually has same function as nextPID;
        count++;
        nextPID++;
        console.log("Now we have " +count+" players");

        // Updates the nextPID to issue (flip-flop between 1 and 2)
    };

    var gameLoop = function () {
        // Check if ball is moving
            var id;
            for (id in players){
                var p = players[id];
                // Update on player side
                var xx = p.fighter.x;
                var yy = p.fighter.y;
                var vx = p.fighter.vx;
                var vy = p.fighter.vy;
                console.log(p.fighter.isHitting+p.fighter.facingDirection);
                var date = new Date();
                var currentTime = date.getTime();
                var states = {
                    type: "update",
                    timestamp: currentTime,
                    x:xx,
                    y:yy,
                    vx: vx,
                    vy: vy,
                    pid: p.pid,
                    hp: p.hp,
                    status: p.status,
                    isHitting: p.fighter.isHitting,
                    facingDirection: p.fighter.facingDirection
                };
                broadcast(states);
            }
    };

    /*
     * priviledge method: start()
     *
     * Called when the server starts running.  Open the
     * socket and listen for connections.  Also initialize
     * callbacks for socket.
     */
    this.start = function () {
        try {
            var express = require('express');
            var http = require('http');
            var sockjs = require('sockjs');
            var sockjs_opts = {sockjs_url: "http://cdn.jsdelivr.net/sockjs/0.3.4/sockjs.min.js"};
            var sock = sockjs.createServer(sockjs_opts);

            // Upon connection established from a client socket
            sock.on('connection', function (conn) {
                console.log("connected");
                if(count>3){
                    unicast(conn,{type:"full",message:"There are already 4 players playing"});
                    return;
                }
                //create new player and brodcast it 
                newPlayer(conn);

                if (gameInterval == undefined){
                    gameInterval = setInterval(function() {gameLoop();}, 1000/Setting.FRAME_RATE);
                }

                // When the client closes the connection to the server/closes the window
                conn.on('close', function () {
                    if(count===0)
                        reset();

                    // Decrease player counter
                    count--;

                    // Set nextPID to quitting player's PID
                    nextPID = players[conn.id].pid;

                    // Remove player who wants to quit/closed the window
                    delete players[conn.id];

                    broadcast({type:"disconnected", pid:nextPID});

                    console.log("disconnected");
                });

                // When the client send something to the server.
                conn.on('data', function (data) {
                    var message = JSON.parse(data);
                    var p = players[conn.id];

                    if (p === undefined) {
                        // we received data from a connection with
                        // no corresponding player.  don't do anything.
                        return;
                    }

                    switch (message.type) {
                        // one of the player moves the mouse.
                        case "move":
                            p.fighter.vx = message.vx;
                            p.fighter.vy = message.vy;
                            break;
                        case "attack":
                            console.log("receive an attack message");

                            p.fighter.isHitting = message.isHitting;
                            p.fighter.facingDirection = message.facingDirection; //'left' and 'right'

                            // determine whether have collision with other players
                            var id;

                            for(id in players){
                                var opponent = players[id];
                                if(id != conn.id){
                                    if(p.fighter.facingDirection == 'right'){
                                        console.log(p.body.x + ' ' + opponent.body.x);
                                        console.log(p.body.y + ' ' + opponent.body.y);

                                        if(p.body.x <= opponent.body.x - 0.25 * Fighter.width
                                            && p.body.x >= opponent.body.x - 1.8 * Fighter.width
                                            && p.body.y <= opponent.body.y + 1/3 * Fighter.height
                                            && p.body.y >= opponent.body.y - 1/3 * Fighter.height){
                                            console.log("Player" + id + " got hitted from left");
                                            opponent.getHitted(10);

                                            if(opponent.fighter.facingDirection == 'right'){
                                                opponent.fighter.facingDirection = 'left';
                                            }
                                        }
                                    }
                                    
                                    else if(p.fighter.facingDirection == 'left'){
                                        console.log(p.body.x + ' ' + opponent.body.x);
                                        console.log(p.body.y + ' ' + opponent.body.y);
                                        if(p.body.x >= opponent.body.x + 0.25 * Fighter.width
                                            && p.body.x <= opponent.body.x + 1.8 * Fighter.width
                                            && p.body.y <= opponent.body.y + 1/3 * Fighter.height
                                            && p.body.y >= opponent.body.y - 1/3 * Fighter.height){
                                            //player.fighter.getHitted(HITPOINT_NORMAL);
                                            console.log("Player" + id + " got hitted from right");
                                            opponent.getHitted(10);

                                            if(opponent.fighter.facingDirection == 'left'){
                                                opponent.fighter.facingDirection = 'right';
                                            }
                                        }
                                    }
                                }
                            }
                            break;
                        default:
                            console.log("Unhandled " + message.type);
                    }
                }); // conn.on("data"
            }); // socket.on("connection"

            // reinitialize 
            count = 0;
            nextPID = 0;
            gameInterval = undefined;
            players = new Object;
            sockets = new Object;
            
            // Standard code to starts the Pong server and listen
            // for connection
            var app = express();
            var httpServer = http.createServer(app);
            sock.installHandlers(httpServer, {prefix:'/fighter'});
            httpServer.listen(3333, '0.0.0.0');
            app.use(express.static(__dirname));
            console.log("Server running on http://0.0.0.0:" + 3333 + "\n");
            console.log("Visit http://localhost:" + 3333 + "/fighter.html in your " + 
                        "browser to start the game");

        } catch (e) {
            console.log("Cannot listen to " + 3333);
            console.log("Error: " + e);
        }
    }
}

// This will auto run after this script is loaded
var gameServer = new Server();
gameServer.start();

// vim:ts=4:sw=4:expandtab
