class TaGame {
    constructor(type) {
        this.type = type;
        this.mySelf = this;
        this.index = null;
        this.gameWidth = null;
        this.gameHeight = null;
        this.width = null;
        this.height = null;
        this.nr_blocks = null;
        this.blocks = null;
        this.nextLine = null;
        this.combo = null;
        this.chain = null;
        this.config = null;
        this.command = null;
        this.cursor = null;
        this.serverCursor = null;
        this.wall = null;
        this.score = 0;
        this.scoreText = null;
        this.pushTime = 0;
        this.pushCounter = 0;
        this.totalTicks = 0;
        this.canvas = null;
        this.ctx = null;
        this.gameDom = null;
        this.scoreBoard = null;
        this.highScore = null;
        this.overlayScreen = null;
        this.serverData = null;
        this.player1 = null;
        this.player2 = null;
        this.level = 1;
        this.levelText = null;
    }

    /* Initializes a new game.
     *
     * width is the width of the blocks array.
     * height is the height of the blocks array.
     * nr_blocks is the number of different block sprites to be used.
     */
    newGame(width, height, nr_blocks, index, serverData) {
        console.log('start ' + this.type + ' game');
        this.index = index;
        this.serverData = serverData;
        this.drawGame();


        this.width = width;
        this.height = height;
        this.gameHeight = (height + 1) * SQ;
        this.gameWidth = width * SQ;

        this.nr_blocks = nr_blocks;
        if (this.type === 'client') {
            this.blocks = this.newBlocks(width, height);
        }
        if (this.type === 'server') {
            this.blocks = this.serverBlocks(width, height, this.serverData)
        }
        this.fillBlocks(this.blocks, width, 4);

        if (this.type === 'client') {
            this.nextLine = this.newBlocks(width, 1);
        }
        if (this.type === 'server') {
            this.nextLine = this.serverBlocks(width, 1, this.serverData);
        }
        this.fillBlocks(this.nextLine, width, 1);

        if (this.type === 'client') {
            this.cursor = new Cursor(this.canvas, this.ctx);
            this.cursor.init(this.mySelf);
        }
        if (this.type === 'server') {
            this.serverCursor = new Cursor(this.canvas, this.ctx);
            this.serverCursor.init(this.mySelf);
        }

        this.chain = 0;
        this.combo = [];
        this.pushTime = PUSHTIME;
        this.pushCounter = this.pushTime;

        this.score = 0;

        if (ENABLE_HIGHSCORE) {
            getHighScore();
        }
        this.wall = new Block(this.ctx);
        this.wall.initWall(this.mySelf);

        this.updateNeighbors();
    };


    drawGame() {
        this.gameDom = document.getElementById('game-' + this.index);
        this.canvas = document.getElementById('tetris-canvas-' + this.index);
        if (this.type === 'client') {
            this.scoreBoard = document.getElementById('scoreText-' + this.index);
        }

        this.player1 = document.getElementById('player1');
        this.player2 = document.getElementById('player2');
        this.highScore = document.getElementById('highScore-' + this.index);
        this.overlayScreen = document.getElementById('overlayScreen-' + this.index);
        this.levelText = document.getElementById('level-' + this.index);

        this.canvas.height = SQ * (GAME_HEIGHT + 1) * SCALE;
        this.canvas.width = SQ * GAME_WIDTH * SCALE;
        this.gameDom.style.width = this.canvas.width + 20;
        this.gameDom.style.height = this.canvas.height + 30;

        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.scale(SCALE, SCALE);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px arial';
        this.ctx.fillRect(0, 0, SQ * GAME_WIDTH, SQ * (GAME_HEIGHT + 1));

        this.loadSprites(BLOCKS, CURSORS);

        if (ENABLE_HIGHSCORE) {
            this.highScore.textContent = 'HighScore: ' + localStorage.getItem(HIGHSCORE);
        }

    };

    loadSprites(blocks, cursors) {
        for (let i = 1; i <= blocks.names.length; i++) {
            blocks.sprites[i] = new Image();
            blocks.sprites[i].src = 'sprites/' + blocks.names[i - 1] + '.png';
        }
        GLOBAL.nrBlockSprites = blocks.names.length;

        for (let i = 1; i <= cursors.names.length; i++) {
            cursors.sprites[i] = new Image();
            cursors.sprites[i].src = 'sprites/' + cursors.names[i - 1] + '.png';
        }
        GLOBAL.nrCursorSprites = cursors.names.length;
    }

