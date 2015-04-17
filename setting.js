/*=====================================================
 Declared as literal object (All variables are static)
 =====================================================*/
var Setting = {

    HEIGHT: 640,					// Height of fighter game window
    WIDTH: 1136,					// Width of fighter game window
    PORT: 3333,					// Port of fighter game
    FRAME_RATE: 25,				// Frame rate of fighter game
    MAX_NAME_LENGTH: 15,			// Frame rate of fighter game
    START_DELAY: 500,				// Delay to ensure game loads before
    LANDSCAPE_ORIENTATION: 90,		// window.orientation value for landscape
    SERVER_NAME : "192.168.1.100"	// server name of fighter game
    //SERVER_NAME: "localhost"	// server name of fighter game

}

// For node.js require
global.Setting = Setting;

// vim:ts=4
