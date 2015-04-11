/*
 * Paddle.js
 * Implementation of the paddle objects in Pong.
 * Assignment 2 for CS4344, AY2013/14.
 * Modified from Davin Choo's AY2012/13 version.
 *
 * Changes from AY2012/13:
 *  - Added acceleration 
 *
 * Usage: 
 *   require('paddle.js') in both server and client.
 */

// enforce strict/clean programming
"use strict"; 

function Fighter(xPos,yPos,status){
	// Public variables
	this.x;
	this.y;
    this.vx;
    this.vy; 
    this.hp;
    this.status; 

	// Constructor
	var that = this; 
	this.hp = 100;
	this.x = xPos;
	this.y = yPos;
    this.vx = 150; // scaling factor is 10
    this.vy = 1;
    this.status = status;
}

// Static variables
Fighter.WIDTH = 32;
Fighter.HEIGHT =32;
/*
 * public method: move(newx,newy)
 *
 * Move the fighter to new (x,y) position, newx,newy.  Check for
 * boundary conditions.
 * We set the upper left of the frame as 0,0
 */
Fighter.prototype.move = function(newx,newy){
	if (newx < 0)
		this.x = 0;
	else if (newx > Setting.WIDTH - Fighter.WIDTH)
		this.x = Setting.WIDTH-Fighter.WIDTH;
	else
		this.x = newx;
	if(newy<0)
		this.y=0
	else if (newy > Setting.HEIGHT-Fighter.HEIGHT)
		this.y = Setting.HEIGHT-Fighter.HEIGHT;
	else 
		this.y = newy;

	console.log("x:" + this.x + " y:" + this.y);
}

/*
 * public method: moveOneStepLeft()
 *
 * Move the fighter to new x-position by calculating
 * the velocity.
 */
Fighter.prototype.moveOneStepLeft = function() {
	var newx = this.x - this.vx; // 10 is the "scaling factor"
    this.move(newx,this.y);
}

/*
 * public method: moveOneStepRight()
 *
 * Move the fighter to new x-position by calculating
 * the velocity.
 */
Fighter.prototype.moveOneStepRight = function() {
	var newx = this.x + this.vx; // 10 is the "scaling factor"
    this.move(newx,this.y);
}

/*
 * public method: moveOneStepUp()
 *
 * Move the fighter to new y-position by calculating
 * the velocity.
 */
Fighter.prototype.moveOneStepUp = function() {
	var newy = this.y - this.vy; // 10 is the "scaling factor"
    this.move(this.x,newy);
}

/*
 * public method: moveOneStepDown()
 *
 * Move the fighter to new y-position by calculating
 * the velocity.
 */
Fighter.prototype.moveOneStepDown = function() {
	var newy = this.y + this.vy; // 10 is the "scaling factor"
    this.move(this.x,newy);
}

/*
 * public method: reset()
 *
 * Reset the position of paddle
 */
Fighter.prototype.reset = function() {
	this.hp = 100;
}

/*
 * public method: isAtLeft()
 * public method: isAtBottom()
 *
 * Return true iff the paddle is at the top (and bottom) respectively
 */
// Paddle.prototype.isAtLeftTop = function() {
// 	return (this.y < pong.HEIGHT/2);
// }
// Paddle.prototype.isAtLeftBottom = function() {
// 	return (this.y > Pong.HEIGHT/2);
// }
// Paddle.prototype.isAtRightTop = function() {
// 	return (this.y < Pong.HEIGHT/2);
// }
// Paddle.prototype.isAtRightTop = function() {
// 	return (this.y < Pong.HEIGHT/2);
// }


// For node.js require
global.Fighter = Fighter;

// vim:ts=4:sw=4:expandtab
