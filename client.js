// private variables
var socket;         // socket used to connect to server 
var player;
var platforms;
var cursors;
var stars;
var score = 0;
var scoreText;
var currentWeapon = 0 ;
var Weapon = {};
var weapons = [];
var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });

var Bullet = function (game, key) {

    Phaser.Sprite.call(this, game, 0, 0, key);

    this.texture.baseTexture.scaleMode = PIXI.scaleModes.NEAREST;

    this.anchor.set(0.5);

    this.checkWorldBounds = true;
    this.outOfBoundsKill = true;
    this.exists = false;

    this.tracking = false;
    this.scaleSpeed = 0;

};

Bullet.prototype = Object.create(Phaser.Sprite.prototype);
Bullet.prototype.constructor = Bullet;

Bullet.prototype.fire = function (x, y, angle, speed, gx, gy) {

    gx = gx || 0;
    gy = gy || 0;

    this.reset(x, y);
    this.scale.set(1);

    this.game.physics.arcade.velocityFromAngle(angle, speed, this.body.velocity);

    this.angle = angle;

    this.body.gravity.set(gx, gy);

};

Bullet.prototype.update = function () {

    if (this.tracking)
    {
        this.rotation = Math.atan2(this.body.velocity.y, this.body.velocity.x);
    }

    if (this.scaleSpeed > 0)
    {
        this.scale.x += this.scaleSpeed;
        this.scale.y += this.scaleSpeed;
    }

};

Weapon.SingleBullet = function (game) {

    Phaser.Group.call(this, game, game.world, 'Single Bullet', false, true, Phaser.Physics.ARCADE);

    this.nextFire = 0;
    this.bulletSpeed = 600;
    this.fireRate = 100;

    for (var i = 0; i < 64; i++)
    {
        this.add(new Bullet(game, 'bullet5'), true);
    }

    return this;

};

Weapon.SingleBullet.prototype = Object.create(Phaser.Group.prototype);
Weapon.SingleBullet.prototype.constructor = Weapon.SingleBullet;

Weapon.SingleBullet.prototype.fire = function (source) {

    if (this.game.time.time < this.nextFire) { return; }

    var x = source.x + 10;
    var y = source.y + 10;

    this.getFirstExists(false).fire(x, y, 0, this.bulletSpeed, 0, 0);

    this.nextFire = this.game.time.time + this.fireRate;

};

/////////////////////////////////////////////////////////
//  A bullet is shot both in front and behind the ship //
/////////////////////////////////////////////////////////

Weapon.FrontAndBack = function (game) {

    Phaser.Group.call(this, game, game.world, 'Front And Back', false, true, Phaser.Physics.ARCADE);

    this.nextFire = 0;
    this.bulletSpeed = 600;
    this.fireRate = 100;

    for (var i = 0; i < 64; i++)
    {
        this.add(new Bullet(game, 'bullet5'), true);
    }

    return this;

};

Weapon.FrontAndBack.prototype = Object.create(Phaser.Group.prototype);
Weapon.FrontAndBack.prototype.constructor = Weapon.FrontAndBack;

Weapon.FrontAndBack.prototype.fire = function (source) {

    if (this.game.time.time < this.nextFire) { return; }

    var x = source.x + 10;
    var y = source.y + 10;

    this.getFirstExists(false).fire(x, y, 0, this.bulletSpeed, 0, 0);
    this.getFirstExists(false).fire(x, y, 180, this.bulletSpeed, 0, 0);

    this.nextFire = this.game.time.time + this.fireRate;

};

//////////////////////////////////////////////////////
//  3-way Fire (directly above, below and in front) //
//////////////////////////////////////////////////////

Weapon.ThreeWay = function (game) {

    Phaser.Group.call(this, game, game.world, 'Three Way', false, true, Phaser.Physics.ARCADE);

    this.nextFire = 0;
    this.bulletSpeed = 600;
    this.fireRate = 100;

    for (var i = 0; i < 96; i++)
    {
        this.add(new Bullet(game, 'bullet7'), true);
    }

    return this;

};

Weapon.ThreeWay.prototype = Object.create(Phaser.Group.prototype);
Weapon.ThreeWay.prototype.constructor = Weapon.ThreeWay;

Weapon.ThreeWay.prototype.fire = function (source) {

    if (this.game.time.time < this.nextFire) { return; }

    var x = source.x + 10;
    var y = source.y + 10;

    this.getFirstExists(false).fire(x, y, 270, this.bulletSpeed, 0, 0);
    this.getFirstExists(false).fire(x, y, 0, this.bulletSpeed, 0, 0);
    this.getFirstExists(false).fire(x, y, 90, this.bulletSpeed, 0, 0);

    this.nextFire = this.game.time.time + this.fireRate;

};

