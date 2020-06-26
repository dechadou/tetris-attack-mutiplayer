let socket = io();

//Pause & Resume
/*const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
        clientGame.pauseGame();
        serverGame.pauseGame();
        socket.emit('PauseGame');
    } else {
        clientGame.resumeGame();
        serverGame.resumeGame();
        socket.emit('PlayGame');
    }
};
document.addEventListener('visibilitychange', onVisibilityChange, false);

//Game is paused!
socket.on('GamePaused', function(){
   clientGame.pauseGame();
   serverGame.pauseGame();
});
//Game is Resumed!

socket.on('GameResumed', function(){
    clientGame.resumeGame();
    serverGame.resumeGame();
});
*/

/*
On WebSocket connect, setup a new game and let the server know its available.
 */
socket.on('connected', function (playerInfo) {
    // Connected, setup a new game.
    console.log('Player 1 added! ' + playerInfo.playerId);
    clientGame.newGame(GAME_WIDTH, GAME_HEIGHT, GLOBAL.nrBlockSprites, 0);
    player1 = playerInfo;
    sendEmitters('setupGame');
});

/*
Second player is connected, setup its basic info.
 */
socket.on('secondPlayerConnected', function (playerInfo) {
    // Player 2 connected;
    Object.keys(playerInfo).forEach(function (id) {
        if (playerInfo[id].playerId !== socket.id) {
            console.log('Player 2 added! ' + playerInfo[id].playerId);
            player2 = playerInfo[id];
        }
    });
});

/*
Receive Server information for Player 2.
Setup Player2 game and let know the player is ready.
 */
socket.on('serverSetup', function (playerInfo) {
    Object.keys(playerInfo).forEach(function (id) {
        if (playerInfo[id].playerId !== socket.id) {
            console.log('Receiving Server information');
            try {
                serverGame.setupServerGame(JSON.parse(playerInfo[id].blocks), JSON.parse(playerInfo[id].nextLine));
                player2 = playerInfo[id];
                socket.emit('playerReady');
            } catch (e) {
                console.log(e, true);
            }

        }
    });
});
/*
Detect server updates and apply on the server Game.
 */
socket.on('playerUpdated', function (playerInfo) {
    if (playerInfo.playerId !== socket.id) {
        serverGame.updateServerSide(playerInfo);
    }
});
/*
Game is ready to start!
 */
socket.on('readyToStart', function () {
    console.log('Ready to start!!!!');
    create();
});

/*
Win game
 */
socket.on('WinGame', function () {
    serverGame.gameOver();
    clientGame.win();
    player2 = null;
});

/*
Connection lost.
 */
socket.on('disconnect', function (playerId) {
    serverGame.gameOver();
    clientGame.win();
    player2 = null;
});
