// private variables

function FighterClient(){

    var socket;         // socket used to connect to server 
    var cursors;
    var stars;
    var bullets;
    var fireRate = 100;
    var nextFire = 0;
    //var score = 0;
    //var scoreText;
    var currentWeapon = 0 ;
    var players = [];
    var fighters = [];
    var serverMsg;
    var hasPlayed = false;
    var game ;
    var connectedToServer = false;
    var vxOfPlayers = {};
    var vyOfPlayers = {};
    var hitStatus = {};
    var directions = {};
    var numOfPlayers = 0;
    var myPID;
    var injuryRecovered = false;
    var hitpointSprite = [];
    var fullHP = 100;
    var hitpointBarScale = 0.35;
    var isTouchingHit = false;
    var isTouchingLeft = false;
    var isTouchingRight = false;
    var isTouchingUp = false;
    var isTouchingDown = false;

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

    function addController() {
        if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
            GameController.init({
                left: {
                    type: 'joystick',
                    joystick: {
                          touchEnd: function() {
                            isTouchingUp = false;
                            isTouchingDown = false;
                            isTouchingRight = false;
                            isTouchingLeft = false;
                          },
                          touchMove: function( details ) {
                            if (details.dx > 0) {
                                isTouchingLeft = false;
                                isTouchingRight = true;
                            } else if(details.dx < 0){
                                isTouchingLeft = true;
                                isTouchingRight = false;
                            }
                            if (details.dy > 0){
                                isTouchingUp = true;
                                isTouchingDown = false;
                            } else if (details.dy < 0){
                                isTouchingUp = false;
                                isTouchingDown = true;
                            }
                            // console.log( details.dy );
                            // console.log( details.max );
                            // console.log( details.normalizedX );
                            // console.log( details.normalizedY );
                          }
                        }
                },
                right: {
                    position: {
                        right: '5%'
                    },
                    type: 'buttons',
                    buttons: [
                    {
                        label: 'Hit', fontsize: 13, touchStart: function() {
                            isTouchingHit = true;
                        }, touchEnd: function(){
                            isTouchingHit = false;
                        }
                    },
                    false, false, false
                    ]
                }
            });
        }
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
            game = new Phaser.Game(Setting.WIDTH, Setting.HEIGHT, Phaser.CANVAS, '', { preload: preload, create: create, update: update });
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
                        connectedToServer = true;
                        myPlayer = players[message.pid];
                        myPID = message.pid;
                        break;
                    case "update":
                        if(!(message.pid in players)){
                            //console.log("pid:"+message.pid);
                            createPlayer(message.pid,message.x,message.y,1);
                        }else{
                            var id = message.pid;
                            fighters[id].x = message.x;
                            fighters[id].y = message.y;
                            fighters[id].vx = message.vx;
                            fighters[id].vy = message.vy;
                            fighters[id].facingDirection = message.facingDirection;
                            fighters[id].isHitting = message.isHitting;
                            fighters[id].isInjured = message.injuryStatus;
                            fighters[id].hp = message.hp;
                        }
                        break;
                    case "updateVelocity":
                        var t = message.timestamp;
                        if (t < lastUpdateVelocityAt)
                            break;
                        var distance = playArea.height - Ball.HEIGHT - 2 * Paddle.HEIGHT;
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
        game.load.image('hitpoint', 'assets/hitpoint.png');
        game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
        //-1 is for frameMax 5 is for margin, 0 for spacing
        //game.load.spritesheet('louis','assets/louis.png',frameWidth, frameHeight, -1,1,0);
        game.load.spritesheet('louis','assets/characters/louis_lowres.png',32, 32.5, -1,0.5,0);

    }

    function create() {

        // phaser physics world 
        game.physics.startSystem(Phaser.Physics.ARCADE);
        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
 
        //have the game centered horizontally
     
        this.scale.pageAlignHorizontally = true;
     
        this.scale.pageAlignVertically = true;
     
        //screen size will be set automatically
     
        this.scale.setScreenSize(true);

        //add button
        //button = game.add.button(game.world.centerX - 95, 460, 'button', openWindow, this, 2, 1, 0);

        // add sky 
        game.add.sprite(0, 0, 'sky');
        var positions = [[Setting.WIDTH/4, Setting.HEIGHT/4], [Setting.WIDTH/4, Setting.HEIGHT*3/4],
        [Setting.WIDTH*3/4, Setting.HEIGHT*3/4],[Setting.WIDTH*3/4, Setting.HEIGHT/4]];
        for(var i=0;i<4;i++){
            var newPlayer = game.add.sprite(positions[i][0], positions[i][1], 'louis');
            var newHp = game.add.sprite(positions[i][0], positions[i][1], 'hitpoint');

            newPlayer.scale.setTo(2,2);
            newHp.scale.setTo(hitpointBarScale, hitpointBarScale);

            //  enable physics on player
            game.physics.arcade.enable(newPlayer);
            game.physics.arcade.enable(newHp);

            //  add physics attributes to player
            newPlayer.body.collideWorldBounds = true;
            newHp.body.collideWorldBounds = true;

            //player.animations.add('rightWalk', [13,14,15,16,17], 10, true);
            newPlayer.animations.add('rightWalk', [13,14,15,16], 10, true);
            newPlayer.animations.add('leftWalk', [7,6,5,4,3], 10, true);
            newPlayer.animations.add('leftHit',[28,27,26,25,24,23,22,21,20],10,true);
            newPlayer.animations.add('rightHit',[29,30,31,32,33,34,35,36,37],10,true);
            newPlayer.animations.add('rightHitted',[63,64,65,66,67,67,67,68,69,69,69,69,69],8,false);
            newPlayer.animations.add('leftHitted',[62,61,60,59,58,58,58,57,56,56,56,56,56],8,false);
            newPlayer.frame = 9;
            players[i] = newPlayer;
            hitpointSprite[i] = newHp;
            fighters[i] = new Fighter(positions[i][0], positions[i][1], 0);
            newPlayer.visible = false;
            newHp.visible = false;
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

        //  The # of players
        num_text = game.add.text(16, 16, '# of players: '+ numOfPlayers, { fontSize: '16px', fill: '#000' });

        //  Our controls.
        cursors = game.input.keyboard.createCursorKeys();
        this.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);
        this.input.keyboard.addKeyCapture([Phaser.Keyboard.D]);
        this.input.keyboard.addKeyCapture([Phaser.Keyboard.A]);
        var changeKey = this.input.keyboard.addKey(Phaser.Keyboard.ENTER);
        //    changeKey.onDown.add(nextWeapon, this);
        addController();
    }

    function createPlayer(pid,x,y,direction) {
        console.log(players);
        var p = players[pid];
        p.body.x = x;
        p.body.y = y;
        fighters[pid].facingDirection = direction;
        p.visible = true;
        console.log("created player of "+pid);
        console.log("local postion updated"+x+" "+" "+y);
        numOfPlayers++;

    }

    function deletePlayer(pid){
        console.log("deleted player of "+pid);
        players[pid].visible = false;
        numOfPlayers--;
    }

    function renderGame(){
        //here is for rendering
        num_text.setText('# of players: '+ numOfPlayers);
        for(var i=0;i<players.length;i++){
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
            
            //console.log(fighters[i].hp);
            //console.log(fighters[i].isInjured);
            //console.log(vx+"vy:"+vy);
            if(vx!==undefined && vy!==undefined){
                player.visible = true;
                healthBar.visible = true;
                player.body.velocity.x = 0;
                player.body.velocity.y = 0;
                healthBar.body.velocity.x = 0;
                healthBar.body.velocity.y = 0;

                if(hp <= 0){
                    player.animations.stop();
                    player.frame = direction==="right"?57:68;
                }
                else{

                    if(isInjured){
                        if(direction==="left"){
                            player.animations.play('leftHitted');
                        }else if(direction==="right"){
                            player.animations.play('rightHitted');
                        }
                        setTimeout(function() {injuryRecovered=true;}, 1100);
                    }else if(isHitting){
                        if(direction==="left"){
                            player.animations.play('leftHit');
                        }else if(direction==="right"){
                            player.animations.play('rightHit');
                        }
                    }else{
                        if(vx>0){
                            player.animations.play("rightWalk");
                        }else if(vx<0){
                            player.animations.play("leftWalk");
                        }else{
                            player.animations.stop();
                            player.frame = direction==="left"?9:10;
                        }
                    }
                    healthBar.body.velocity.x = vx;
                    healthBar.body.velocity.y = vy;

                    player.body.velocity.x = vx;
                    player.body.velocity.y = vy;
                }
                if(hp>=0)
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

        if(connectedToServer){
            var myPlayer = players[myPID];
            var myFighter = fighters[myPID];
            if(injuryRecovered){
                myFighter.isInjured = false;
                injuryRecovered = false;
            }
            var facingDirection = myFighter.facingDirection;
            if(cursors.up.isDown || isTouchingUp){
                vy = -150;
            }else if(cursors.down.isDown || isTouchingDown){
                vy = 150;
            }
            if (cursors.left.isDown || isTouchingLeft){
                vx = -150;
                facingDirection = "left";
            }else if (cursors.right.isDown || isTouchingRight){
                vx = 150;
                facingDirection = "right";
            }
            if(this.input.keyboard.isDown(Phaser.Keyboard.D) || isTouchingHit){
                isHitting= true;
            }

            if(myFighter.hp > 0){
                sendToServer({
                    type:"move",
                    x:myPlayer.body.x,
                    y:myPlayer.body.y,
                    vx:vx,
                    vy:vy,
                });

                sendToServer({
                    type:"attack",
                    isInjured:myFighter.isInjured,
                    isHitting:isHitting,
                    facingDirection:facingDirection
                });
            }
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
        //score += 10;
        //scoreText.text = 'Score: ' + score;

    }

    this.start = function (){
        initNetwork();
    }
    // This will auto run after this script is loaded

    // Run Client. Give leeway of 0.5 second for libraries to load
    // vim:ts=4:sw=4:expandtab

}

var client = new FighterClient();
if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    //if mobile, check device orientation
    if (window.orientation === 90) {
        setTimeout(function() {client.start();}, 500);
    }
    $(window).on("orientationchange",function(event){
        if(window.orientation === 90){
            setTimeout(function() {client.start();}, 500);
        }
    });
} else { //starts otherwise
    setTimeout(function() {client.start();}, 500);
}
