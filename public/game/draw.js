/*const gameDom = document.getElementsByClassName('game');
const canvas = document.getElementsByClassName('tetris-canvas');
const scoreBoard = document.getElementsByClassName('scoreText');
const highScore = document.getElementsByClassName('highScore');
const gameOverScreen = document.getElementsByClassName('gameOver');
canvas.height = SQ * (GAME_HEIGHT + 1) * SCALE;
canvas.width = SQ * GAME_WIDTH * SCALE;
gameDom.style.width = canvas.width + 20;
gameDom.style.height = canvas.height + 30;

const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
ctx.scale(SCALE, SCALE);
ctx.fillStyle = 'white';
ctx.font = '12px arial';
ctx.fillRect(0, 0, SQ * GAME_WIDTH, SQ * (GAME_HEIGHT + 1));


function loadSprites(blocks, cursors) {
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
}*/

function render() {
    GLOBAL.taGame_list.forEach(function (game) {
        game.render();
    });
}

function getHighScore(){
    if (localStorage.getItem(HIGHSCORE) !== null) {

    }
}


function setHighScore(score){
    let current = localStorage.getItem(HIGHSCORE);
    if(score > current){
        localStorage.setItem(HIGHSCORE, score);
        highScore.textContent = 'HighScore: '+score;
    }
}

//loadSprites(BLOCKS, CURSORS);
