/*
 * fighter.js
 * Fighter object
 */

"use strict";
function Fighter(xPos, yPos, status) {
    // Public variables
    this.x;
    this.y;
    this.vx;
    this.vy;
    this.hp;
    this.status;
    this.isHitting;
    this.facingDirection;
    this.isInjured;
    // Constructor
    this.hasteCoef = 1;
    this.hp = 1000;
    this.x = xPos;
    this.y = yPos;
    this.status = status;
    this.facingDirection = "right";
    this.isInjured = false;
    this.lastHit;
}

// Static variables
Fighter.WIDTH = 32;
Fighter.HP = 1000;
Fighter.HEIGHT = 32;

/*
 * public method: move(newx,newy)
 *
 * Move the fighter to new (x,y) position, newx,newy.  Check for
 * boundary conditions.
 * We set the upper left of the frame as 0,0
 */
Fighter.prototype.move = function (newx, newy) {
    if (newx < 0)
        this.x = 0;
    else if (newx > Setting.WIDTH - Fighter.WIDTH)
        this.x = Setting.WIDTH - Fighter.WIDTH;
    else
        this.x = newx;
    if (newy < 0)
        this.y = 0;
    else if (newy > Setting.HEIGHT - Fighter.HEIGHT)
        this.y = Setting.HEIGHT - Fighter.HEIGHT;
    else
        this.y = newy;

};

/*
 * public method: reset()
 *
 * Reset the fighter hp
 */
Fighter.prototype.reset = function () {
    this.hp = 1000;
};


/*
 * public method: haste()
 *
 * Speed up player
 */
Fighter.prototype.haste = function () {
    this.hasteCoef = 1.5;
};

/*
 * public method: resetVelocity()
 *
 * Reset player velocity
 */
Fighter.prototype.resetVelocity = function () {
    this.hasteCoef = 1;
};


/*
 * public method: getHitted(damage)
 *
 * player takes damage
 */
Fighter.prototype.getHitted = function (damage) {
    this.hp -= damage;
    if (this.hp <= 0) this.hp = 0;
    this.isInjured = true;
};


global.Fighter = Fighter;
