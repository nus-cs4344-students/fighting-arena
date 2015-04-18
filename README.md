# Fighting-Arena
A 2D multi-player fighting game.

## Description of Game
Fighting Arena is a 2D multi-player fighting game.  During the play of the game, items like boxes, hammers will be falling from the sky randomly and players can pick them up as weapons to fight. Each character player controls will have its own skills and to cast the skills users need to use the keyboard (same as in KOF).

## Installation
Clone the repository to your machine: 

```git clone https://github.com/nus-cs4344-students/fighting-arena.git```

and then go to the repository in your terminal.

### Node.JS
Install Node.js on your machine.

Please refer to the [Node.js installation guide](https://github.com/joyent/node/wiki/Installation).

### Install Node.js Modules
Fighting Arena uses two Node.js modules: ```express``` and ```sockjs```.
#### Install Express
```npm -s install express```

#### Install Sockjs
```npm -s install sockjs```

## Play the Game
Before starting the game, ```Setting.js``` should be configured first.
### Configure Setting.js
Use your favorite editor to open ```Setting.js``` in the repository.

Then change the ```SERVER_NAME``` attribute to your IP address(```server_ip```).

If you do not know how to find your IP address, please follow the links below:

* [Find IP address on Window](http://windows.microsoft.com/en-sg/windows/find-computers-ip-address#1TC=windows-7)
* [Find IP address on Mac OS](http://guides.macrumors.com/IP_Address)
* [Find IP address on Linux](http://www.wikihow.com/Check-Ip-Address-in-Linux)

## Start Fighting Arena

### Start Server
In your teminal, run:

```node server.js```

### Play Game in browser
In your browser, go to:

```http://server_ip:3333/fighter.html```

and play the game.

***Enjoy!***

