var Setting = {
    HEIGHT: 640,					// Height of fighter game window
    WIDTH: 1136,					// Width of fighter game window
    FULL_WIDTH: 2000,               // Full width of the game
    BLOCK_Y:120,                    // Upper block height
    PORT: 3333,					    // Port of fighter game
    FRAME_RATE: 25,				    // Frame rate of fighter game
    MAX_NAME_LENGTH: 15,			// Max name length of player
    START_DELAY: 500,				// Delay for networking start
    LANDSCAPE_ORIENTATION: 90,		// window.orientation value for landscape
    SERVER_NAME : "localhost",      // server name of fighter game
    LOG_INFO : "INFO",              // Log level: info
    LOG_DEBUG : "DEBUG",            // Log level: debug
    log : function(type, msg){      //fucntion for log
        console.log(type + ": " + msg);
    }
};

global.Setting = Setting;
