// private variables
var socket;         // socket used to connect to server 
var player;
var platforms;
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
var isWalking = true;
var isJumping = false;

var game = new Phaser.Game(794, 389, Phaser.AUTO, '', { preload: preload, create: create, update: update });

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
        socket = new SockJS("http://" + Pong.SERVER_NAME + ":" + Pong.PORT + "/pong");
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
                lastUpdatePaddleAt = t;
                // ball.x = message.ballX;
                // ball.y = message.ballY;
                // Stop updating own's paddle based on server's state
                // since we are short-circuting the paddle movement.
                // myPaddle.x = message.myPaddleX;
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
                var real_distance = distance + Math.abs(message.ballVY * delay/Pong.FRAME_RATE);
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
        console.log("Failed to connect to " + "http://" + Pong.SERVER_NAME + ":" + Pong.PORT);
    }
}

function nextWeapon() {

    //  Tidy-up the current weapon
    if (currentWeapon > 9)
    {
        weapons[currentWeapon].reset();
    }
    else
    {
        weapons[currentWeapon].visible = false;
        weapons[currentWeapon].callAll('reset', null, 0, 0);
        weapons[currentWeapon].setAll('exists', false);
    }

    //  Activate the new one
    currentWeapon++;

    if (currentWeapon === weapons.length)
    {
        currentWeapon = 0;
    }

    weapons[currentWeapon].visible = true;


}


function preload() {
    //for cropping the image
    frameWidth = 64;
    frameHeight = 65;
    game.load.image('sky', 'assets/back08.jpg');
    game.load.image('ground', 'assets/platform.png');
    game.load.image('star', 'assets/star.png');
    game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
    //-1 is for frameMax 5 is for margin, 0 for spacing
    game.load.spritesheet('louis','assets/characters/louis.png',frameWidth, frameHeight, -1,1,0);
    for (var i = 1; i <= 11; i++)
    {
        game.load.image('bullet' + i, 'assets/bullet' + i + '.png');
    }

}

function create() {

    // phaser physics world 
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // add sky 
    game.add.sprite(0, 0, 'sky');

    // grounds group
    platforms = game.add.group();

    //  apply physics on all object of platforms
    platforms.enableBody = true;

    // create the ground.
    var ground = platforms.create(0, game.world.height-0.5, 'ground');

    //  scale ground
    ground.scale.setTo(2, 2);

    //  ground never moves
    ground.body.immovable = true;

    //  create two ledges
    /*
    var ledge = platforms.create(400, 400, 'ground');
    ledge.body.immovable = true;

    ledge = platforms.create(-150, 250, 'ground');
    ledge.body.immovable = true;
	*/
	
    // The player and its settings
    player = game.add.sprite(32, game.world.height - 150, 'louis');
    player.scale.setTo(1,1);
    //  enable physics on player
    game.physics.arcade.enable(player);

    //  add physics attributes to player
    //player.body.bounce.y = 0.2;
    //player.body.gravity.y = 400;
    //player.body.gravity.y = 5;
    player.body.collideWorldBounds = true;

    // add player animation using sprite 

    //player.animations.add('rightWalk', [13,14,15,16,17], 10, true);
    player.animations.add('rightWalk', [13,14,15,16], 10, true);
    player.animations.add('leftWalk', [7,6,5,4,3], 10, true);
    player.animations.add('leftHit',[28,27,26,25,24,23,22,21,20],10,true);
    player.animations.add('rightHit',[29,30,31,32,33,34,35,36,37],10,true);
    player.animations.add('leftKick',[],10,true);
    player.animations.add('rightKick',[],10,true);

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
    this.input.keyboard.addKeyCapture([Phaser.Keyboard.S]);

    var changeKey = this.input.keyboard.addKey(Phaser.Keyboard.ENTER);
//    changeKey.onDown.add(nextWeapon, this);
}

function update() {

    //  Collide the player and the stars with the platforms
    game.physics.arcade.collide(player, platforms);
    game.physics.arcade.collide(stars, platforms);

    //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
    game.physics.arcade.overlap(player, stars, collectStar, null, this);
    game.physics.arcade.overlap(platforms, bullets, collectStar, null, this);
    //  Reset the players velocity (movement)
    player.body.velocity.x = 0;

    if (cursors.left.isDown)
    {
        //  Move to the left
        player.body.velocity.x = -20;
        if(this.input.keyboard.isDown(Phaser.Keyboard.D)){
            player.animations.play('leftHit');
        }else if(this.input.keyboard.isDown(Phaser.Keyboard.A)){
            player.animations.play('leftKick');
        }
        else{
            player.body.velocity.x = -150;
            player.animations.play('leftWalk');
        }
    }
    else if (cursors.right.isDown)
    {
        //  Move to the right
        player.body.velocity.x = 20;
        if(this.input.keyboard.isDown(Phaser.Keyboard.D)){
            player.animations.play('rightHit');
        }else if(this.input.keyboard.isDown(Phaser.Keyboard.A)){
            player.animations.play('rightKick');
        }else{
            player.body.velocity.x = 150;
            player.animations.play('rightWalk');
        }
    }

    else{
        //  Stand still
        if(this.input.keyboard.isDown(Phaser.Keyboard.D)){
            player.animations.play('rightHit');
        }else if(this.input.keyboard.isDown(Phaser.Keyboard.A)){
            player.animations.play('rightKick');
        }else{
            player.animations.stop();
            player.frame = 10;
        }
    }
    
    if (this.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)){
        fire();
    }
    
    //  Allow the player to jump if they are touching the ground.
    /*
    if (cursors.up.isDown && player.body.touching.down)
    {
        player.body.velocity.y = -350;
    }
    */

    // when up is down, move upwards instead of jumping
    if(cursors.up.isDown)
    {
        if(player.body.y >= 100)
        {
            player.body.y -= 1;
        }
    }

    if(cursors.down.isDown)
    {
        player.body.y += 1;
    }

    /*
    if(this.input.keyboard.isDown(Phaser.Keyboard.S)){
        // add a timer
        var first;
        var current;
        if(!isJumping)
        {
            first = game.time.time;
            current = game.time.time;
            isJumping = true;
        }

        while(current - first < 2*1000)
        {
            player.body.y -= 2;
            current = game.time.time;
            console.log(first + ' ' + current);
        }
        //player.body.y -= 2;
    }
    */
}

function fire () {

    if (game.time.now > nextFire && bullets.countDead() > 0)
    {
        nextFire = game.time.now + fireRate;

        var bullet = bullets.getFirstExists(false);

        bullet.reset(this.player.x, this.player.y);

        //bullet.rotation = game.physics.arcade.moveToPointer(bullet, 1000, game.input.activePointer, 500);
        x = 1000;
        y = player.y;
        speed=700;
        maxTime = 500;
        bullet.rotation = game.physics.arcade.moveToXY(bullet,x,y,speed,maxTime);
    }

}

function bulletHitPlatform (platform, bullet) {

    bullet.kill();

}

function collectStar(player, star) {

    // Removes the star from the screen
    star.kill();
    //nextWeapon();
    //  Add and update the score
    score += 10;
    scoreText.text = 'Score: ' + score;

}

// This will auto run after this script is loaded

// Run Client. Give leeway of 0.5 second for libraries to load
// vim:ts=4:sw=4:expandtab
