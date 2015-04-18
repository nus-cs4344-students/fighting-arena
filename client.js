// private variables

function FighterClient(username) {

    var socket;                     // Socket used to connect to server
    var cursors;                    // Store keyboards actions
    var num_text;                   // Number of player text
    var block_y = Setting.BLOCK_Y;  // Upper block offset
    var maxPlayers = 20;            // Max player of a lobby
    var players = [];               // Array to store players
    var hasteRune;                  // Haste rune object
    var hpRune;                     // Hp rune object
    var fighters = [];              // Array to store fighters
    var texts = [];                 // Array to store players' name
    var game;                       // Phaser game object
    var connectedToServer = false;  // Flag for connection
    var numOfPlayers = 0;           // Number of players in game
    var myPID;                      // My player id
    var injuryRecovered = false;    // Flag for injured
    var hitpointSprite = [];        // Array to store players' hp bar
    var scoreTexts = {};            // Object for players' scores
    var deletedPlayers = {};        // Object to store deleted players
    var hitpointBarScale = 0.35;    // HP bar scale
    var isTouchingHit = false;      // Flag for hit
    var myName = username;          // Username in the game
    var joystick;                   // Virtual joystick for touch screen
    var lid;                        // Current lobby id
    var that = this;                // Scope helper
    var mPlayer = new MusicPlayer();// Music player

    /*
     * private method: showLobbyInfo(lobbies)
     * Display the list of lobbies, create buttons dynamically
     * to join the lobby.
     */
    function showLobbyInfo(lobbies, num_players) {
        for (var name in lobbies) {
            var button = "<br><br><button type='button' class='btn btn-success' id='" +
                lobbies[name] + "'>" + "Join Lobby: " +
                lobbies[name] + " (" + num_players[name] +
                " players in the lobby)" + "</button>";

            $('#join-section').append(button);
            (function (ll) {
                $('#' + ll).on("click", function (e) {
                    $("#join-game").modal('hide');
                    that.start(ll)
                });
            }(lobbies[name]))
        }

    }

    /*
     * private method: sendToServer(msg)
     *
     * The method takes in a JSON structure and send it
     * to the server, after converting the structure into
     * a string.
     */
    function sendToServer(msg) {
        var date = new Date();
        var currentTime = date.getTime();
        msg["timestamp"] = currentTime;
        socket.send(JSON.stringify(msg));
    }

    /*
     * private method: addController()
     * The method adds virtual game joystick to
     * browsers which support touch screen.(mobile devices)
     */
    function addController() {
        if (VirtualJoystick.touchScreenAvailable()) {
            joystick = new VirtualJoystick({
                container: document.getElementById('container'),
                mouseSupport: true,
                limitStickTravel: true
            });

            joystick.addEventListener('touchStart', function (event) {
                if (event.touches.length == 2) {
                    isTouchingHit = true;
                }
            });

            joystick.addEventListener('touchEnd', function () {
                isTouchingHit = false;
            });
        }
    }

    /*
     * public method: createLobby()
     * The method sends createLobby message to server with
     * username.
     */
    this.createLobby = function () {
        sendToServer({
            type: 'createLobby',
            username: myName
        });
    }

    /*
     * private method: initNetwork(msg)
     *
     * Connects to the server and initialize the various
     * callbacks.
     */
    function initNetwork() {
        // Attempts to connect to game server
        try {
            $("#warning").hide();
            socket = new SockJS("http://" + Setting.SERVER_NAME + ":" + Setting.PORT + "/fighter");
            socket.onmessage = function (e) {
                var message = JSON.parse(e.data);
                switch (message.type) {
                    // server detected that user of this client collect rune
                    case "collectRune":
                        if (message.rtype === 'haste') {
                            mPlayer.playHaste();
                        } else {
                            mPlayer.playRegen();
                        }
                        break;
                    // server detects that rune should disappear
                    case "runeDisappear":
                        if (message.rtype === 'haste') {
                            hasteRune.visible = false;
                            delete hasteRune.name;
                        } else {
                            hpRune.visible = false;
                            delete hpRune.name;
                        }
                        break;
                    // server create a rune
                    case "createRune":
                        var x = message.x;
                        var y = message.y;
                        var type = message.rtype;
                        var name = message.rname;
                        if (type === 'haste') {
                            hasteRune['name'] = name;
                            hasteRune.x = x;
                            hasteRune.y = y;
                        } else {
                            hpRune['name'] = name;
                            hpRune.x = x;
                            hpRune.y = y;
                        }
                        break;
                    // server sends lobby info
                    case "lobbyInfo":
                        showLobbyInfo(message.lobbies, message.num_players);
                        break;

                    // server create a new player
                    case "newPlayer":
                        var pid = message.pid;
                        var initX = message.x;
                        var initY = message.y;
                        var direction = message.direction;
                        var lid = message.lid;
                        numOfPlayers = message.count + 1;
                        createPlayer(pid, initX, initY, direction, lid);
                        break;

                    // player disconnected
                    case "disconnected":
                        deletePlayer(message.pid);
                        Setting.log(Setting.LOG_INFO, "Player " + message.pid + " disconnected.");
                        break;

                    // assign a player id to client
                    case "assign":
                        connectedToServer = true;
                        myPlayer = players[message.pid];
                        myPID = message.pid;
                        break;

                    // server sends update message
                    case "update":
                        var id = message.pid;
                        if (deletedPlayers[id]) {
                            resumePlayer(id);
                        }
                        if (message.username) {
                            texts[id].text = message.username;
                            scoreTexts[id].text = [message.username, ":", message.lastHit].join(" ");
                        }

                        // update fighter attributes
                        fighters[id].lastHit = message.lastHit;
                        fighters[id].x = message.x;
                        fighters[id].y = message.y;
                        fighters[id].vx = message.vx;
                        fighters[id].vy = message.vy;
                        fighters[id].facingDirection = message.facingDirection;
                        fighters[id].isHitting = message.isHitting;
                        fighters[id].isInjured = message.injuryStatus;
                        fighters[id].hp = message.hp;
                        fighters[id].hasteCoef = message.hasteCoef;
                        break;

                    // server detects some user is out of current interest
                    case "outOfInterest":
                        if (!deletedPlayers[message.pid])
                            deletePlayer(message.pid);
                        break;

                    default:
                        Setting.log(Setting.LOG_INFO, "Unhandled meesage type " + message.type);
                }
            }
            Setting.log(Setting.LOG_INFO, "Connected to server.");
        } catch (e) {
            Setting.log(Setting.LOG_DEBUG, "Failed to connect to " + "http://" + Setting.SERVER_NAME + ":" + Setting.PORT);
        }
    }

    /* The method is required by Phaser.js,
     * it pre-loads all assets files.
     */
    function preload() {

        // haste rune image
        game.load.image('haste', 'assets/haste.png');

        // hp rune image
        game.load.image('hpRune', 'assets/hpRune.png');

        // background image
        game.load.image('background', 'assets/background.jpg');

        // hp bar image
        game.load.image('hitpoint', 'assets/hitpoint.png');

        // character sprite
        game.load.spritesheet('louis', 'assets/characters/louis_lowres.png', 32, 32.5, -1, 0.5, 0);

    }

    /* The method is required by Phaser.js,
     * it creates Phaser game objects
     */
    function create() {

        // Phaser physics world
        game.physics.startSystem(Phaser.Physics.ARCADE);


        // Phaser game scale settings
        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;
        this.scale.setScreenSize(true);

        // add background
        game.add.tileSprite(0, 0, Setting.FULL_WIDTH, Setting.HEIGHT, 'background');
        game.world.setBounds(0, 0, Setting.FULL_WIDTH, Setting.HEIGHT);

        // add runes
        for (var i = 0; i < 2; i++) {
            var randomX = (Math.random() * (Setting.WIDTH - Fighter.WIDTH)) + 1;
            var randomY = (Math.random() * (Setting.HEIGHT - 300)) + 300;
            if (i === 0) {
                hasteRune = game.add.sprite(randomX, randomY, 'haste');
                hasteRune.visible = false;
            } else {
                hpRune = game.add.sprite(randomX, randomY, 'hpRune');
                hpRune.visible = false;
            }
        }

        // add players
        for (var i = 0; i < maxPlayers; i++) {
            randomX = (Math.random() * (Setting.WIDTH - Fighter.WIDTH)) + 1;
            randomY = (Math.random() * (Setting.HEIGHT - Fighter.HEIGHT + Setting.BLOCK_Y)) + Setting.BLOCK_Y + 1;

            var newPlayer = game.add.sprite(randomX, randomY, 'louis');
            var newHp = game.add.sprite(randomX, randomY, 'hitpoint');


            newPlayer.scale.setTo(2, 2);
            newHp.scale.setTo(hitpointBarScale, hitpointBarScale);

            //  enable physics on player
            game.physics.arcade.enable(newPlayer);
            game.physics.arcade.enable(newHp);

            //  add physics attributes to player
            newPlayer.body.collideWorldBounds = true;
            newHp.body.collideWorldBounds = true;

            // add animation to player
            newPlayer.animations.add('rightWalk', [13, 14, 15, 16], 10, true);
            newPlayer.animations.add('leftWalk', [7, 6, 5, 4, 3], 10, true);
            newPlayer.animations.add('leftHit', [28, 27, 26, 25, 24, 23, 22, 21, 20], 10, true);
            newPlayer.animations.add('rightHit', [29, 30, 31, 32, 33, 34, 35, 36, 37], 10, true);
            newPlayer.animations.add('rightHitted', [63, 64, 65, 66, 67, 67, 67, 68, 69, 69, 69, 69, 69], 8, false);
            newPlayer.animations.add('leftHitted', [62, 61, 60, 59, 58, 58, 58, 57, 56, 56, 56, 56, 56], 8, false);
            newPlayer.frame = 9;
            players[i] = newPlayer;
            hitpointSprite[i] = newHp;
            fighters[i] = new Fighter(randomX, randomY, 0);
            newPlayer.visible = false;
            newHp.visible = false;

            // add name bar to player
            var tt = game.add.text(16, 16, '', {fontSize: '20px', fill: '#FFF'});
            var score = game.add.text(16, 16, '', {fontSize: '20px', fill: '#FFF'});
            tt.anchor.set(0.5);
            texts[i] = tt;

            // add score
            score.anchor.set(0);
            scoreTexts[i] = score;
            score.visible = false;
            tt.visible = false;
            deletedPlayers[i] = false;
        }

        //  The # of players
        num_text = game.add.text(16, 16, '# of players: ' + numOfPlayers, {fontSize: '16px', fill: '#000'});

        //  Our controls.
        cursors = game.input.keyboard.createCursorKeys();
        this.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);
        this.input.keyboard.addKeyCapture([Phaser.Keyboard.D]);
        this.input.keyboard.addKeyCapture([Phaser.Keyboard.A]);

        // add joystick
        addController();
    }

    /* The methods takes in pid, x-position, y-position, facingDrection
     * and lobby id to create a new player.
     */
    function createPlayer(pid, x, y, direction, llid) {
        // console.log(players);
        var p = players[pid];
        deletedPlayers[pid] = false;
        p.body.x = x;
        p.body.y = y;
        fighters[pid].x = x;
        fighters[pid].y = y;
        fighters[pid].facingDirection = direction;
        p.visible = true;
        lid = llid;
        Setting.log(Setting.LOG_INFO, "Created player of pid: " + pid);
        sendToServer({
            type: "newPlayer",
            username: myName
        });
    }

    /* The method takes in a pid,
     * and resumes the actions of player of the pid in game
     */
    function resumePlayer(pid) {
        // console.log(players);
        deletedPlayers[pid] = false;
        players[pid].visible = true;
        //scoreTexts[pid].visible = true;
        hitpointSprite[pid].visible = true;
        texts[pid].visible = true;
    }

    /* The method takes in a pid,
     * and hide the player in client.
     */
    function deletePlayer(pid) {
        Setting.log(Setting.LOG_INFO, "Deleted player of pid: " + pid);
        players[pid].visible = false;
        hitpointSprite[pid].visible = false;
        texts[pid].visible = false;
        deletedPlayers[pid] = true;
    }

    /* The method renders players and runes
     */
    function renderGame() {
        // set num_of_players text
        num_text.setText('# of players: ' + numOfPlayers);
        if (hasteRune.hasOwnProperty('name')) {
            hasteRune.visible = true;
        }
        if (hpRune.hasOwnProperty('name')) {
            hpRune.visible = true;
        }

        // render players
        for (var i = 0; i < players.length; i++) {
            if (deletedPlayers[i]) continue;

            // player status
            var player = players[i];
            var fighter = fighters[i];
            var vx = fighters[i].vx;
            var vy = fighters[i].vy;
            var direction = fighters[i].facingDirection;
            var isHitting = fighters[i].isHitting;
            var isInjured = fighters[i].isInjured;
            var hp = fighters[i].hp;
            var healthBar = hitpointSprite[i];

            // score bar
            scoreTexts[i].visible = true;
            texts[i].visible = true;
            texts[i].x = fighters[i].x + 22;
            texts[i].y = fighters[i].y - 8;

            // update player position
            if (i !== myPID) {
                player.body.x = fighter.x;
                player.body.y = fighter.y;
                healthBar.body.x = fighter.x;
                healthBar.body.y = fighter.y;
            }

            if (vx !== undefined && vy !== undefined) {
                player.visible = true;
                healthBar.visible = true;
                player.body.velocity.x = 0;
                player.body.velocity.y = 0;
                healthBar.body.velocity.x = 0;
                healthBar.body.velocity.y = 0;

                if (hp <= 0) {
                    player.animations.stop();
                    player.frame = direction === "right" ? 57 : 68;
                }
                else {
                    if (isInjured) {
                        if (direction === "left") {
                            player.animations.play('leftHitted');
                        } else if (direction === "right") {
                            player.animations.play('rightHitted');
                        }
                        setTimeout(function () {
                            injuryRecovered = true;
                        }, 1500);
                    } else if (isHitting) {
                        if (direction === "left") {
                            player.animations.play('leftHit');
                        } else if (direction === "right") {
                            player.animations.play('rightHit');
                        }
                    } else {
                        if (vx > 0) {
                            player.animations.play("rightWalk");
                        } else if (vx < 0) {
                            player.animations.play("leftWalk");
                        } else {
                            player.animations.stop();
                            player.frame = direction === "left" ? 9 : 10;
                        }
                        healthBar.body.velocity.x = vx;
                        healthBar.body.velocity.y = vy;

                        player.body.velocity.x = vx;
                        player.body.velocity.y = vy;
                    }
                }
                if (hp >= 0) {
                    healthBar.scale.setTo(hitpointBarScale * hp / Fighter.HP, hitpointBarScale);
                }
            }
        }
    }

    /* The method is required by Phaser.js
     * it updates game objects' status and
     * render the game.
     */
    function update() {

        renderGame();
        var vx = 0;
        var vy = 0;
        var isHitting = false;

        if (connectedToServer) {
            var myPlayer = players[myPID];
            var myFighter = fighters[myPID];
            game.camera.follow(myPlayer);
            var multiplier = myFighter.hasteCoef;
            if (injuryRecovered) {
                myFighter.isInjured = false;
                injuryRecovered = false;
            }
            var facingDirection = myFighter.facingDirection;

            if (cursors.up.isDown || (joystick && joystick.up())) {
                vy = -150 * multiplier;
            } else if (cursors.down.isDown || (joystick && joystick.down())) {
                vy = 150 * multiplier;
            }

            if (cursors.left.isDown || (joystick && joystick.left())) {
                vx = -150 * multiplier;
                facingDirection = "left";
            } else if (cursors.right.isDown || (joystick && joystick.right())) {
                vx = 150 * multiplier;
                facingDirection = "right";
            }
            if (this.input.keyboard.isDown(Phaser.Keyboard.D) || isTouchingHit) {
                isHitting = true;
            }
            var healthBar = hitpointSprite[myPID];

            if (myPlayer.body.y < block_y || healthBar.body.y < block_y) {
                myPlayer.body.y = block_y;
                healthBar.body.y = block_y;
            }
            if (healthBar.body.y > Setting.HEIGHT - Fighter.HEIGHT * 2) {
                healthBar.body.y = Setting.HEIGHT - Fighter.HEIGHT * 2;
            }
            if (myFighter.hp > 0) {
                sendToServer({
                    type: "move",
                    x: myPlayer.body.x,
                    y: myPlayer.body.y,
                    vx: vx,
                    vy: vy
                });

                sendToServer({
                    type: "attack",
                    isInjured: myFighter.isInjured,
                    isHitting: isHitting,
                    facingDirection: facingDirection
                });
            }
            scores = [];
            for (var i = 0; i < maxPlayers; i++) {
                if ((myPlayer.body.x - Setting.WIDTH / 2) <= 0) {
                    scoreTexts[i].x = 0;
                } else if ((myPlayer.body.x + Setting.WIDTH / 2) > Setting.FULL_WIDTH) {
                    scoreTexts[i].x = Setting.FULL_WIDTH - Setting.WIDTH;
                } else {
                    scoreTexts[i].x = myPlayer.body.x - Setting.WIDTH / 2;
                }

                if (fighters[i].lastHit !== undefined)
                    scores.push(i);
            }
            scores.sort(function (a, b) {
                return (fighters[b].lastHit - fighters[a].lastHit)
            });
            for (i = 0; i < scores.length; i++) {
                scoreTexts[scores[i]].y = 40 + 30 * i;
            }

            num_text.x = scoreTexts[0].x;
        }

    }

    /* The public method to start game
     */
    this.start = function (action) {
        game = new Phaser.Game(Setting.WIDTH, Setting.HEIGHT, Phaser.AUTO, '', {
            preload: preload,
            create: create,
            update: update
        });
        mPlayer.play();
        if (action === 'create') {
            setTimeout(function () {
                sendToServer({
                    type: 'createLobby'
                });
            }, Setting.START_DELAY);
        } else {
            sendToServer({
                type: "join",
                username: myName,
                lid: action
            });
        }
    };

    /* The public method to startNetwork connection
     */
    this.startNetwork = function () {
        initNetwork();
    };

}

/* The method to dismiss bootstrap modal.
 */

function dismissModal() {
    if ($('#username').val()) {
        $('#myModal').modal('hide');
    }
}

$(document).ready(function () {
    var client;
    $('#join-game').modal('hide');
    $('#myModal').modal('show');

    // username entered
    $('#myModal').on('hidden.bs.modal', function (e) {
        var username = $('#username').val().substring(0, Setting.MAX_NAME_LENGTH);
        $('#join-game').modal('show');
        client = new FighterClient(username);
        client.startNetwork();
    });

    // create a lobby button clicked.
    $("#createButton").click(function () {
        $('#join-game').modal('hide');

        //if mobile, check device orientation
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            if (Math.abs(window.orientation) === Setting.LANDSCAPE_ORIENTATION) {
                setTimeout(function () {
                    client.start('create');
                }, Setting.START_DELAY);
            }

            $(window).on("orientationchange", function (event) {
                if (window.orientation === Setting.LANDSCAPE_ORIENTATION) {
                    setTimeout(function () {
                        client.start('create');
                    }, Setting.START_DELAY);
                }
            });

        } else { //starts otherwise
            setTimeout(function () {
                client.start('create');
            }, Setting.START_DELAY);
        }
    });
});
