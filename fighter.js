/*=====================================================
  Declared as literal object (All variables are static)	  
  =====================================================*/
var Fighter = {
	HEIGHT : 768,				// height of fighter game window
	WIDTH : 1280,				// width of fighter game window
	PORT : 4344,				// port of fighter game
	FRAME_RATE : 25,			// frame rate of fighter game
	SERVER_NAME : "localhost"	// server name of fighter game
	//SERVER_NAME : "172.28.179.28"	// server name of fighter game
}

// For node.js require
global.Fighter = Fighter;

// vim:ts=4
