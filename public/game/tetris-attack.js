let socket = io();
let clientGame = null;
let serverGame = null;
let player1 = null;
let player2 = null;
let room = window.location.pathname.replace(/^\/([^\/]*).*$/, '$1');


if (room) {
    socket.emit("joinRoom", room);
    setupGame();
}

socket.on('connected', function (playerInfo) {
    // Connected, setup a new game.
    console.log('Player 1 added! ' + playerInfo.playerId);
    clientGame.newGame(GAME_WIDTH, GAME_HEIGHT, GLOBAL.nrBlockSprites, 0);
    player1 = playerInfo;
    sendEmitters('setupGame');
});
socket.on('secondPlayerConnected', function (playerInfo) {
    // Player 2 connected;
    Object.keys(playerInfo).forEach(function (id) {
        if (playerInfo[id].playerId !== socket.id) {
            console.log('Player 2 added! ' + playerInfo[id].playerId);
            player2 = playerInfo[id];
        }
    });
});
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
socket.on('playerUpdated', function (playerInfo) {
    if (playerInfo.playerId !== socket.id) {
        serverGame.updateServerSide(playerInfo);
    }
});
socket.on('readyToStart', function () {
    console.log('Ready to start!!!!');
    create();
});

socket.on('WinGame', function () {
    serverGame.gameOver();
    clientGame.win();
    player2 = null;
});

socket.on('disconnect', function (playerId) {
    serverGame.gameOver();
    clientGame.win();
    player2 = null;
});


function setupGame() {
    clientGame = new TaGame('client');
    serverGame = new TaGame('server');
}


function create() {
    //Init Game
    GLOBAL.taGame_list[0] = clientGame;
    GLOBAL.taGame_list[1] = serverGame;

    MainLoop.setSimulationTimestep(1000 / UPS);
    MainLoop.setUpdate(update).setDraw(render).start();
}

function update() {
    clientGame.tick();
    serverGame.tick();
    sendEmitters();
}



function sendEmitters(emitterName = 'playerUpdate') {
    // Emit block layout
    let blocks = {};
    [...clientGame.blocks].forEach((element, x) => {
        blocks[x] = {};
        [...element].forEach((Block, y) => {
            blocks[x][y] = Block.getData();
        })
    });


    //Emit next line
    let nextLine = {};
    [...clientGame.nextLine].forEach((element, x) => {
        nextLine[x] = {};
        [...element].forEach((Block, y) => {
            nextLine[x][y] = Block.getData();
        })
    });


    socket.emit(emitterName, {
        'totalTicks': clientGame.totalTicks,
        'gameBlocks': JSON.stringify(blocks),
        'nextLine': JSON.stringify(nextLine),
        'score': clientGame.score
    });


}
