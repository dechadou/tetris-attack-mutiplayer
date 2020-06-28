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