/////////////////////////////////////////////
//  8-way fire, from all sides of the ship //
/////////////////////////////////////////////

Weapon.EightWay = function (game) {

    Phaser.Group.call(this, game, game.world, 'Eight Way', false, true, Phaser.Physics.ARCADE);

    this.nextFire = 0;
    this.bulletSpeed = 600;
    this.fireRate = 100;

    for (var i = 0; i < 96; i++)
    {
        this.add(new Bullet(game, 'bullet5'), true);
    }

    return this;

};

Weapon.EightWay.prototype = Object.create(Phaser.Group.prototype);
Weapon.EightWay.prototype.constructor = Weapon.EightWay;

Weapon.EightWay.prototype.fire = function (source) {

    if (this.game.time.time < this.nextFire) { return; }

    var x = source.x + 16;
    var y = source.y + 10;

    this.getFirstExists(false).fire(x, y, 0, this.bulletSpeed, 0, 0);
    this.getFirstExists(false).fire(x, y, 45, this.bulletSpeed, 0, 0);
    this.getFirstExists(false).fire(x, y, 90, this.bulletSpeed, 0, 0);
    this.getFirstExists(false).fire(x, y, 135, this.bulletSpeed, 0, 0);
    this.getFirstExists(false).fire(x, y, 180, this.bulletSpeed, 0, 0);
    this.getFirstExists(false).fire(x, y, 225, this.bulletSpeed, 0, 0);
    this.getFirstExists(false).fire(x, y, 270, this.bulletSpeed, 0, 0);
    this.getFirstExists(false).fire(x, y, 315, this.bulletSpeed, 0, 0);

    this.nextFire = this.game.time.time + this.fireRate;

};

////////////////////////////////////////////////////
//  Bullets are fired out scattered on the y axis //
////////////////////////////////////////////////////

Weapon.ScatterShot = function (game) {

    Phaser.Group.call(this, game, game.world, 'Scatter Shot', false, true, Phaser.Physics.ARCADE);

    this.nextFire = 0;
    this.bulletSpeed = 600;
    this.fireRate = 40;

    for (var i = 0; i < 32; i++)
    {
        this.add(new Bullet(game, 'bullet5'), true);
    }

    return this;

};

Weapon.ScatterShot.prototype = Object.create(Phaser.Group.prototype);
Weapon.ScatterShot.prototype.constructor = Weapon.ScatterShot;

Weapon.ScatterShot.prototype.fire = function (source) {

    if (this.game.time.time < this.nextFire) { return; }

    var x = source.x + 16;
    var y = (source.y + source.height / 2) + this.game.rnd.between(-10, 10);

    this.getFirstExists(false).fire(x, y, 0, this.bulletSpeed, 0, 0);

    this.nextFire = this.game.time.time + this.fireRate;

};

//////////////////////////////////////////////////////////////////////////
//  Fires a streaming beam of lazers, very fast, in front of the player //
//////////////////////////////////////////////////////////////////////////

Weapon.Beam = function (game) {

    Phaser.Group.call(this, game, game.world, 'Beam', false, true, Phaser.Physics.ARCADE);

    this.nextFire = 0;
    this.bulletSpeed = 1000;
    this.fireRate = 45;

    for (var i = 0; i < 64; i++)
    {
        this.add(new Bullet(game, 'bullet11'), true);
    }

    return this;

};

Weapon.Beam.prototype = Object.create(Phaser.Group.prototype);
Weapon.Beam.prototype.constructor = Weapon.Beam;

Weapon.Beam.prototype.fire = function (source) {

    if (this.game.time.time < this.nextFire) { return; }

    var x = source.x + 40;
    var y = source.y + 10;

    this.getFirstExists(false).fire(x, y, 0, this.bulletSpeed, 0, 0);

    this.nextFire = this.game.time.time + this.fireRate;

};

///////////////////////////////////////////////////////////////////////
//  A three-way fire where the top and bottom bullets bend on a path //
///////////////////////////////////////////////////////////////////////

Weapon.SplitShot = function (game) {

    Phaser.Group.call(this, game, game.world, 'Split Shot', false, true, Phaser.Physics.ARCADE);

    this.nextFire = 0;
    this.bulletSpeed = 700;
    this.fireRate = 40;

    for (var i = 0; i < 64; i++)
    {
        this.add(new Bullet(game, 'bullet8'), true);
    }

    return this;

};

Weapon.SplitShot.prototype = Object.create(Phaser.Group.prototype);
Weapon.SplitShot.prototype.constructor = Weapon.SplitShot;