    /* Adds a new line of blocks to the bottom of the grid and pushes the rest
     * up. If there is not enough room a the top, the game will game-over.
     *
     * Returns 1 if succesfull.
     */
    push() {
        if (this.type === 'client') {
            if (this.isDanger(1)) {
                this.gameOver();
                socket.emit('GameOver');
                return 0;
            }

            var blocks = this.newBlocks(this.width, this.height);
        }
        if (this.type === 'server') {
            var blocks = this.serverBlocks(this.width, this.height, this.serverData);
        }
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height - 1; y++) {
                blocks[x][y + 1] = this.blocks[x][y];
            }
            this.blocks[x][this.height - 1].erase();
            blocks[x][0] = this.nextLine[x][0];
        }
        this.blocks = blocks;
        if (this.type === 'client') {
            this.nextLine = this.newBlocks(6, 1);
        }
        if (this.type === 'server') {
            this.nextLine = this.serverBlocks(6, 1, this.serverData);
        }
        this.fillBlocks(this.nextLine, 6, 1);
        if (this.type === 'client') {
            if (this.cursor.y < this.height - 1)
                this.cursor.y++;
        }

        return 1;
    }

    pushTick(count) {
        if (this.chain)
            return;

        this.pushCounter -= count;
        if (this.pushCounter <= 0) {
            this.pushCounter = this.pushTime;
            this.score += this.push();
        }
    };

    pushFast() {
        this.pushTick(100);
        if (this.type === 'client') {
            socket.emit('mv_mvpushfast');
        }
    };

    /* Ends the current game.
     */
    gameOver() {
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                if (this.blocks[x][y].sprite) {
                    MainLoop.stop();
                }
            }
        }
        this.pushCounter = 0;
        this.canvas.remove();
        this.player2.innerHTML = 'wiiinner';
        this.player1.innerHTML = 'loooser';
        this.overlayScreen.style.display = "flex";
    };

    win() {
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                if (this.blocks[x][y].sprite) {
                    MainLoop.stop();
                }
            }
        }
        this.pushCounter = 0;
        this.canvas.remove();
        this.overlayScreen.style.display = "flex";
        this.player1.innerHTML = 'wiiinner';
        this.player2.innerHTML = 'loooser';
        this.overlayScreen.innerHTML = "<h2 class=\"text-white my-auto\">:)</h2>";
    };

    /* Create a grid of block objects.
     *
     * width is the width of the grid.
     * height is the height of the grid.
     * returns the grid.
     */
    newBlocks(width, height) {
        var blocks = new Array(width);
        for (var x = 0; x < width; x++) {
            blocks[x] = new Array(height);
            for (var y = 0; y < height; y++) {
                blocks[x][y] = new Block(this.ctx);
                blocks[x][y].init(this.mySelf, x, y);
            }
        }
        return blocks;
    };

    serverBlocks(width, height, serverBlocks) {
        var blocks = new Array(width);
        for (var x = 0; x < width; x++) {
            blocks[x] = new Array(height);
            for (var y = 0; y < height; y++) {
                blocks[x][y] = new Block(this.ctx);
                blocks[x][y].init(
                    this.mySelf,
                    serverBlocks[x][y].x,
                    serverBlocks[x][y].y,
                    serverBlocks[x][y].animation_counter,
                    serverBlocks[x][y].animation_state,
                    serverBlocks[x][y].counter,
                    serverBlocks[x][y].state,
                    serverBlocks[x][y].chain,
                    serverBlocks[x][y].explode_counter,
                    serverBlocks[x][y].garbage,
                    serverBlocks[x][y].sprite
                );
            }
        }
        return blocks;
    };

    /* Fills a specified portions of a block grid with random block sprites.
     *
     * blocks is the grid to be filled
     * width is the width of the portion to fill
     * height is the height of the portion to fill
     */
    fillBlocks(blocks, width, height) {
        for (var x = 0; x < width; x++) {
            for (var y = 0; y < height; y++) {
                blocks[x][y].newBlock();
            }
        }
    }

    /* Updates the neighbor references in each block in the grid.
     */
    updateNeighbors() {
        var block;
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                block = this.blocks[x][y];

                if (x > 0) {
                    block.left = this.blocks[x - 1][y];
                } else {
                    block.left = this.wall;
                }

                if (x < this.width - 1) {
                    block.right = this.blocks[x + 1][y];
                } else {
                    block.right = this.wall;
                }

                if (y > 0) {
                    block.under = this.blocks[x][y - 1];
                } else {
                    block.under = this.wall;
                }

                if (y < this.height - 1) {
                    block.above = this.blocks[x][y + 1];
                } else {
                    block.above = this.wall;
                }
            }
        }
    }

    /* Updates the state of the grid.
     * Blocks are only dependent on the state of their under-neighbor, so
     * this can be done from the bottom up.
     */
    updateState() {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                this.blocks[x][y].updateState();
                this.blocks[x][y].x = x;
                this.blocks[x][y].y = y;
            }
        }
    }

    updateServerState(blocks) {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                this.blocks[x][y].updateServerState(blocks[x][y].animation_counter, blocks[x][y].animation_state, blocks[x][y].explode_counter, blocks[x][y].counter, blocks[x][y].state, blocks[x][y].chain, blocks[x][y].x, blocks[x][y].y);
                //this.blocks[x][y].x = x;
                //this.blocks[x][y].y = y;
            }
        }
    }

    /* Update the combos and chain for the entire grid.
     *
     * Returns [combo, chain] where
     * combo is the amount of blocks participating in the combo
     * chain is whether a chain is currently happening.
     */
    updateCnc() {
        var combo;
        var chain = false;

        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                if (this.blocks[x][y].cnc())
                    chain = true;
            }
        }
        this.combo.sort(function (a, b) {
            if (a.y < b.y)
                return 1;
            if (a.y > b.y)
                return -1;
            if (a.y == b.y) {
                if (a.x > b.x)
                    return 1;
                if (a.x < b.x)
                    return -1;
            }
            return 0;
        });

        combo = this.combo.length;
        let block;
        while ((block = this.combo.pop()) != undefined) {
            block.state = CLEAR;
            block.counter = CLEAREXPLODETIME * combo + CLEARBLINKTIME + CLEARPAUSETIME;
            block.animation_state = ANIM_CLEAR_BLINK;
            block.animation_counter = ANIM_CLEARBLINKTIME;
            block.explode_counter = (this.combo.length + 1) * CLEAREXPLODETIME;
        }


        return [combo, chain];
    }

    /* Swaps two blocks at location (x,y) and (x+1,y) if swapping is possible
     */
    swap(x, y) {
        if (!this.blocks[x][y].isSwappable()
            || !this.blocks[x + 1][y].isSwappable())
            return;
        this.blocks[x][y].swap();
    }

    /* Checks if the current chain is over.
     * returns a boolean
     */
    chainOver() {
        var chain = true;
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                if (this.blocks[x][y].chain) {
                    chain = false;
                }
            }
        }
        return chain;
    }

    /* Converts an amount of blocks in a combo to the corresponding score
     * combo is an int
     * returns a int as score
     */
    comboToScore(combo) {
        switch (combo) {
            case 4:
                return 20;
            case 5:
                return 30;
            case 6:
                return 50;
            case 7:
                return 60;
            case 8:
                return 70;
            case 9:
                return 80;
            case 10:
                return 100;
            case 11:
                return 140;
            case 12:
                return 170;
            default:
                return 0;
        }
    }

    /* Converts the lenght of a chain to the corresponding score
     * chain is an int
     * returns a int as score
     */
    chainToScore(chain) {
        switch (chain) {
            case 2:
                return 50;
            case 3:
                return 80;
            case 4:
                return 150;
            case 5:
                return 300;
            case 6:
                return 400;
            case 7:
                return 500;
            case 8:
                return 700;
            case 9:
                return 900;
            case 10:
                return 1100;
            case 11:
                return 1300;
            case 12:
                return 1500;
            case 13:
                return 1800;
            default:
                return 0;
        }
    }

    /* Checks if any block sprites are close to the top of the grid.
     *
     * height is the distance to the top.
     * returns a boolean
     */
    isDanger(height) {
        for (var x = 0; x < this.width; x++) {
            for (var y = this.height - 1; y > (this.height - 1) - height; y--) {
                if (this.blocks[x][y].sprite) {
                    return true;
                }
            }
        }
        return false;
    }

    setLevel() {
        if (this.score !== 0) {
            this.level = Math.floor(this.score / 30);
        } else {
            this.level = 1;
        }
        this.levelText.innerText = 'Level '+ this.level;
    }


    /* The tick function is the main function of the TaGame object.
     * It gets called every tick and executes the other internal functions.
     * It will update the grid,
     * calculate the current score,
     * spawn possible garbage.
     */
    tick() {
        kd.tick();
        this.totalTicks++;
        this.setLevel();
        this.pushTick(this.level);
        this.updateNeighbors();
        if (this.type === 'client') {
            this.updateState();
        }
        // combo n chain
        var cnc = this.updateCnc();
        if (this.chain) {
            if (this.chainOver()) {
                console.log("chain over");
                this.chain = 0;
            }
        }

        if (cnc[0] > 0) {
            var current = 0;
            for (var y = 0; y < this.height; y++) {
                for (var x = 0; x < this.width; x++) {
                    if (this.blocks[x][y].state == CLEAR) {
                        this.blocks[x][y].counter = CLEAREXPLODETIME * cnc[0] + CLEARBLINKTIME + CLEARPAUSETIME;
                        current++;
                    }
                    if (current == cnc[0])
                        break;
                }
                if (current == cnc[0])
                    break;
            }
        }

        /* Calculate the current score */
        if (cnc[0] > 0) {
            //console.log("combo is ", cnc);
            this.score += (cnc[0] * 10)
            this.score += this.comboToScore(cnc[0]);
            if (cnc[1]) {
                this.chain++;
                //  console.log("chain is ", this.chain + 1);
            }
            if (this.chain) {
                this.score += this.chainToScore(this.chain + 1);
            }
            //console.log("Score: ", this.score);
        }
        // spawn garbage


    };

    /* Updates the coordinates of the sprite objects to the corresponding
     * coordinates in the grid. Then copies the entire grid to an upscaled
     * canvas to maintain pixelart.
     */
    render() {
        this.ctx.fillRect(0, 0, SQ * this.width, SQ * (this.height + 1));
        this.ctx.fillStyle = GAME_BACKGROUND;
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                this.blocks[x][y].render();
            }
        }

        for (var x = 0; x < this.width; x++) {
            this.nextLine[x][0].render(true)
        }

        if (this.type === 'client') {
            this.cursor.render();
        }

        if (this.type === 'server') {
            this.serverCursor.render();
        }


        var score = "" + this.score;
        var chain = "";
        if (this.chain) {
            chain += "chain: " + (this.chain + 1);
        }

        if(this.type === 'client'){
            if(chain != ''){
                this.scoreBoard.textContent = score + ' ('+chain +')';
            } else {
                this.scoreBoard.textContent = score;
                if (ENABLE_HIGHSCORE) {
                    setHighScore(this.score);
                }
            }
        }


    }

    setupServerGame(blocks, nextLine) {
        this.newGame(GAME_WIDTH, GAME_HEIGHT, GLOBAL.nrBlockSprites, 1, blocks);
        this.nextLine = this.serverBlocks(6, 1, nextLine);
        for (var x = 0; x < this.width; x++) {
            this.nextLine[x][0].render(true)
        }
        document.querySelector('#player2').innerHTML = 'player 2';
    }

    updateServerSide(playerInfo) {
        this.score = playerInfo.score;
        const scoreText = document.querySelector('#scoreText-1');
        scoreText.innerHTML = this.score;
        this.updateServerState(JSON.parse(playerInfo.blocks));
        this.nextLine = this.serverBlocks(6, 1, JSON.parse(playerInfo.nextLine));
        for (var x = 0; x < this.width; x++) {
            this.nextLine[x][0].render(true)
        }
    }
}