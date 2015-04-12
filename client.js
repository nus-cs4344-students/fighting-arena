// private variables


function FighterClient(){
    var socket;         // socket used to connect to server 
    var cursors;
    var stars;
    var bullets;
    var fireRate = 100;
    var nextFire = 0;
    var score = 0;
    var scoreText;
    var player;
    var currentWeapon = 0 ;
    var players = [];
    var serverMsg;
    var hasPlayed = false;
    var game ;
    var vxOfPlayers = {};
    var vyOfPlayers = {};
    var directions = [];
    var numOfPlayers = 0;
    var myPID;
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

    /*
     * private method: initNetwork(msg)
     *
     * Connects to the server and initialize the various
     * callbacks.
     */
    function initNetwork() {
        // Attempts to connect to game server
        try {
            socket = new SockJS("http://" + Setting.SERVER_NAME + ":" + Setting.PORT + "/fighter");
            socket.onmessage = function (e) {
                var message = JSON.parse(e.data);
                switch (message.type) {
                    //created player
                    case "newPlayer":
                        var pid = message.pid;
                        var initX = message.x;
                        var initY = message.y;
                        var direction = message.direction;
                        createPlayer(pid,initX,initY,direction);
                        //console.log("initX:"+message.x+"initY:"+message.y);
                        break;
                    //player disconnected
                    case "disconnected":
                        deletePlayer(message.pid);
                        break;
                    case "assign":
                        player = players[message.pid];
                        myPID = message.pid;
                        break;
                    case "update":
                        if(!(message.pid in players)){
                            //console.log("pid:"+message.pid);
                            createPlayer(message.pid,message.x,message.y,1);
                        }else{
                            vxOfPlayers[message.pid] = message.vx;
                            vyOfPlayers[message.pid] = message.vy;
                            //console.log("udpatedX:"+message.x+"updatedY:"+message.y);
                        }
                        break;
                    case "updateVelocity":
                        var t = message.timestamp;
                        if (t < lastUpdateVelocityAt)
                            break;
                        var distance = playArea.height - Ball.HEIGHT - 2* Paddle.HEIGHT;
                        // var real_distance = distance+100;
                        var real_distance = distance + Math.abs(message.ballVY * delay/Fighter.FRAME_RATE);
                        var coef = real_distance/distance;
                        var real_vy = message.ballVY * coef;
                        // var real_vy = message.ballVY;
                        lastUpdateVelocityAt = t;
                        ball.vx = message.ballVX;
                        ball.vy = real_vy;
                        // Periodically resync ball position to prevent error
                        // in calculation to propagate.
                        ball.x = message.ballX;
                        ball.y = message.ballY;
                        break;
                    case "outOfBound":
                        ball.reset();
                        myPaddle.reset();
                        opponentPaddle.reset();
                        break;
                    default: 
                    appendMessage("serverMsg", "unhandled meesage type " + message.type);
                }
            }
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
        //game.load.image('sky', 'assets/sky.png');
        game.load.image('ground', 'assets/platform.png');
        game.load.image('star', 'assets/star.png');
        game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
        //-1 is for frameMax 5 is for margin, 0 for spacing
        //game.load.spritesheet('louis','assets/louis.png',frameWidth, frameHeight, -1,1,0);
        game.load.spritesheet('louis','assets/characters/louis_lowres.png',32, 32.5, -1,0.5,0);

    }

    function create() {

        // phaser physics world 
        game.physics.startSystem(Phaser.Physics.ARCADE);

        // add sky 
        game.add.sprite(0, 0, 'sky');
        var positions = [[Setting.WIDTH/4, Setting.HEIGHT/4], [Setting.WIDTH/4, Setting.HEIGHT*3/4],
        [Setting.WIDTH*3/4, Setting.HEIGHT*3/4],[Setting.WIDTH*3/4, Setting.HEIGHT/4]];
        for(var i=0;i<4;i++){
            var newPlayer = game.add.sprite(positions[i][0], positions[i][1], 'louis');

            newPlayer.scale.setTo(2,2);
            //  enable physics on player
            game.physics.arcade.enable(newPlayer);

            //  add physics attributes to player
            newPlayer.body.collideWorldBounds = true;

            //player.animations.add('rightWalk', [13,14,15,16,17], 10, true);
            newPlayer.animations.add('rightWalk', [13,14,15,16], 10, true);
            newPlayer.animations.add('leftWalk', [7,6,5,4,3], 10, true);
            newPlayer.animations.add('leftHit',[28,27,26,25,24,23,22,21,20],10,true);
            newPlayer.animations.add('rightHit',[29,30,31,32,33,34,35,36,37],10,true);
            newPlayer.frame = 9;
            players[i] = newPlayer;
            newPlayer.visible = false;
        }
        //  Finally some stars to collect
        stars = game.add.group();

        //  We will enable physics for any star that is created in this group
        stars.enableBody = true;

        //  Here we'll create 12 of them evenly spaced apart
        for (var j = 0; j < 12; j++)
        {
            //  Create a star inside of the 'stars' group
            var star = stars.create(j * 70, 0, 'star');

            //  Let gravity do its thing
            star.body.gravity.y = 300;

            //  This just gives each star a slightly random bounce value
            star.body.bounce.y = 0.7 + Math.random() * 0.2;

            if(i==3) starX = star;
        }

        bullets = game.add.group();
        bullets.enableBody = true;
        bullets.physicsBodyType = Phaser.Physics.ARCADE;
        bullets.createMultiple(40, 'bullet5', 0, false);
        bullets.setAll('anchor.x', 0.5);
        bullets.setAll('anchor.y', 0.5);
        bullets.setAll('outOfBoundsKill', true);
        bullets.setAll('checkWorldBounds', true);

        //  The score
        scoreText = game.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });

        //  Our controls.
        cursors = game.input.keyboard.createCursorKeys();
        this.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);
        this.input.keyboard.addKeyCapture([Phaser.Keyboard.D]);
        this.input.keyboard.addKeyCapture([Phaser.Keyboard.A]);
        var changeKey = this.input.keyboard.addKey(Phaser.Keyboard.ENTER);
        //    changeKey.onDown.add(nextWeapon, this);
    }

    function createPlayer(pid,x,y,direction) {
        console.log(players);
        var p = players[pid];
        p.body.x = x;
        p.body.y = y;
        directions[pid] = direction;
        p.visible = true;
        console.log("created player of "+pid);
        console.log("local postion updated"+x+" "+" "+y);
    }

    function deletePlayer(pid){
        console.log("deleted player of "+pid);
        players[pid].visible = false;
    }

    // function renderGame(serverMsg){

    // }

    function update() {
        for(var i=0;i<players.length;i++){
            if(vxOfPlayers[i]!==undefined && vyOfPlayers[i]!==undefined){
                //players[i].visible = true;
                if(vxOfPlayers[i]>0){
                    players[i].animations.play("rightWalk");
                }else if(vxOfPlayers[i]<0){
                    players[i].animations.play("leftWalk");
                }else{
                    players[i].animations.stop();
                }
                console.log("vx:"+vxOfPlayers[i]);
                players[i].body.velocity.x = vxOfPlayers[i];
                players[i].body.velocity.y = vyOfPlayers[i];
            }
        }
        // game.physics.arcade.collide(player,opponent);

        //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
        //game.physics.arcade.overlap(player,opponent, hitOpponent,null,this);
        //game.physics.arcade.overlap(player, stars, collectStar, null, this);
        //  Reset the players velocity (movement)
        var vx = 0;
        var vy = 0;
        if(player !== undefined){
            if(cursors.up.isDown){
                vy = -50;
            }else if(cursors.down.isDown){
                vy = 50;
            }else if (cursors.left.isDown){
                vx = -150;
            }else if (cursors.right.isDown){
                vx = 150;
            }
        }
        sendToServer({
            type:"move",
            x:player.body.x,
            y:player.body.y,
            vx:vx,
            vy:vy});
    }

    function fire () {

        if (game.time.now > nextFire && bullets.countDead() > 0)
        {
            nextFire = game.time.now + fireRate;

            var bullet = bullets.getFirstExists(false);

            bullet.reset(player.x, player.y);

            //bullet.rotation = game.physics.arcade.moveToPointer(bullet, 1000, game.input.activePointer, 500);
            x = 1000;
            y = player.y;
            speed=700;
            maxTime = 500;
            bullet.rotation = game.physics.arcade.moveToXY(bullet,x,y,speed,maxTime);
        }

    }

    function hitOpponent(player,opponent) {
        opponentStatus = -1;
        console.log(hasPlayed,playerStatus,opponentStatus);
        if(!hasPlayed && playerStatus==1 && opponentStatus==-1){
            opponent.animations.play('leftHitted');
            opponent.body.x+=20;
            playerStatus=0;
            opponentStatus=0;
            hasPlayed = true;
        }else{
            opponent.animations.stop();
            hasPlayed = false;
        }
    }

    function collectStar(player, star) {

        // Removes the star from the screen
        star.kill();
        //nextWeapon();
        //  Add and update the score
        score += 10;
        scoreText.text = 'Score: ' + score;

    }

    this.start = function (){
        game = new Phaser.Game(Setting.WIDTH, Setting.HEIGHT, Phaser.AUTO, '', { preload: preload, create: create, update: update });
        initNetwork();
    }
    // This will auto run after this script is loaded

    // Run Client. Give leeway of 0.5 second for libraries to load
    // vim:ts=4:sw=4:expandtab
}

var client = new FighterClient();
setTimeout(function() {client.start();}, 500);