Weapon.SplitShot.prototype.fire = function (source) {

    if (this.game.time.time < this.nextFire) { return; }

    var x = source.x + 20;
    var y = source.y + 10;

    this.getFirstExists(false).fire(x, y, 0, this.bulletSpeed, 0, -500);
    this.getFirstExists(false).fire(x, y, 0, this.bulletSpeed, 0, 0);
    this.getFirstExists(false).fire(x, y, 0, this.bulletSpeed, 0, 500);

    this.nextFire = this.game.time.time + this.fireRate;

};

///////////////////////////////////////////////////////////////////////
//  Bullets have Gravity.y set on a repeating pre-calculated pattern //
///////////////////////////////////////////////////////////////////////

Weapon.Pattern = function (game) {

    Phaser.Group.call(this, game, game.world, 'Pattern', false, true, Phaser.Physics.ARCADE);

    this.nextFire = 0;
    this.bulletSpeed = 600;
    this.fireRate = 40;

    this.pattern = Phaser.ArrayUtils.numberArrayStep(-800, 800, 200);
    this.pattern = this.pattern.concat(Phaser.ArrayUtils.numberArrayStep(800, -800, -200));

    this.patternIndex = 0;

    for (var i = 0; i < 64; i++)
    {
        this.add(new Bullet(game, 'bullet4'), true);
    }

    return this;

};

Weapon.Pattern.prototype = Object.create(Phaser.Group.prototype);
Weapon.Pattern.prototype.constructor = Weapon.Pattern;

Weapon.Pattern.prototype.fire = function (source) {

    if (this.game.time.time < this.nextFire) { return; }

    var x = source.x + 20;
    var y = source.y + 10;

    this.getFirstExists(false).fire(x, y, 0, this.bulletSpeed, 0, this.pattern[this.patternIndex]);

    this.patternIndex++;

    if (this.patternIndex === this.pattern.length)
    {
        this.patternIndex = 0;
    }

    this.nextFire = this.game.time.time + this.fireRate;

};

///////////////////////////////////////////////////////////////////
//  Rockets that visually track the direction they're heading in //
///////////////////////////////////////////////////////////////////

Weapon.Rockets = function (game) {

    Phaser.Group.call(this, game, game.world, 'Rockets', false, true, Phaser.Physics.ARCADE);

    this.nextFire = 0;
    this.bulletSpeed = 400;
    this.fireRate = 250;

    for (var i = 0; i < 32; i++)
    {
        this.add(new Bullet(game, 'bullet10'), true);
    }

    this.setAll('tracking', true);

    return this;

};

Weapon.Rockets.prototype = Object.create(Phaser.Group.prototype);
Weapon.Rockets.prototype.constructor = Weapon.Rockets;

Weapon.Rockets.prototype.fire = function (source) {

    if (this.game.time.time < this.nextFire) { return; }

    var x = source.x + 10;
    var y = source.y + 10;

    this.getFirstExists(false).fire(x, y, 0, this.bulletSpeed, 0, -700);
    this.getFirstExists(false).fire(x, y, 0, this.bulletSpeed, 0, 700);

    this.nextFire = this.game.time.time + this.fireRate;

};

////////////////////////////////////////////////////////////////////////
//  A single bullet that scales in size as it moves across the screen //
////////////////////////////////////////////////////////////////////////

Weapon.ScaleBullet = function (game) {

    Phaser.Group.call(this, game, game.world, 'Scale Bullet', false, true, Phaser.Physics.ARCADE);

    this.nextFire = 0;
    this.bulletSpeed = 800;
    this.fireRate = 100;

    for (var i = 0; i < 32; i++)
    {
        this.add(new Bullet(game, 'bullet9'), true);
    }

    this.setAll('scaleSpeed', 0.05);

    return this;

};

Weapon.ScaleBullet.prototype = Object.create(Phaser.Group.prototype);
Weapon.ScaleBullet.prototype.constructor = Weapon.ScaleBullet;

Weapon.ScaleBullet.prototype.fire = function (source) {

    if (this.game.time.time < this.nextFire) { return; }

    var x = source.x + 10;
    var y = source.y + 10;

    this.getFirstExists(false).fire(x, y, 0, this.bulletSpeed, 0, 0);

    this.nextFire = this.game.time.time + this.fireRate;

};

Weapon.Combo1 = function (game) {

    this.name = "Combo One";
    this.weapon1 = new Weapon.SingleBullet(game);
    this.weapon2 = new Weapon.Rockets(game);

};

Weapon.Combo1.prototype.reset = function () {

    this.weapon1.visible = false;
    this.weapon1.callAll('reset', null, 0, 0);
    this.weapon1.setAll('exists', false);

    this.weapon2.visible = false;
    this.weapon2.callAll('reset', null, 0, 0);
    this.weapon2.setAll('exists', false);

};

