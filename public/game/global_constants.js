const SCALE = 1;
const GAME_WIDTH = 6;
const GAME_HEIGHT = 9;
const GAME_BACKGROUND = '#f2f2f2';
const UPS = 60;
const SQ = SquareSize = 64;
const HIGHSCORE = 'tagame-highscore';
const BLOCKS = {
    names: [
        'piece_w',
        'piece_C',
        'piece_k',
        'piece_m',
        'piece_y'
    ],
    sprites: [],
    animations: {
        live: [0],
        dead: [1],
        land: [0, 0, 0, 3, 3, 3, 0, 0, 2, 2, 0],
        clear: [6, 6, 0, 0, 6, 6, 0, 4, 4],
        face: [5],
        danger: [0]

        /*land: [4, 4, 4, 2, 2, 2, 3, 3, 3, 0],
        clear: [6, 0],
        live: [0],
        dead: [1],
        danger: [0, 0, 0, 4, 4, 4, 0, 0, 0, 3, 3, 3, 2, 2, 2, 3, 3, 3],
        face: [5]*/

    }
};
const CURSORS = {
    names: [
        'cursor'
    ],
    sprites: [],
    animations: {
        idle: [0, 1]
    }
};

const GLOBAL = {
    game: null,
    nrBlockSprites: 0,
    nrCursorSprites: 0,
    taGame_list: [],
    block_layer: 0,
    cursor_layer: 0
};

const PIXELCANVAS = {
    pixelcontent: null,
    pixelwidth: 0,
    pixelheight: 0
};

/* The Block object */
/* States */
const STATIC = 0;
const HANG = 1
const FALL = 2
const SWAP = 3
const CLEAR = 4
/* Animation states */
const ANIM_SWAP_LEFT = 0;
const ANIM_SWAP_RIGHT = 1;
const ANIM_LAND = 2;
const ANIM_CLEAR_BLINK = 3;
const ANIM_CLEAR_FACE = 4;
const ANIM_CLEAR_DEAD = 5;

/* Timing */
const HANGTIME = 11;
const FALLTIME = 4;
const SWAPTIME = 4;
const CLEARBLINKTIME = 38;
const CLEARPAUSETIME = 20;
const CLEAREXPLODETIME = 8;
const PUSHTIME = 1000;
/* Animation timing */
const ANIM_SWAPTIME = 4;
const ANIM_LANDTIME = 4;
const ANIM_CLEARBLINKTIME = 38;
const ANIM_CLEARFACETIME = 20
const ANIM_DANGERTIME = 6;