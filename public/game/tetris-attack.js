let clientGame = null;
let serverGame = null;
let player1 = null;
let player2 = null;
let room = window.location.pathname.replace(/^\/([^\/]*).*$/, '$1');

if (room) {
    socket.emit("joinRoom", room);
    setupGame();
}


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
    if(!clientGame.pause && !serverGame.pause){
        clientGame.tick();
        serverGame.tick();
        sendEmitters();
    }
}