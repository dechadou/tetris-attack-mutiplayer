function sendEmitters(emitterName = 'playerUpdate') {
    let blocks = {};
    [...clientGame.blocks].forEach((element, x) => {
        blocks[x] = {};
        [...element].forEach((Block, y) => {
            blocks[x][y] = Block.getData();
        })
    });


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
        'score': clientGame.score,
        'level': clientGame.level
    });

}

