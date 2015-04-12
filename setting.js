/*=====================================================
  Declared as literal object (All variables are static)	  
  =====================================================*/
var Setting = {
	HEIGHT : 768,				// height of fighter game window
	WIDTH : 1280,				// width of fighter game window
	PORT : 3333,				// port of fighter game
	FRAME_RATE : 25,			// frame rate of fighter game
	SERVER_NAME : "192.168.1.105"	// server name of fighter game
	//SERVER_NAME : "localhost"	// server name of fighter game
}

// For node.js require
global.Setting = Setting;

// vim:ts=4
