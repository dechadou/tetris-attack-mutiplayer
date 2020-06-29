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
    connectLocalPlayer(playerInfo);
});

/*
Second player is connected, setup its basic info.
 */
socket.on('secondPlayerConnected', function (playerInfo) {
    connectServerPlayer(playerInfo);
});

/*
Receive Server information for Player 2.
Setup Player2 game and let know the player is ready.
 */
socket.on('serverSetup', function (playerInfo) {
    setupServerGame(playerInfo);
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
    startCounter();
    //create();
});

/*
Win game
 */
socket.on('WinGame', function () {
    serverGame.gameOver();
    clientGame.win();

});

socket.on('RematchStart', function () {
    connectLocalPlayer(player1);
});

socket.on('HistoricBoardUpdated', function (playerInfo) {
    if (playerInfo.playerId !== socket.id) {
        if (serverGame.historicBoard !== null) {
            serverGame.updateHistoricBoard(playerInfo);
        }
    }
});


/*
Connection lost.
 */
socket.on('disconnect', function (playerId) {
    serverGame.gameOver();
    clientGame.win();
    player2 = null;
});


function connectLocalPlayer(player) {
    // Connected, setup a new game.
    console.log('Player 1 added! ' + player.playerId);
    clientGame.newGame(GAME_WIDTH, GAME_HEIGHT, GLOBAL.nrBlockSprites, 0);
    player1 = player;
    sendEmitters('setupGame');
}

function connectServerPlayer(player) {
    // Player 2 connected;
    Object.keys(player).forEach(function (id) {
        if (player[id].playerId !== socket.id) {
            console.log('Player 2 added! ' + player[id].playerId);
            player2 = player[id];
        }
    });
}

function setupServerGame(player) {
    Object.keys(player).forEach(function (id) {
        if (player[id].playerId !== socket.id) {
            console.log('Receiving Server information');
            try {
                serverGame.setupServerGame(JSON.parse(player[id].blocks), JSON.parse(player[id].nextLine));
                player2 = player[id];
                socket.emit('playerReady');
            } catch (e) {
                console.log(e, true);
            }

        }
    });
}

function startCounter() {
    let counter = 5;
    p1_overlayScreen.style.display = 'flex';
    p2_overlayScreen.style.display = 'flex';
    const p1 = p1_overlayScreen.querySelector('h2.face');
    const p2 = p2_overlayScreen.querySelector('h2.face');
    p1.style.display = 'block';
    p2.style.display = 'block';

    let downloadTimer = setInterval(function () {
        if (counter <= 0) {
            clearInterval(downloadTimer);
            create();
        }
        p1.innerText = counter;
        p2.innerText = counter;
        counter--;
    }, 1000);
}