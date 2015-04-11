// private variables


function FighterClient(){
    var socket;         // socket used to connect to server 
    var player;
    var playerStatus = 0;
    var opponentStatus = 0;
    var opponent;
    var cursors;
    var stars;
    var bullets;
    var fireRate = 100;
    var nextFire = 0;
    var score = 0;
    var scoreText;
    var currentWeapon = 0 ;
    var Weapon = {};
    var weapons = [];
    var starX;
    var hasPlayed = false;
    var game ;
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
                    case "message":
                        appendMessage("serverMsg", message.content);
                        break;
                    case "update": 
                        var t = message.timestamp;
                        if (t < lastUpdatePaddleAt)
                            break;
                        player.x = message.myPlayerX;
                        player.y = meesage.myPlayerY;

                        lastUpdatePaddleAt = t;
                        myPaddle.y = message.myPaddleY;
                        opponentPaddle.x = message.opponentPaddleX;
                        opponentPaddle.y = message.opponentPaddleY;
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

        // The player and its settings
        player = game.add.sprite(32, game.world.height - 150, 'louis');
        opponent = game.add.sprite(game.world.width-600, game.world.height - 150, 'louis');

        opponent.scale.setTo(2,2);
        player.scale.setTo(2,2);
        opponent.frame = 9;
        //  enable physics on player
        game.physics.arcade.enable(player);
        game.physics.arcade.enable(opponent);

        //  add physics attributes to player
        player.body.collideWorldBounds = true;
        opponent.body.collideWorldBounds = true;


        //player.animations.add('rightWalk', [13,14,15,16,17], 10, true);
        player.animations.add('rightWalk', [13,14,15,16], 10, true);
        player.animations.add('leftWalk', [7,6,5,4,3], 10, true);
        player.animations.add('leftHit',[28,27,26,25,24,23,22,21,20],10,true);
        player.animations.add('rightHit',[29,30,31,32,33,34,35,36,37],10,true);
        
        opponent.animations.add('leftHitted',[62,61,60,59,58],5,true);

        //  Finally some stars to collect
        stars = game.add.group();

        //  We will enable physics for any star that is created in this group
        stars.enableBody = true;

        //  Here we'll create 12 of them evenly spaced apart
        for (var i = 0; i < 12; i++)
        {
            //  Create a star inside of the 'stars' group
            var star = stars.create(i * 70, 0, 'star');

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

    function update() {


        // game.physics.arcade.collide(player,opponent);

        //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
        game.physics.arcade.overlap(player,opponent, hitOpponent,null,this);
        game.physics.arcade.overlap(player, stars, collectStar, null, this);
        //  Reset the players velocity (movement)
        player.body.velocity.x = 0;

        if(cursors.up.isDown){
            sendToServer({type:"move", y:-1});
            (player.body.y >= 100)
            {
                player.body.y -= 1;
            }
        }else if(cursors.down.isDown){
            player.body.y+= 1;
            sendToServer({type:"move",y:+1});
        }

        if (cursors.left.isDown)
        {
            //  Move to the left
            player.body.velocity.x = -20;

            if(this.input.keyboard.isDown(Phaser.Keyboard.D)){
                player.animations.play('leftHit');
                sendToServer({type:"hit",status:-1});
                //hit -1 means hit from left side
                playerStatus = 1;
            } else{
                player.body.velocity.x = -150;
                player.animations.play('leftWalk');
                sendToServer({type:"move",x:-1});
            }
        }
        
        else if (cursors.right.isDown)
        {
            //  Move to the right
            player.body.velocity.x = 20;
            if(this.input.keyboard.isDown(Phaser.Keyboard.D)){
                player.animations.play('rightHit');
                //1 means for 
                sendToServer({type:"hit",status:1});
                playerStatus = 1;
            }else{
                player.body.velocity.x = 150;
                sendToServer({type:"move",x:1});
                player.animations.play('rightWalk');
            }
        }else if (game.input.pointer1.isDown){
            player.animations.play('rightWalk');
            player.body.velocity.x = 150;
            // if (Math.floor(game.input.x/(game.width/2)) === LEFT) {
            //   //  Move to the left
            //   player.body.velocity.x = 150;
         
            //   player.animations.play('rightWalk');
            // }
         
            // if (Math.floor(game.input.x/(game.width/2)) === RIGHT) {
            //   //  Move to the right
            //   player.body.velocity.x = -150;
         
            //   player.animations.play('leftWalk');
            // }
      
        }
        else{
            //  Stand still
            if(this.input.keyboard.isDown(Phaser.Keyboard.D)){
                player.animations.play('rightHit');
                sendToServer({type:"hit",status:1});
                playerStatus = 1;
            }else{
                opponent.animations.stop();
                player.animations.stop();
                player.frame = 10;
            }
        }
        
        if (this.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)){
            fire();
        }
        
        //  Allow the player to jump if they are touching the ground.
        if (cursors.up.isDown && player.body.touching.down)
        {
            player.body.velocity.y = -350;
        }
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
        initNetwork();
        game = new Phaser.Game(1080, 1320, Phaser.AUTO, '', { preload: preload, create: create, update: update });

    }

    // This will auto run after this script is loaded

    // Run Client. Give leeway of 0.5 second for libraries to load
    // vim:ts=4:sw=4:expandtab
}

var client = new FighterClient();
setTimeout(function() {client.start();}, 500);





