// private variables

function FighterClient(username) {

    var socket;                     // socket used to connect to server 
    var cursors;
    var stars;
    var bullets;
    var fireRate = 100;
    var block_y = Setting.BLOCK_Y;
    var nextFire = 0;
    var maxPlayers = 20;
    var currentWeapon = 0;
    var players = [];
    var hasteRune;
    var hpRune;
    var fighters = [];
    var texts = [];
    var serverMsg;
    var hasPlayed = false;
    var game;
    var connectedToServer = false;
    var numOfPlayers = 0;
    var myPID;
    var injuryRecovered = false;
    var hitpointSprite = [];
    var scoreTexts = [];
    var deletedPlayers = {};
    var fullHP = 1000;
    var hitpointBarScale = 0.35;
    var isTouchingHit = false;
    var myName = username;          //username in the game
    var joystick;                   //virtual joystick for touch screen
    var lid;
    var that = this;
    var mPlayer = new musicPlayer();

    /*
     * private method: showMessage(location, msg)
     *
     * Display a text message on the web page.  The 
     * parameter location indicates the class ID of
     * the HTML element, and msg indicates the message.
     *
     * The new message replaces any existing message
     * being shown.
     */

    function showMessage(location, msg) {
        document.getElementById(location).innerHTML = msg;
    }

    /*
     * private method: showLobbyInfo(lobbies)
     * Display the list of lobbies, create buttons
     * to join the lobby
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
     * private method: appendMessage(location, msg)
     *
     * Display a text message on the web page.  The 
     * parameter location indicates the class ID of
     * the HTML element, and msg indicates the message.
     *
     * The new message is displayed ON TOP of any 
     * existing messages.  A timestamp prefix is added
     * to the message displayed.
     */
    function appendMessage(location, msg) {
        var prev_msgs = document.getElementById(location).innerHTML;
        document.getElementById(location).innerHTML = "[" + new Date().toString() + "] " + msg + "<br />" + prev_msgs;
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
                    //created player
                    case "runeDisappear":
                        if (message.rtype === 'haste'){
                            hasteRune.visible = false;
                            delete hasteRune.name;
                        } else {
                            hpRune.visible = false;
                            delete hpRune.name;
                        }
                        break;
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
                    case "lobbyInfo":
                        showLobbyInfo(message.lobbies, message.num_players);
                        break;
                    case "newPlayer":
                        var pid = message.pid;
                        var initX = message.x;
                        var initY = message.y;
                        var direction = message.direction;
                        var lid = message.lid;
                        numOfPlayers = message.count + 1;
                        createPlayer(pid, initX, initY, direction, lid);
                        break;
                    //player disconnected
                    case "disconnected":
                        deletePlayer(message.pid);

                        break;
                    case "assign":
                        connectedToServer = true;
                        myPlayer = players[message.pid];
                        myPID = message.pid;
                        break;
                    case "update":
                        var id = message.pid;
                        if(deletedPlayers[id]){
                            resumePlayer(id);
                        }
                        if (message.username) {
                            texts[id].text = message.username;
                            scoreTexts[id].setText(message.username + ": " + message.lastHit);
                        }
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
                    case "outOfInterest":
                        if(!deletedPlayers[message.pid])
                            deletePlayer(message.pid);
                        break;
                    default:
                        appendMessage("serverMsg", "unhandled meesage type " + message.type);
                }
            }
            console.log("connected");
        } catch (e) {
            console.log("Failed to connect to " + "http://" + Fighter.SERVER_NAME + ":" + Fighter.PORT);
        }
    }

    function preload() {
        //for cropping the image
        frameWidth = 64;
        frameHeight = 65;
        low_frameWidth = 32;
        low_frameHeight = 32;
        game.load.image('sky', 'assets/back08.jpg');
        game.load.image('haste', 'assets/haste.png');
        game.load.image('hpRune', 'assets/hpRune.png');
        game.load.image('background', 'assets/background.jpg');
        //game.load.image('sky', 'assets/sky.png');
        game.load.image('ground', 'assets/platform.png');
        game.load.image('star', 'assets/star.png');
        game.load.image('hitpoint', 'assets/hitpoint.png');
        game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
        //-1 is for frameMax 5 is for margin, 0 for spacing
        //game.load.spritesheet('louis','assets/louis.png',frameWidth, frameHeight, -1,1,0);
        game.load.spritesheet('louis', 'assets/characters/louis_lowres.png', 32, 32.5, -1, 0.5, 0);

    }

    function create() {

        // phaser physics world 
        game.physics.startSystem(Phaser.Physics.ARCADE);
        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

        //have the game centered horizontally

        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;
        this.scale.setScreenSize(true);

        //screen size will be set automatically

        //add button

        // add background
        game.add.tileSprite(0, 0, Setting.FULL_WIDTH,Setting.HEIGHT, 'background');
        game.world.setBounds(0,0,Setting.FULL_WIDTH,Setting.HEIGHT);

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

        for(var i=0;i<maxPlayers;i++){
            randomX = (Math.random() * (Setting.WIDTH-Fighter.WIDTH)) + 1;
            randomY = (Math.random() * (Setting.HEIGHT-Fighter.HEIGHT)) + 1;

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

            //player.animations.add('rightWalk', [13,14,15,16,17], 10, true);
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

            var tt = game.add.text(16, 16, '', {fontSize: '20px', fill: '#FFF'});
            var height = 10 * i;
            console.log(height);
            var score = game.add.text(100, height, '', {fontSize: '20px', fill: '#FFF'});

            tt.anchor.set(0.5);
            texts[i] = tt;

            scoreTexts[i] = score;
            score.anchor.set(1, 1);
            score.visible = false;
            tt.visible = false;
            deletedPlayers[i]=false;
        }



        //  The # of players
        num_text = game.add.text(16, 16, '# of players: ' + numOfPlayers, {fontSize: '16px', fill: '#000'});

        //  Our controls.
        cursors = game.input.keyboard.createCursorKeys();
        this.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);
        this.input.keyboard.addKeyCapture([Phaser.Keyboard.D]);
        this.input.keyboard.addKeyCapture([Phaser.Keyboard.A]);
        var changeKey = this.input.keyboard.addKey(Phaser.Keyboard.ENTER);
        //    changeKey.onDown.add(nextWeapon, this);
        addController();
    }

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
        console.log("created player of " + pid);
        console.log("local postion updated" + x + " " + " " + y);
        sendToServer({
            type: "newPlayer",
            username: myName
        });
    }

    function resumePlayer(pid) {
        // console.log(players);
        deletedPlayers[pid] = false;
        players[pid].visible = true;
        scoreTexts[pid].visible = true;
        hitpointSprite[pid].visible = true;
        texts[pid].visible = true;
    }

    function deletePlayer(pid) {
        console.log("my id " + myPID);
        console.log("deleted player of " + pid);
        console.log(players[pid]);
        players[pid].visible = false;
        scoreTexts[pid].visible = false;
        hitpointSprite[pid].visible = false;
        texts[pid].visible = false;
        deletedPlayers[pid] = true;
        //numOfPlayers--;
    }

    function renderGame() {
        //here is for rendering
        num_text.setText('# of players: ' + numOfPlayers);
        if (hasteRune.hasOwnProperty('name')) {
            hasteRune.visible = true;
        }
        if (hpRune.hasOwnProperty('name')) {
            hpRune.visible = true;
        }

        for (var i = 0; i < players.length; i++) {
            if(deletedPlayers[i]) continue;

            var animaPlayed = false;
            var player = players[i];
            var fighter = fighters[i];
            var vx = fighters[i].vx;
            var vy = fighters[i].vy;
            var direction = fighters[i].facingDirection;
            var isHitting = fighters[i].isHitting;
            var isInjured = fighters[i].isInjured;
            var hp = fighters[i].hp;
            var healthBar = hitpointSprite[i];
            scoreTexts[i].visible = true;
            texts[i].visible = true;
            texts[i].x = fighters[i].x + 22;
            texts[i].y = fighters[i].y - 8;

            if (i !== myPID) {
                player.body.x = fighter.x;
                player.body.y = fighter.y;
                healthBar.body.x = fighter.x;
                healthBar.body.y = fighter.y;
            }

            //console.log(fighters[i].hp);
            //console.log(fighters[i].isInjured);
            //console.log(vx+"vy:"+vy);
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
                if (hp >= 0)
                    healthBar.scale.setTo(hitpointBarScale * hp / fullHP, hitpointBarScale);
            }
        }
    }

    function update() {

        renderGame();
        //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
        //game.physics.arcade.overlap(player,opponent, hitOpponent,null,this);
        //game.physics.arcade.overlap(player, stars, collectStar, null, this);
        //  Reset the players velocity (movement)
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
            if (healthBar.body.y > Setting.HEIGHT-Fighter.HEIGHT*2) {
                healthBar.body.y = Setting.HEIGHT-Fighter.HEIGHT*2;
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
        }

    }

    function fire() {

        if (game.time.now > nextFire && bullets.countDead() > 0) {
            nextFire = game.time.now + fireRate;

            var bullet = bullets.getFirstExists(false);

            bullet.reset(player.x, player.y);

            //bullet.rotation = game.physics.arcade.moveToPointer(bullet, 1000, game.input.activePointer, 500);
            x = 1000;
            y = player.y;
            speed = 700;
            maxTime = 500;
            bullet.rotation = game.physics.arcade.moveToXY(bullet, x, y, speed, maxTime);
        }
    }

    function hitOpponent(player, opponent) {
        opponentStatus = -1;
        console.log(hasPlayed, playerStatus, opponentStatus);
        if (!hasPlayed && playerStatus == 1 && opponentStatus == -1) {
            opponent.animations.play('leftHitted');
            opponent.body.x += 20;
            playerStatus = 0;
            opponentStatus = 0;
            hasPlayed = true;
        } else {
            opponent.animations.stop();
            hasPlayed = false;
        }
    }

    this.start = function (action) {
        game = new Phaser.Game(Setting.WIDTH, Setting.HEIGHT, Phaser.AUTO, '', {
            preload: preload,
            create: create,
            update: update
        });
        //mPlayer.play();
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

    this.startNetwork = function () {
        initNetwork();
    }
    // This will auto run after this script is loaded

}

function dismissModal() {
    if ($('#username').val()) {
        $('#myModal').modal('hide');
    }
}

$(document).ready(function () {
    var client;
    $('#join-game').modal('hide');
    $('#myModal').modal('show');
    $('#myModal').on('hidden.bs.modal', function (e) {
        var username = $('#username').val().substring(0, Setting.MAX_NAME_LENGTH);
        $('#join-game').modal('show');
        client = new FighterClient(username);
        client.startNetwork();
    });

    $("#createButton").click(function () {
        $('#join-game').modal('hide');
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            //if mobile, check device orientation
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
