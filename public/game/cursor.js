class Cursor {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.myself = this;
        this.x = null;
        this.y = null;
        this.left = null;
        this.right = null;
        this.sprite = null;
        this.game = null;
    }

    init(game){
        this.game = game;

        // center the cursor
        this.x = Math.floor(game.width / 2) - 1;
        this.y = Math.floor(game.height / 3);

        this.left = game.blocks[this.x][this.y];
        this.right = game.blocks[this.x + 1][this.y];

        // temp sprite
        this.sprite = 1;

        if (this.game.type === 'client') {
            kd.LEFT.press(this.mv_left.bind(this));
            kd.RIGHT.press(this.mv_right.bind(this));
            kd.UP.press(this.mv_up.bind(this));
            kd.DOWN.press(this.mv_down.bind(this));
            kd.SPACE.press(this.mv_swap.bind(this));
            kd.C.down(this.game.pushFast.bind(this.game));

            /*let hammertime = new Hammer(canvas);
            hammertime.get('swipe').set({ direction: Hammer.DIRECTION_ALL });

            hammertime.on('swipeleft', this.mv_left.bind(this));
            hammertime.on('swiperight', this.mv_right.bind(this));
            hammertime.on('swipeup', this.mv_up.bind(this));
            hammertime.on('swipedown',this.mv_down.bind(this));
            hammertime.on('tap', this.mv_swap.bind(this));
            hammertime.on('press', this.game.pushFast.bind(this.game));
             */
            var keys = [
                kd.LEFT.keyCode,
                kd.RIGHT.keyCode,
                kd.UP.keyCode,
                kd.DOWN.keyCode,
                kd.C.keyCode,
                kd.SPACE.keyCode];

            window.addEventListener('keydown', function (e) {
                if (keys.includes(e.keyCode)) {
                    e.preventDefault();
                }
            }, false);
        }

        if (this.game.type === 'server') {
            socket.on('server_mv_left', (data) => {
                this.myself.x = data.x;
            });
            socket.on('server_mv_right', (data) => {
                this.myself.x = data.x;
            });
            socket.on('server_mv_down', (data) => {
                this.myself.y = data.y;
            });
            socket.on('server_mv_up', (data) => {
                this.myself.y = data.y;
            });
            socket.on('server_mv_swap', (data) => {
                this.game.swap(data.x, data.y);
            });
            socket.on('server_mvpushfast', (data) => {
                this.game.pushFast();
            })
        }
    }

    mv_left(){
        if (this.x > 0) {
            this.x--;
            if (!SOLO_MODE) {
                socket.emit('mv_left', {x: this.x});
            }
        }
    }

    mv_right(){
        if (this.x < this.game.width - 2) {
            this.x++;
            if (!SOLO_MODE) {
                socket.emit('mv_right', {x: this.x});
            }
        }
    };

    mv_down(){
        if (this.y > 0) {
            this.y--;
            if (!SOLO_MODE) {
                socket.emit('mv_down', {y: this.y});
            }
        }
    };

    mv_up(){
        if (this.y < this.game.height - 1) {
            this.y++;
            if (!SOLO_MODE) {
                socket.emit('mv_up', {y: this.y});
            }
        }
    };

    mv_swap(){
        this.game.swap(this.x, this.y);
        if (!SOLO_MODE) {
            socket.emit('mv_swap', {x: this.x, y: this.y});
        }
    };


    render(){
        let frames = CURSORS.animations.idle;
        //let sprite_index = frames[Math.round(this.game.totalTicks / 10) % frames.length];
        let sprite_index = 0;
        let offset = (((this.game.pushCounter > 0) ? this.game.pushCounter : 0) / this.game.pushTime) * SQ;
        let sx = 0;
        let sy = 0;
        let sWidth = 135;
        let sHeight = 73;
        let dx = this.x * SQ - 3;
        let dy = this.game.height * SQ - (this.y + 1) * SQ - 3 + offset;
        let dWidth = 135;
        let dHeight = 73;
        this.ctx.drawImage(CURSORS.sprites[this.sprite], sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
    }
}

