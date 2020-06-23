var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);



app.use('/static', express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});
app.get('/:room', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});


let maxPlayers = 2;
let players = {};
let currentPlayers = {};

io.on('connection', function (socket) {

    socket.on("joinRoom", function (room) {
        socket.join(room);
        // create a new player and add it to our players object
        players[socket.id] = {
            playerId: socket.id,
            isReady: false,
        };

        if(currentPlayers.hasOwnProperty(room)){
            currentPlayers[room] ++;
        }else{
            currentPlayers[room] = 1;
        }

        console.log(currentPlayers);

        console.log('User ' + socket.id + ' connected to room: ' + room);
        console.log('Users connected: ' + currentPlayers[room]);


        //let the client know that it connected.
        socket.emit('connected', players[socket.id]);

        //Let the other clients know that this player connected, and also if there was already one player connected
        io.in(room).emit('secondPlayerConnected', players);

        socket.on('setupGame', function (data) {
            if (data) {
                console.log(players[socket.id].playerId + ' emitted SetupGame on room '+room);
                players[socket.id].totalTicks = data.totalTicks;
                players[socket.id].score = data.score;
                players[socket.id].blocks = data.gameBlocks;
                players[socket.id].nextLine = data.nextLine;
                io.in(room).emit('serverSetup', players);
            }
        });

        //if both players are connected we let both know its ready.
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

        socket.on('playerUpdate', function (data) {
            if (data) {
                players[socket.id].totalTicks = data.totalTicks;
                players[socket.id].score = data.score;
                players[socket.id].blocks = data.blocks;
                players[socket.id].nextLine = data.nextLine;
                socket.in(room).broadcast.emit('playerUpdated', players[socket.id]);
            }
        });

        socket.on('GameOver', function(data){
           console.log('Game over on room '+ room);
           socket.in(room).broadcast.emit('GameOver');
        });

        // when a player disconnects, remove them from our players object
        socket.on('disconnect', function () {
            console.log('User ' + socket.id + ' disconnected');
            // remove this player from our players object
            delete players[socket.id];
            currentPlayers[room]--;
            if(currentPlayers[room] === 0){
                console.log('No more users in room '+currentPlayers[room]);
                delete currentPlayers[room];
            }

            // emit a message to all players to remove this player
            io.emit('disconnect', socket.id);
        });
    });



});

server.listen(8081, function () {
    console.log(`Listening on ${server.address().port}`);
});