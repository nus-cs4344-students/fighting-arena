"use strict";

var LIB_PATH = "./";
require(LIB_PATH + 'setting.js');
require(LIB_PATH + 'rune.js');
require(LIB_PATH + 'player.js');
require(LIB_PATH + 'fighter.js');
require(LIB_PATH + 'lobby.js');
require(LIB_PATH + 'helper.js');

function Server() {
    // Private Variables
    var count;              // Keeps track how many people are connected to server
    var nextPID;            // PID to assign to next connected player (i.e. which player slot is open)
    var gameInterval;       // Interval variable used for gameLoop
    var hpRuneInterval;     // Interval variable used for rune generation
    var hasteRuneInterval;  // Interval variable used for rune generation
    var sockets;            // Associative array for sockets, indexed via player ID
    var lobbies;            // Obejct to store lobbies
    var runes = {};         // runes
    var players;            // Associative array for players, indexed via socket ID
    var pidMap = {};        // Pid store
    var helper = new Helper(); // helper object

    /*
     * private method: broadcast(msg, lid)
     *
     * broadcast takes in a JSON structure and lobby id and then send JSON to
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

    /* private method that
     * Send message to new player (the current client),
     * and creates player object and insert into players
     * with key = conn.id
     */
    var newPlayer = function (conn, lid, username) {


        var randomX = (Math.random() * (Setting.FULL_WIDTH - Fighter.WIDTH)) + 1;
        var randomY = (Math.random() * (Setting.HEIGHT - Fighter.HEIGHT + Setting.BLOCK_Y)) + Setting.BLOCK_Y + 1;
        var rune = new Rune('haste');
        rune.collected_at = new Date();

        players[conn.id] = new Player(conn.id, nextPID, randomX, randomY, username, lid);
        lobbies[lid] = lobbies[lid] || new Lobby(lid);
        lobbies[lid].players[conn.id] = players[conn.id];
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
        lobbies[lid].count++;
        count++;

        Setting.log(Setting.LOG_INFO, "Now we have " + lobbies[lid].count + " players in lobby" + lid);

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

            // random create hasterune
            hasteRuneInterval = setInterval(function () {
                var randomX = (Math.random() * (Setting.WIDTH - Fighter.WIDTH)) + 1;
                var randomY = (Math.random() * (Setting.HEIGHT - 350)) + 300;
                var runeName = helper.randomLobbyId([]);
                var rune = new Rune('haste', randomX, randomY);
                rune.name = runeName;
                for (var lid in lobbies) {
                    lobbies[lid].hasteRune = rune;
                    broadcast({
                        type: 'createRune',
                        x: randomX,
                        y: randomY,
                        rtype: 'haste',
                        rname: runeName
                    }, lid);
                }
            }, 15000);

            // random create hprune
            hpRuneInterval = setInterval(function () {
                var randomX = (Math.random() * (Setting.FULL_WIDTH - Fighter.WIDTH)) + 1;
                var randomY = (Math.random() * (Setting.HEIGHT - Fighter.HEIGHT + Setting.BLOCK_Y)) + Setting.BLOCK_Y + 1;
                var runeName = helper.randomLobbyId([]);
                var rune = new Rune('hp', randomX, randomY);
                rune.name = runeName;
                for (var lid in lobbies) {
                    lobbies[lid].hpRune = rune;
                    broadcast({
                        type: 'createRune',
                        x: randomX,
                        y: randomY,
                        rtype: 'hp',
                        rname: runeName
                    }, lid);
                }
            }, 18500);
        }
    };

    var gameLoop = function () {
        var id;
        var myid;
        for (myid in players) {
            var myPlayer = players[myid];
            var myx = myPlayer.fighter.x;
            var _sockets = lobbies[myPlayer.lid].sockets;
            for (id in players) {
                var p = players[id];
                // Update on player side
                var xx = p.fighter.x;
                var yy = p.fighter.y;
                var vx = p.fighter.vx;
                var vy = p.fighter.vy;
                // the opponents are not within the interest area. we just do not send sockets
                var isPlayersNearBoundry = (myx < Setting.WIDTH / 2 && xx < Setting.WIDTH * 1.5)
                    || (myx > Setting.FULL_WIDTH - Setting.WIDTH / 2 && xx > Setting.FULL_WIDTH - Setting.WIDTH * 1.5);
                var isOpponentInRangeOfInterest = xx < (myx - Setting.WIDTH / 2 - Fighter.WIDTH * 2) || xx > (myx + Setting.WIDTH / 2 + Fighter.WIDTH * 2);
                if (!isPlayersNearBoundry && isOpponentInRangeOfInterest) {
                    unicast(_sockets[myid], {type: "outOfInterest", pid: p.pid});
                } else {
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
                        username: p.username,
                        hasteCoef: p.fighter.hasteCoef,
                        lid: p.lid,
                        lastHit: p.lastHit
                    };
                    if (p.lid === myPlayer.lid)
                        unicast(_sockets[myid], states);
                }

            }
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

                Setting.log(Setting.LOG_INFO, "New Connection: " + conn.id);
                var nums = [];
                for (var k in lobbies) {
                    nums.push(lobbies[k].count);
                }

                // sends lobby info for new connection
                unicast(conn, {
                        type: "lobbyInfo",
                        lobbies: Object.keys(lobbies),
                        num_players: nums
                    }
                );


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
                        delete lobbies[lid].players[conn.id];
                        delete players[conn.id];
                        delete pidMap[nextPID];
                        if (lobbies[lid].count === 0) {
                            delete lobbies[lid];
                        } else {
                            broadcast({type: "disconnected", pid: nextPID}, lid);
                            Setting.log(Setting.LOG_INFO, "Connection disconnected: " + conn.id);
                        }
                    } catch (e) {
                        Setting.log(Setting.LOG_DEBUG, "Exception:" + e);
                    }
                });

                // When the client send something to the server.
                conn.on('data', function (data) {
                    var message = JSON.parse(data);
                    var p = players[conn.id];

                    switch (message.type) {
                        // create lobby and create the player
                        case 'createLobby':
                            console.log("craete_lobby");
                            var ids = Object.keys(lobbies);
                            var lid = helper.randomLobbyId(ids);
                            newPlayer(conn, lid, message.username);
                            break;
                        //one of the player moves the mouse.
                        case "newPlayer":
                            var username = message.username;
                            players[conn.id].username = username;
                            break;
                        // client join lobby
                        case "join":
                            var username = message.username;
                            var lid = message.lid;
                            newPlayer(conn, lid, username);
                            break;
                        // client moves
                        case "move":
                            p.fighter.vx = message.vx;
                            p.fighter.vy = message.vy;
                            p.fighter.x = message.x;
                            p.fighter.y = message.y;
                            var lobby = lobbies[p.lid];

                            if (lobby.hpRune && lobby.hpRune.name !== undefined) {
                                var px1 = p.fighter.x;
                                var px2 = p.fighter.x + Fighter.WIDTH;
                                var py1 = p.fighter.y;
                                var py2 = p.fighter.y + Fighter.HEIGHT;
                                var rx1 = lobby.hpRune.x;
                                var rx2 = lobby.hpRune.x + Rune.WIDTH;
                                var ry1 = lobby.hpRune.y;
                                var ry2 = lobby.hpRune.y + Rune.HEIGHT;
                                if (px1 < rx2 && px2 > rx1 && py1 < ry2 && py2 > ry1) {
                                    lobby.hpRune.name = undefined;
                                    broadcast({
                                        type: 'runeDisappear',
                                        rtype: 'hp'
                                    }, p.lid);

                                    unicast(conn, {
                                        type: 'collectRune',
                                        rtype: 'hp'
                                    });
                                    p.addRune(lobby.hpRune);
                                }
                            }
                            if (lobby.hasteRune && lobby.hasteRune.name !== undefined) {
                                var px1 = p.fighter.x;
                                var px2 = p.fighter.x + Fighter.WIDTH;
                                var py1 = p.fighter.y;
                                var py2 = p.fighter.y + Fighter.HEIGHT;
                                var rx1 = lobby.hasteRune.x;
                                var rx2 = lobby.hasteRune.x + Rune.WIDTH;
                                var ry1 = lobby.hasteRune.y;
                                var ry2 = lobby.hasteRune.y + Rune.HEIGHT;
                                if (px1 < rx2 && px2 > rx1 && py1 < ry2 && py2 > ry1) {
                                    // collide with hasteRune
                                    lobby.hasteRune.name = undefined;
                                    broadcast({
                                        type: 'runeDisappear',
                                        rtype: 'haste'
                                    }, p.lid);

                                    unicast(conn, {
                                        type: 'collectRune',
                                        rtype: 'haste'
                                    });

                                    lobby.hasteRune.collected_at = new Date();
                                    p.addRune(lobby.hasteRune);
                                }
                            }
                            break;
                        // client attacks
                        case "attack":
                            p.fighter.isInjured = message.isInjured;
                            p.fighter.isHitting = message.isHitting;
                            p.fighter.facingDirection = message.facingDirection; //'left' and 'right'
                            var kill = false;
                            var id;
                            if (p.fighter.isHitting) {
                                for (id in lobbies[p.lid].players) {
                                    var opponent = players[id];
                                    if (p.fighter.hp > 0 && opponent.fighter.hp > 0 && id != conn.id && !p.fighter.isInjured && !opponent.fighter.isInjured) {
                                        if (p.fighter.facingDirection == 'right') {

                                            var tOFRight = opponent.fighter.x + 0.5 * Fighter.WIDTH;
                                            var tOFLeft = opponent.fighter.x - 1.25 * Fighter.WIDTH;
                                            var tOFTop = (opponent.fighter.y + 0.5 * Fighter.HEIGHT);
                                            var tOFBtm = (opponent.fighter.y - 0.5 * Fighter.HEIGHT);
                                            if (p.fighter.x <= tOFRight && p.fighter.x >= tOFLeft && p.fighter.y <= tOFTop && p.fighter.y >= tOFBtm) {
                                                opponent.fighter.getHitted(10);
                                                opponent.fighter.facingDirection = 'left';
                                                if (opponent.fighter.hp <= 0) {
                                                    kill = true;
                                                }
                                            }
                                        }
                                        else if (p.fighter.facingDirection === 'left') {
                                            if (p.fighter.x >= opponent.fighter.x - 0.5 * Fighter.WIDTH
                                                && p.fighter.x <= (opponent.fighter.x + 1.25 * Fighter.WIDTH)
                                                && p.fighter.y <= (opponent.fighter.y + 0.5 * Fighter.HEIGHT)
                                                && p.fighter.y >= (opponent.fighter.y - 0.5 * Fighter.HEIGHT)) {
                                                opponent.fighter.getHitted(10);
                                                opponent.fighter.facingDirection = 'right';
                                                if (opponent.fighter.hp <= 0) {
                                                    kill = true;
                                                    Setting.log(Setting.LOG_INFO, "Player was killed: " + opponent.pid);
                                                }
                                            }
                                        }
                                    }
                                    if (kill) p.lastHit++;
                                    kill = false;
                                }
                            }
                            break;
                        default:
                            Setting.log(Setting.LOG_INFO, "Unhandled " + message.type);
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
            Setting.log(Setting.LOG_INFO, "Server running on http://0.0.0.0:" + 3333 + "\n");
            Setting.log(Setting.LOG_INFO, "Visit http://localhost:" + 3333 + "/fighter.html in your " +
            "browser to start the game");

        } catch (e) {
            Setting.log(Setting.LOG_DEBUG, "Cannot listen to " + 3333);
            Setting.log(Setting.LOG_DEBUG, "Error: " + e);
        }
    }
}

// This will auto run after this script is loaded
var gameServer = new Server();
gameServer.start();
