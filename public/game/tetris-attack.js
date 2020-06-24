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
                serverGame.newGame(GAME_WIDTH, GAME_HEIGHT, GLOBAL.nrBlockSprites, 1, JSON.parse(playerInfo[id].blocks));
                serverGame.nextLine = serverGame.serverBlocks(6, 1, JSON.parse(playerInfo[id].nextLine));
                for (var x = 0; x < serverGame.width; x++) {
                    serverGame.nextLine[x][0].render(true)
                }
                player2 = playerInfo[id];
                document.querySelector('#player2').innerHTML = 'player 2';
                socket.emit('playerReady');
            } catch (e) {
                if (e instanceof SyntaxError) {
                    console.log(e, true);
                } else {
                    console.log(e, false);
                }
            }

        }
    });
});
socket.on('playerUpdated', function (playerInfo) {
    if (playerInfo.playerId !== socket.id) {
        const scoreText = document.querySelector('#scoreText-1');
        scoreText.innerHTML = playerInfo.score;
        serverGame.nextLine = serverGame.serverBlocks(6, 1, JSON.parse(playerInfo.nextLine));
        for (var x = 0; x < serverGame.width; x++) {
            serverGame.nextLine[x][0].render(true)
        }
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
            blocks[x][y] = {};
            blocks[x][y]['animation_counter'] = Block.animation_counter;
            blocks[x][y]['animation_state'] = Block.animation_state;
            blocks[x][y]['chain'] = Block.chain;
            blocks[x][y]['counter'] = Block.counter;
            blocks[x][y]['explode_counter'] = Block.explode_counter;
            blocks[x][y]['garbage'] = Block.garbage;
            blocks[x][y]['state'] = Block.state;
            blocks[x][y]['x'] = Block.x;
            blocks[x][y]['y'] = Block.y;
            blocks[x][y]['sprite'] = Block.sprite;
        })
    });


    //Emit next line
    let nextLine = [];
    [...clientGame.nextLine].forEach((element, x) => {
        nextLine[x] = {};
        [...element].forEach((Block, y) => {
            nextLine[x][y] = {};
            nextLine[x][y]['animation_counter'] = Block.animation_counter;
            nextLine[x][y]['animation_state'] = Block.animation_state;
            nextLine[x][y]['chain'] = Block.chain;
            nextLine[x][y]['counter'] = Block.counter;
            nextLine[x][y]['explode_counter'] = Block.explode_counter;
            nextLine[x][y]['garbage'] = Block.garbage;
            nextLine[x][y]['state'] = Block.state;
            nextLine[x][y]['x'] = Block.x;
            nextLine[x][y]['y'] = Block.y;
            nextLine[x][y]['sprite'] = Block.sprite;
        })
    });

    socket.emit(emitterName, {
        'totalTicks': clientGame.totalTicks,
        'gameBlocks': JSON.stringify(blocks),
        'nextLine': JSON.stringify(nextLine),
        'score': clientGame.score
    });


}
