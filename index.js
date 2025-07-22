const express = require('express');
const path = require('path');
const net = require('net');
const app = express();
const server = require('http').Server(app);

function isPortAvailable(port) {
    return new Promise((resolve) => {
        const testServer = net.createServer();
        testServer.listen(port, (err) => {
            if (err) {
                resolve(false);
            } else {
                testServer.close(() => {
                    resolve(true);
                });
            }
        });
        testServer.on('error', () => {
            resolve(false);
        });
    });
}

async function findAvailablePort(startPort = 8081) {
    let port = startPort;
    while (port < 65535) {
        if (await isPortAvailable(port)) {
            return port;
        }
        port++;
    }
    throw new Error('No available ports found');
}

app
    .use(express.static(path.join(__dirname, 'public')))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', (req, res) => res.render('index'))
    .get('/solo', (req, res) => res.render('game', {solo: true}))
    .get('/:room', (req, res) => res.render('game', {solo: false}));

var io = require('socket.io').listen(server);

if (require.main === module) {
    (async () => {
        const PORT = process.env.PORT || await findAvailablePort();
        server.listen(PORT, () => console.log(`Listening on ${PORT}`));
    })();
}

let maxPlayers = 2;
let players = {};
let currentPlayers = {};
let currentRoomPlayers = {};

io.on('connection', function (socket) {

    socket.on("joinRoom", function (room) {
        socket.join(room);
        players[socket.id] = {
            playerId: socket.id,
            isReady: false,
            room: room,
            rematch: false
            
        };

        if (!currentRoomPlayers.hasOwnProperty(room)) {
            currentRoomPlayers[room] = [];
        }
        currentRoomPlayers[room].push(players[socket.id]);


        if (currentPlayers.hasOwnProperty(room)) {
            currentPlayers[room]++;
        } else {
            currentPlayers[room] = 1;
        }

        console.log(currentPlayers);

        console.log('User ' + socket.id + ' connected to room: ' + room);
        console.log('Users connected: ' + currentPlayers[room]);


        socket.emit('connected', players[socket.id]);

        io.in(room).emit('secondPlayerConnected', currentRoomPlayers[room]);

        socket.on('setupGame', function (data) {
            if (data) {
                console.log(players[socket.id].playerId + ' emitted SetupGame on room ' + room);
                players[socket.id].totalTicks = data.totalTicks;
                players[socket.id].score = data.score;
                players[socket.id].blocks = data.gameBlocks;
                players[socket.id].nextLine = data.nextLine;
                io.in(room).emit('serverSetup', currentRoomPlayers[room]);
            }
        });

        socket.on('playerReady', function () {
            let readyToPlay = true;
            players[socket.id].isReady = true;
            if (currentPlayers[room] === maxPlayers) {
                Object.keys(players).forEach(function (id) {
                    if (!players[id].isReady) {
                        readyToPlay = false;
                    }
                });

                if (readyToPlay) {
                    io.in(room).emit('readyToStart');
                }
            }
        });

        socket.on('mv_left', function (data) {
            socket.in(room).broadcast.emit('server_mv_left', data)
        });
        socket.on('mv_right', function (data) {
            socket.in(room).broadcast.emit('server_mv_right', data)
        });
        socket.on('mv_down', function (data) {
            socket.in(room).broadcast.emit('server_mv_down', data)
        });
        socket.on('mv_up', function (data) {
            socket.in(room).broadcast.emit('server_mv_up', data)
        });
        socket.on('mv_swap', function (data) {
            socket.in(room).broadcast.emit('server_mv_swap', data)
        });
        socket.on('mv_mvpushfast', function (data) {
            socket.in(room).broadcast.emit('server_mvpushfast', data)
        });

        socket.on('PauseGame', function(){
            console.log('pause');
            io.in(room).emit('GamePaused');
        });

        socket.on('PlayGame', function(){
            console.log('resume');
            io.in(room).emit('GameResumed');
        });


        socket.on('playerUpdate', function (data) {
            if (data) {
                players[socket.id].totalTicks = data.totalTicks;
                players[socket.id].score = data.score;
                players[socket.id].blocks = data.gameBlocks;
                players[socket.id].nextLine = data.nextLine;
                players[socket.id].level = data.level;
                socket.in(room).broadcast.emit('playerUpdated', players[socket.id]);
            }
        });

        socket.on('GameOver', function (data) {
            console.log('Game over on room ' + room);
            Object.keys(players).forEach(function (id) {
                players[id].rematch = false;
            });
            socket.in(room).broadcast.emit('WinGame');
        });

        socket.on('PlayerActionedRematch', function(){
            let readyToRematch = true;
            players[socket.id].rematch = true;
            if (currentPlayers[room] === maxPlayers) {
                Object.keys(players).forEach(function (id) {
                    if (!players[id].rematch) {
                        readyToRematch = false;
                    }
                });

                if (readyToRematch) {
                    io.in(room).emit('RematchStart');
                }
            }
        });

        socket.on('HistoricBoardUpdate', function(data){
            players[socket.id].wins = data.wins;
            players[socket.id].lost = data.lost;
            socket.in(room).broadcast.emit('HistoricBoardUpdated', players[socket.id]);
        })

        socket.on('disconnect', function () {
            console.log('User ' + socket.id + ' disconnected');
            delete players[socket.id];
            currentPlayers[room]--;
            if (currentPlayers[room] === 0) {
                console.log('No more users in room ' + currentPlayers[room]);
                delete currentPlayers[room];
            }

            io.emit('disconnect', socket.id);
        });
    });


});


module.exports = app;