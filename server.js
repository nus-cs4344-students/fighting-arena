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
require(LIB_PATH + 'lobby.js');
require(LIB_PATH + 'helper.js');

function Server() {
    // Private Variables
    var port;         // Game port 
    var count;        // Keeps track how many people are connected to server 
    var nextPID;      // PID to assign to next connected player (i.e. which player slot is open) 
    var gameInterval; // Interval variable used for gameLoop 
    var ball;         // the game ball 
    var sockets;      // Associative array for sockets, indexed via player ID
    var lobbies;
    var players;      // Associative array for players, indexed via socket ID
    var pidMap = {};
    var helper = new Helper();

    /*
     * private method: broadcast(msg, rid)
     *
     * broadcast takes in a JSON structure and room id and then send JSON to
     * all players in the room.
     *
     * e.g., broadcast({type: "abc", x: 30}, 1);
     */
    var broadcast = function (msg, lid) {
        var _sockets = lobbies[lid].sockets;
        for (var sid in _sockets) {
            _sockets[sid].write(JSON.stringify(msg));
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

    var newPlayer = function (conn, lid, username) {
        // Send message to new player (the current client)
        // Create player object and insert into players with key = conn.id
        var randomX = (Math.random() * (Setting.WIDTH - Fighter.WIDTH)) + 1;
        var randomY = (Math.random() * (Setting.HEIGHT - Fighter.HEIGHT)) + 1;

        players[conn.id] = new Player(conn.id, nextPID, randomX, randomY, username, lid);
        lobbies[lid] = lobbies[lid] || new Lobby(lid);
        lobbies[lid].addConnection(conn);
        var direction = lobbies[lid].nextPlayerDirection;
        //sockets[conn.id] = conn;
        pidMap[nextPID] = true;

        unicast(conn, {type: "assign", pid: nextPID});
        broadcast({
            type: "newPlayer",
            count: lobbies[lid].count,
            pid: nextPID,
            x: randomX,
            y: randomY,
            direction: direction,
            lid: lid
        }, lid);
        //count actually has same function as nextPID;
        lobbies[lid].count++
        count++;

        console.log("Now we have " + lobbies[lid].count + " players in lobby" + lid);
        for (var i = 0; i < 20; i++) {
            if (!(i in pidMap)) {
                nextPID = i;
            }
        }

        if (gameInterval == undefined) {
            console.log("game started");
            gameInterval = setInterval(function () {
                gameLoop();
            }, 1000 / Setting.FRAME_RATE);
        }

        // Updates the nextPID to issue (flip-flop between 1 and 2)
    };

    var gameLoop = function () {
        // Check if ball is moving
        var id;
        for (id in players) {
            var p = players[id];
            // Update on player side
            var xx = p.fighter.x;
            var yy = p.fighter.y;
            var vx = p.fighter.vx;
            var vy = p.fighter.vy;
            //console.log(p.fighter.isHitting+p.fighter.facingDirection);
            var date = new Date();
            var currentTime = date.getTime();
            var states = {
                type: "update",
                timestamp: currentTime,
                x: xx,
                y: yy,
                vx: vx,
                vy: vy,
                pid: p.pid,
                hp: p.fighter.hp,
                status: p.fighter.status,
                injuryStatus: p.fighter.isInjured,
                isHitting: p.fighter.isHitting,
                facingDirection: p.fighter.facingDirection,
                username: p.username
            };
            broadcast(states, p.lid);
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
                var nums = [];
                for (var k in lobbies) {
                    nums.push(lobbies[k].count);
                }
                unicast(conn, {
                        type: "lobbyInfo",
                        lobbies: Object.keys(lobbies),
                        num_players: nums
                    }
                );
                //create new player and brodcast it


                // When the client closes the connection to the server/closes the window
                conn.on('close', function () {
                    try {
                        if (count === 0)
                            reset();

                        // Decrease player counter
                        count--;

                        // Set nextPID to quitting player's PID
                        nextPID = players[conn.id].pid;

                        // Remove player who wants to quit/closed the window
                        var lid = players[conn.id].lid;
                        lobbies[lid].count--;
                        delete players[conn.id];
                        delete pidMap[nextPID];
                        if (lobbies[lid].count === 0) {
                            delete lobbies[lid];
                        } else {
                            broadcast({type: "disconnected", pid: nextPID}, lid);
                            console.log("disconnected");
                        }
                    } catch (e) {
                        console.log(e);
                    }
                });

                // When the client send something to the server.
                conn.on('data', function (data) {
                    var message = JSON.parse(data);
                    var p = players[conn.id];

                    //if (p === undefined) {
                    //    // we received data from a connection with
                    //    // no corresponding player.  don't do anything.
                    //    return;
                    //}

                    switch (message.type) {
                        case 'createLobby':
                            // create lobby and create the player
                            console.log("craete_lobby");
                            var ids = Object.keys(lobbies);
                            var lid = helper.randomLobbyId(ids);
                            console.log("fafafa" + lid);
                            newPlayer(conn, lid, message.username);
                            break;
                        //one of the player moves the mouse.
                        case "newPlayer":
                            var username = message.username;
                            players[conn.id].username = username;
                            break;
                        case "join":
                            var username = message.username;
                            var lid = message.lid;
                            newPlayer(conn, lid, username);
                            break;
                        case "move":
                            p.fighter.vx = message.vx;
                            p.fighter.vy = message.vy;
                            p.fighter.x = message.x;
                            p.fighter.y = message.y;
                            break;
                        case "attack":
                            //console.log("receive an attack message");
                            p.fighter.isInjured = message.isInjured;
                            p.fighter.isHitting = message.isHitting;
                            p.fighter.facingDirection = message.facingDirection; //'left' and 'right'
                            // determine whether have collision with other players
                            var id;
                            if (p.fighter.isHitting) {
                                for (id in players) {
                                    var opponent = players[id];
                                    if (id != conn.id && !p.fighter.isInjured && !opponent.fighter.isInjured) {
                                        if (p.fighter.facingDirection == 'right') {
                                            var tOFRight = opponent.fighter.x + 0.5 * Fighter.WIDTH;
                                            //console.log(tOFRight);
                                            var tOFLeft = opponent.fighter.x - 1.25 * Fighter.WIDTH;
                                            //console.log(tOFLeft);
                                            var tOFTop = (opponent.fighter.y + 0.5 * Fighter.HEIGHT);
                                            //console.log(tOFTop);
                                            var tOFBtm = (opponent.fighter.y - 0.5 * Fighter.HEIGHT);
                                            //console.log(tOFBtm);
                                            if (p.fighter.x <= tOFRight && p.fighter.x >= tOFLeft && p.fighter.y <= tOFTop && p.fighter.y >= tOFBtm) {
                                                opponent.fighter.getHitted(10);
                                                //console.log("Player" + id + " got hitted from left with hp left: " + opponent.fighter.hp);
                                                opponent.fighter.facingDirection = 'left';
                                            }
                                        }
                                        else if (p.fighter.facingDirection == 'left') {
                                            if (p.fighter.x >= opponent.fighter.x - 0.5 * Fighter.WIDTH
                                                && p.fighter.x <= (opponent.fighter.x + 1.25 * Fighter.WIDTH)
                                                && p.fighter.y <= (opponent.fighter.y + 0.5 * Fighter.HEIGHT)
                                                && p.fighter.y >= (opponent.fighter.y - 0.5 * Fighter.HEIGHT)) {
                                                opponent.fighter.getHitted(10);
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
            lobbies = {};
            players = {};
            sockets = {};

            // Standard code to starts the Pong server and listen
            // for connection
            var app = express();
            var httpServer = http.createServer(app);
            sock.installHandlers(httpServer, {prefix: '/fighter'});
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
