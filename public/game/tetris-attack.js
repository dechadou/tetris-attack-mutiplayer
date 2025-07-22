let clientGame = null;
let serverGame = null;
let player1 = null;
let player2 = null;
let room = window.location.pathname.replace(/^\/([^\/]*).*$/, '$1');

if (SOLO_MODE) {
    setupSoloGame();
    createSolo();
} else if (room) {
    socket.emit("joinRoom", room);
    setupGame();
}


function setupGame() {
    clientGame = new TaGame('client');
    serverGame = new TaGame('server');
}

function setupSoloGame() {
    clientGame = new TaGame('client');
    clientGame.newGame(GAME_WIDTH, GAME_HEIGHT, GLOBAL.nrBlockSprites, 0);
}

function create() {
    GLOBAL.taGame_list[0] = clientGame;
    GLOBAL.taGame_list[1] = serverGame;

    clientGame.resetLevel();
    serverGame.resetLevel();

    clientGame.resumeGame();
    serverGame.resumeGame();

    MainLoop.setSimulationTimestep(1000 / UPS);
    MainLoop.setUpdate(update).setDraw(render).start();
}

function createSolo() {
    GLOBAL.taGame_list[0] = clientGame;
    clientGame.resetLevel();
    clientGame.resumeGame();

    MainLoop.setSimulationTimestep(1000 / UPS);
    MainLoop.setUpdate(updateSolo).setDraw(render).start();
}

function update() {
    if (!clientGame.pause && (!serverGame || !serverGame.pause)) {
        clientGame.tick();
        if (serverGame) {
            serverGame.tick();
            sendEmitters();
        }
    }
}

function updateSolo() {
    if (!clientGame.pause) {
        clientGame.tick();
    }
}