Weapon.Combo1.prototype.fire = function (source) {

    this.weapon1.fire(source);
    this.weapon2.fire(source);

};

/////////////////////////////////////////////////////
//  A Weapon Combo - ThreeWay, Pattern and Rockets //
/////////////////////////////////////////////////////

Weapon.Combo2 = function (game) {

    this.name = "Combo Two";
    this.weapon1 = new Weapon.Pattern(game);
    this.weapon2 = new Weapon.ThreeWay(game);
    this.weapon3 = new Weapon.Rockets(game);

};

Weapon.Combo2.prototype.reset = function () {

    this.weapon1.visible = false;
    this.weapon1.callAll('reset', null, 0, 0);
    this.weapon1.setAll('exists', false);

    this.weapon2.visible = false;
    this.weapon2.callAll('reset', null, 0, 0);
    this.weapon2.setAll('exists', false);

    this.weapon3.visible = false;
    this.weapon3.callAll('reset', null, 0, 0);
    this.weapon3.setAll('exists', false);

};

Weapon.Combo2.prototype.fire = function (source) {

    this.weapon1.fire(source);
    this.weapon2.fire(source);
    this.weapon3.fire(source);

};



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
    game.load.image('sky', 'assets/sky.png');
    game.load.image('ground', 'assets/platform.png');
    game.load.image('star', 'assets/star.png');
    game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
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
    var ground = platforms.create(0, game.world.height - 64, 'ground');

    //  scale ground
    ground.scale.setTo(2, 2);

    //  ground never moves
    ground.body.immovable = true;

    //  create two ledges
    var ledge = platforms.create(400, 400, 'ground');
    ledge.body.immovable = true;

    ledge = platforms.create(-150, 250, 'ground');
    ledge.body.immovable = true;

    // The player and its settings
    player = game.add.sprite(32, game.world.height - 150, 'dude');

    //  enable physics on player
    game.physics.arcade.enable(player);

    //  add physics attributes to player
    player.body.bounce.y = 0.2;
    player.body.gravity.y = 300;
    player.body.collideWorldBounds = true;

    // add player animation using sprite 
    player.animations.add('left', [0, 1, 2, 3], 10, true);
    player.animations.add('right', [5, 6, 7, 8], 10, true);

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
    }

    //Create Weapons
    weapons.push(new Weapon.SingleBullet(game));
    weapons.push(new Weapon.FrontAndBack(game));
    weapons.push(new Weapon.ThreeWay(game));
    weapons.push(new Weapon.EightWay(game));
    weapons.push(new Weapon.ScatterShot(game));
    weapons.push(new Weapon.Beam(game));
    weapons.push(new Weapon.SplitShot(game));
    weapons.push(new Weapon.Pattern(game));
    weapons.push(new Weapon.Rockets(game));
    weapons.push(new Weapon.ScaleBullet(game));
    weapons.push(new Weapon.Combo1(game));
    weapons.push(new Weapon.Combo2(game));
    currentWeapon = 0;
    for (var i = 1; i < weapons.length; i++)
    {
        weapons[i].visible = false;
    }

    //  The score
    scoreText = game.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });

    //  Our controls.
    cursors = game.input.keyboard.createCursorKeys();
    this.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);
    var changeKey = this.input.keyboard.addKey(Phaser.Keyboard.ENTER);
    changeKey.onDown.add(nextWeapon, this);
}

function update() {

    //  Collide the player and the stars with the platforms
    game.physics.arcade.collide(player, platforms);
    game.physics.arcade.collide(stars, platforms);

    //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
    game.physics.arcade.overlap(player, stars, collectStar, null, this);

    //  Reset the players velocity (movement)
    player.body.velocity.x = 0;

    if (cursors.left.isDown)
    {
        //  Move to the left
        player.body.velocity.x = -150;

        player.animations.play('left');
    }
    else if (cursors.right.isDown)
    {
        //  Move to the right
        player.body.velocity.x = 150;

        player.animations.play('right');
    }
    else
    {
        //  Stand still
        player.animations.stop();

        player.frame = 4;
    }

    if (this.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR))
    {
        weapons[currentWeapon].fire(player);
    }
    
    //  Allow the player to jump if they are touching the ground.
    if (cursors.up.isDown && player.body.touching.down)
    {
        player.body.velocity.y = -350;
    }

}

function collectStar(player, star) {

    // Removes the star from the screen
    star.kill();
    nextWeapon();
    //  Add and update the score
    score += 10;
    scoreText.text = 'Score: ' + score;

}


// This will auto run after this script is loaded

// Run Client. Give leeway of 0.5 second for libraries to load
// vim:ts=4:sw=4:expandtab
