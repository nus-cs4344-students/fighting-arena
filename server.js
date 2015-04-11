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

function Server() {
    // Private Variables
    var port;         // Game port 
    var count;        // Keeps track how many people are connected to server 
    var nextPID;      // PID to assign to next connected player (i.e. which player slot is open) 
    var gameInterval; // Interval variable used for gameLoop 
    var ball;         // the game ball 
    var sockets;      // Associative array for sockets, indexed via player ID
    var players;      // Associative array for players, indexed via socket ID
    var p1, p2;       // Player 1 and 2.
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
    }

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
    }

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
    }

    var newPlayer = function (conn) {
        count ++;

        // Send message to new player (the current client)
        unicast(conn, {type: "message", content:"You are Player " + nextPID});

        // Create player object and insert into players with key = conn.id
        players[conn.id] = new Player(conn.id, nextPID, 300);
        sockets[nextPID] = conn;

        // Updates the nextPID to issue (flip-flop between 1 and 2)
        nextPID = count
    }

    var gameLoop = function () {
        // Check if ball is moving

            for (p in players){
            // Update on player side

            var bx = p.fighter.x;
            var by = p.fighter.y;
            var date = new Date();
            var currentTime = date.getTime();
            var states = { 
                type: "update",
                timestamp: currentTime,
                px: bx,
                py: by,
                pid: p.pid,
                state: p.status
            };
            broadcast(states)
        }
    }

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
            var sock = sockjs.createServer();

            // Upon connection established from a client socket
            sock.on('connection', function (conn) {
                console.log("connected");
                // Sends to client
                broadcast({type:"message", content:"There is now " + count + " players"});
                newPlayer(conn);

                // When the client closes the connection to the server/closes the window
                conn.on('close', function () {
                    // Stop game if it's playing
                    reset();

                    // Decrease player counter
                    count--;

                    // Set nextPID to quitting player's PID
                    nextPID = players[conn.id].pid;

                    // Remove player who wants to quit/closed the window
                    delete players[conn.id];

                    // Sends to everyone connected to server except the client
                    broadcast({type:"message", action: "quit", pid: nextPID, content: " There is now " + count + " players."});
                    console.log("disconnected");
                });

                // When the client send something to the server.
                conn.on('data', function (data) {
                    var message = JSON.parse(data)
                    var p = players[conn.id]

                    if (p === undefined) {
                        // we received data from a connection with
                        // no corresponding player.  don't do anything.
                        return;
                    } 

                    switch (message.type) {
                        // one of the player moves the mouse.
                        case "move":
                            console.log(p.pid + "moved")
                            switch message.x:
                                case 1:
                                    p.fighter.moveOneStepRight();
                                    break;
                                case -1:
                                    p.fighter.moveOneStepLeft();
                                    break;
                                default:
                                    console.log("steady" + message.type);
                            switch message.y:
                                case 1::
                                    p.fighter.moveOneStepUp();
                                    break;
                                case -1:
                                    p.fighter.moveOneStepDown();
                                    break;
                                default:
                                    console.log("steady" + message.type);
                            break;
                        default:
                            console.log("Unhandled " + message.type);
                    }
                }); // conn.on("data"
            }); // socket.on("connection"

            // reinitialize 
            count = 0;
            nextPID = 1;
            gameInterval = undefined;
            players = new Object;
            sockets = new Object;
            
            // Standard code to starts the Pong server and listen
            // for connection
            var app = express();
            var httpServer = http.createServer(app);
            sock.installHandlers(httpServer, {prefix:'/fighter'});
            httpServer.listen(3333, 'localhost');
            app.use(express.static(__dirname));
            console.log("Server running on http://0.0.0.0:" + 3333 + "\n")
            console.log("Visit http://localhost:" + 3333 + "/fighter.html in your " + 
                        "browser to start the game")
            gameInterval = setInterval(function() {gameLoop();}, 1000/Setting.FRAME_RATE);

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
