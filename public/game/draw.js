
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
