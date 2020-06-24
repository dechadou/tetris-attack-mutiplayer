class Block {
    constructor(ctx) {
        this.ctx = ctx;
        this.game = null;
        this.x = null;
        this.y = null;
        this.state = null;
        this.above = null;
        this.under = null;
        this.left = null;
        this.right = null;
        this.counter = 0;
        this.animation_state = null;
        this.animation_counter = 0;
        this.explode_counter = 0;
        this.chain = null;
        this.sprite = null;
        this.garbage = null;
    }

    /* Initialise this block.
     *
     * game is the TaGame object this block belongs to.
     * x and y are its coordinates in the grid
     */
    init(game, x, y, animation_counter, animation_state, counter, state, chain, explode_counter, garbage, sprite) {
        this.game = game;
        this.x = x;
        this.y = y;
        if (this.game.type === 'server') {
            this.counter = counter;
            this.animation_state = animation_state;
            this.animation_counter = animation_counter;
            this.explode_counter = explode_counter;
            this.chain = chain;
            this.garbage = garbage;
        }
        this.sprite = sprite;
        this.state = STATIC;
    };

    /* Initialise this block as a wall.
    * A wall block will see itself as its neighbors.
    * It is never supposed to have a sprite and should always have a state
    * of STATIC.
    * The wall is used on the outer edges of the grid.
    *
    * game is the TaGame object this block belongs to.
    */
    initWall(game) {
        this.game = game;
        this.x = null;
        this.y = null;
        this.under = this;
        this.above = this;
        this.left = this;
        this.right = this;
        this.state = STATIC;
        this.counter = 0;
        this.animation_state = null;
        this.animation_counter = 0;
        this.sprite = null;
    }

    /* Whether this block can be swapped or not.
     * Blocks can be swapped as long as no counter is running.
     * Blocks cannot be swapped underneath a block about to fall from hang
     *
     * returns a boolean
     */
    isSwappable() {
        if (this.above.state == HANG)
            return false;
        return this.counter == 0;
    }

    /* Whether this block is empty or not.
   * returns a boolean
   */
    isEmpty() {
        return this.counter == 0
            && this.sprite == null
            && this != this.game.wall;
    }

    /* Whether this block will stop other blocks from falling.
     * returns a boolean
     */
    isSupport() {
        return this.state != FALL
            && (this.sprite != null
                || this.game.wall == this);
    }

    /* Whether this block can currently becombo cleared. It should not be busy and
     * should be supported.
     * returns a boolean
     */
    isClearable() {
        return this.isSwappable()
            && this.under.isSupport()
            && this.sprite != null;
    }

    /* Make this block a new block.
     * Adds a sprite to the block, and animations to the sprite. Will
     * overwrite any sprite already present.
     *
     * optional sprite_nr is an int indicating which sprite should be used.
     * If none is specified, a random sprite will be picked.
     */
    newBlock() {
        // No block number given, so generate random block
        this.sprite = (Math.floor(Math.random() * GLOBAL.nrBlockSprites)) + 1;
    }

    /* Update the current state of this block based on its own state, and the
     * states of its neighbors.
     * Will keep its current state it its counter is still running.
     * Block behaviour should be described in the wiki
     */
    updateState() {
        /* If the block has a counter, decrement it, return if it is not done*/
        if (this.animation_counter > 0)
            this.animation_counter--;
        if (this.animation_counter <= 0) {
            if (this.animation_state == ANIM_CLEAR_BLINK) {
                this.animation_state = ANIM_CLEAR_FACE;
                this.animation_counter = ANIM_CLEARFACETIME;
            } else if (this.explode_counter > 0) {
                this.explode_counter--;
                if (this.explode_counter == 0)
                    this.animation_state = ANIM_CLEAR_DEAD;
            } else if (this.animation_state == ANIM_CLEAR_DEAD) {
            } else
                this.animation_state = null;
        }
        if (this.counter > 0) {
            this.counter--;
            if (this.counter > 0)
                return;
        }

        /* Run through the state switch to determine behaviour */
        switch (this.state) {
            case STATIC:
            case SWAP:
                if (!this.sprite) {
                    this.state = STATIC;
                    this.chain = false;
                    return;
                } else if (this.under == this.game.wall) {
                    this.state = STATIC;
                    this.chain = false;
                } else if (this.under.state == HANG) {
                    this.state = HANG;
                    this.counter = this.under.counter;
                    this.chain = this.under.chain;
                } else if (this.under.isEmpty()) {
                    this.state = HANG;
                    this.counter = HANGTIME;
                } else {
                    this.chain = false;
                }
                break;
            case HANG:
                this.state = FALL;
            case FALL:
                if (this.under.isEmpty()) {
                    this.fall();
                } else if (this.under.state == CLEAR) {
                    this.state = STATIC;
                } else {
                    this.state = this.under.state;
                    this.counter = this.under.counter;
                    if (this.under.chain) {
                        this.chain = true;
                    }
                }
                if ((this.state == STATIC || this.state == SWAP) && this.sprite) {
                    this.animation_state = ANIM_LAND;
                    this.animation_counter = BLOCKS.animations.land.length;
                    //this.sprite.animations.play('land', GLOBAL.game.time.desiredFps, false);
                }
                break;
            case CLEAR:
                this.erase();
                break;
            default:
                console.log("Unknown block state!");
        }
    }

    /* Set the block sprite to the correct rendering location,
     * keeping animations and offsets in mind.
     * optional nextLine boolean determines if the block should be in the grid
     * or in the bottom line still being added.
     */
    render(nextLine) {
        //var offset_y = (this.game.pushCounter / this.game.pushTime) * 16;
        var offset_y = (((this.game.pushCounter > 0) ? this.game.pushCounter : 0) / this.game.pushTime) * SQ;
        var offset_x = 0;
        var x = 0, y = 0;
        var sprite_index = 0;
        if (!this.sprite)
            return;
        if (!nextLine) {
            x = this.x * SQ;
            y = this.game.height * SQ - (this.y + 1) * SQ + offset_y;

            switch (this.animation_state) {
                case ANIM_SWAP_LEFT:
                    var step = SQ / ANIM_SWAPTIME;
                    x += step * this.animation_counter;
                    break;
                case ANIM_SWAP_RIGHT:
                    var step = SQ / ANIM_SWAPTIME;
                    x -= step * this.animation_counter;
                    break;
                case ANIM_CLEAR_BLINK:
                    var frames = BLOCKS.animations.clear;
                    sprite_index = frames[this.animation_counter % frames.length];
                    break;
                case ANIM_CLEAR_FACE:
                    var frames = BLOCKS.animations.face;
                    sprite_index = frames[0];
                    break;
                case ANIM_CLEAR_DEAD:
                    return;
                case ANIM_LAND:
                    var frames = BLOCKS.animations.land;
                    sprite_index = frames[frames.length - this.animation_counter];
                    break;
                default:
                    if (this.isDanger(2)) {
                        var frames = BLOCKS.animations.danger;
                        sprite_index = frames[Math.round(this.game.totalTicks) % frames.length];
                        break;
                    }

            }
        } else {
            x = this.x * SQ;
            y = this.game.height * SQ + offset_y;
            sprite_index = 1;
        }
        this.ctx.drawImage(BLOCKS.sprites[this.sprite], sprite_index * SQ, 0, SQ, SQ, x, y, SQ, SQ);
    }

    /* This block will give its state and sprite to the block under it and then
     * reset to an empty block.
     */
    fall() {
        this.under.state = this.state;
        this.under.counter = this.counter;
        this.under.sprite = this.sprite;
        this.under.chain = this.chain;

        this.state = STATIC;
        this.counter = 0;
        this.sprite = null;
        this.chain = false;
    }

    /* Swap this block with its right neighbour.
     */
    swap() {
        var temp_sprite = this.right.sprite;

        this.right.sprite = this.sprite;
        this.right.chain = false;

        this.sprite = temp_sprite;
        this.chain = false;

        if (this.sprite == null) {
            this.state = SWAP;
            this.counter = 0;
        } else {
            this.state = SWAP;
            this.counter = SWAPTIME;
            this.animation_state = ANIM_SWAP_LEFT;
            this.animation_counter = ANIM_SWAPTIME;
        }

        if (this.right.sprite == null) {
            this.right.state = SWAP;
            this.right.counter = 0;
        } else {
            this.right.state = SWAP;
            this.right.counter = SWAPTIME;
            this.right.animation_state = ANIM_SWAP_RIGHT;
            this.right.animation_counter = ANIM_SWAPTIME;
        }
    }

    /* Erase the contents of this block and start a chain in
     * its upper neighbour.
     */
    erase() {
        this.sprite = null;
        this.state = STATIC;
        this.counter = 0;
        this.chain = false;
        if (this.above.sprite)
            this.above.chain = true;
    }

    /* Sets this blocks state to CLEAR.
     *
     * returns chain where
     * chain is a boolean telling if this block is part of a chain.
     */
    clear() {
        if (!this.game.combo.includes(this)) {
            this.game.combo.push(this);
        }

        return this.chain;
    }

    /* Combos and Chains the current block with its neighbours.
     *
     * Sets the relevant blocks to clear and returns chain where
     * chain is a boolean telling if this combo is part of a chain.
     */
    cnc() {
        var chain = false;

        if (!this.isClearable()) {
            return false;
        }

        if (this.left.isClearable() && this.right.isClearable()) {
            if (this.left.sprite == this.sprite
                && this.right.sprite == this.sprite) {
                var left = this.left.clear();
                var middle = this.clear();
                var right = this.right.clear();

                if (middle || left || right) {
                    chain = true;
                }
            }
        }

        if (this.above.isClearable() && this.under.isClearable()) {
            if (this.above.sprite == this.sprite
                && this.under.sprite == this.sprite) {
                var above = this.above.clear();
                var middle = this.clear();
                var under = this.under.clear();

                if (middle || above || under) {
                    chain = true;
                }
            }
        }

        return chain;
    }

    isDanger(height) {
        if (!height)
            height = 2;
        for (var y = this.game.height - 1; y > (this.game.height - 1) - height; y--) {
            if (this.game.blocks[this.x][y].sprite) {
                return true;
            }
        }
    }
}


function OldBlock(ctx) {
    this.game = null;
    this.x = null;
    this.y = null;
    this.state = null;
    this.above = null;
    this.under = null;
    this.left = null;
    this.right = null;
    this.counter = 0;
    this.animation_state = null;
    this.animation_counter = 0;
    this.explode_counter = 0;
    this.chain = null;
    this.sprite = null;
    this.garbage = null;

    /* Initialise this block.
     *
     * game is the TaGame object this block belongs to.
     * x and y are its coordinates in the grid
     */
    this.init = function (game, x, y, animation_counter, animation_state, counter, state, chain, explode_counter, garbage, sprite) {
        this.game = game;
        this.x = x;
        this.y = y;
        if (this.game.type === 'server') {
            this.counter = counter;
            this.animation_state = animation_state;
            this.animation_counter = animation_counter;
            this.explode_counter = explode_counter;
            this.chain = chain;
            this.garbage = garbage;
        }
        this.sprite = sprite;
        this.state = STATIC;

    };

    /* Initialise this block as a wall.
     * A wall block will see itself as its neighbors.
     * It is never supposed to have a sprite and should always have a state
     * of STATIC.
     * The wall is used on the outer edges of the grid.
     *
     * game is the TaGame object this block belongs to.
     */
    this.initWall = function (game) {
        this.game = game;
        this.x = null;
        this.y = null;
        this.under = this;
        this.above = this;
        this.left = this;
        this.right = this;
        this.state = STATIC;
        this.counter = 0;
        this.animation_state = null;
        this.animation_counter = 0;
        this.sprite = null;
    }

    /* Whether this block can be swapped or not.
     * Blocks can be swapped as long as no counter is running.
     * Blocks cannot be swapped underneath a block about to fall from hang
     *
     * returns a boolean
     */
    this.isSwappable = function () {
        if (this.above.state == HANG)
            return false;
        return this.counter == 0;
    }

    /* Whether this block is empty or not.
     * returns a boolean
     */
    this.isEmpty = function () {
        return this.counter == 0
            && this.sprite == null
            && this != this.game.wall;
    }

    /* Whether this block will stop other blocks from falling.
     * returns a boolean
     */
    this.isSupport = function () {
        return this.state != FALL
            && (this.sprite != null
                || this.game.wall == this);
    }

    /* Whether this block can currently becombo cleared. It should not be busy and
     * should be supported.
     * returns a boolean
     */
    this.isClearable = function () {
        return this.isSwappable()
            && this.under.isSupport()
            && this.sprite != null;
    }

    /* Make this block a new block.
     * Adds a sprite to the block, and animations to the sprite. Will
     * overwrite any sprite already present.
     *
     * optional sprite_nr is an int indicating which sprite should be used.
     * If none is specified, a random sprite will be picked.
     */
    this.newBlock = function () {
        if (this.sprite === undefined) {
            // No block number given, so generate random block
            sprite_nr = (Math.floor(Math.random() * GLOBAL.nrBlockSprites)) + 1;
            this.sprite = sprite_nr
        }
    }

    /* Update the current state of this block based on its own state, and the
     * states of its neighbors.
     * Will keep its current state it its counter is still running.
     * Block behaviour should be described in the wiki
     */
    this.updateState = function () {
        /* If the block has a counter, decrement it, return if it is not done*/
        if (this.animation_counter > 0)
            this.animation_counter--;
        if (this.animation_counter <= 0) {
            if (this.animation_state == ANIM_CLEAR_BLINK) {
                this.animation_state = ANIM_CLEAR_FACE;
                this.animation_counter = ANIM_CLEARFACETIME;
            } else if (this.explode_counter > 0) {
                this.explode_counter--;
                if (this.explode_counter == 0)
                    this.animation_state = ANIM_CLEAR_DEAD;
            } else if (this.animation_state == ANIM_CLEAR_DEAD) {
            } else
                this.animation_state = null;
        }
        if (this.counter > 0) {
            this.counter--;
            if (this.counter > 0)
                return;
        }

        /* Run through the state switch to determine behaviour */
        switch (this.state) {
            case STATIC:
            case SWAP:
                if (!this.sprite) {
                    this.state = STATIC;
                    this.chain = false;
                    return;
                } else if (this.under == this.game.wall) {
                    this.state = STATIC;
                    this.chain = false;
                } else if (this.under.state == HANG) {
                    this.state = HANG;
                    this.counter = this.under.counter;
                    this.chain = this.under.chain;
                } else if (this.under.isEmpty()) {
                    this.state = HANG;
                    this.counter = HANGTIME;
                } else {
                    this.chain = false;
                }
                break;
            case HANG:
                this.state = FALL;
            case FALL:
                if (this.under.isEmpty()) {
                    this.fall();
                } else if (this.under.state == CLEAR) {
                    this.state = STATIC;
                } else {
                    this.state = this.under.state;
                    this.counter = this.under.counter;
                    if (this.under.chain) {
                        this.chain = true;
                    }
                }
                if ((this.state == STATIC || this.state == SWAP) && this.sprite) {
                    this.animation_state = ANIM_LAND;
                    this.animation_counter = BLOCKS.animations.land.length;
                    //this.sprite.animations.play('land', GLOBAL.game.time.desiredFps, false);
                }
                break;
            case CLEAR:
                this.erase();
                break;
            default:
                console.log("Unknown block state!");
        }
    }

    /* Set the block sprite to the correct rendering location,
     * keeping animations and offsets in mind.
     * optional nextLine boolean determines if the block should be in the grid
     * or in the bottom line still being added.
     */
    this.render = function (nextLine) {
        //var offset_y = (this.game.pushCounter / this.game.pushTime) * 16;
        var offset_y = (((this.game.pushCounter > 0) ? this.game.pushCounter : 0) / this.game.pushTime) * SQ;
        var offset_x = 0;
        var x = 0, y = 0;
        var sprite_index = 0;
        if (!this.sprite)
            return;
        if (!nextLine) {
            x = this.x * SQ;
            y = this.game.height * SQ - (this.y + 1) * SQ + offset_y;

            switch (this.animation_state) {
                case ANIM_SWAP_LEFT:
                    var step = SQ / ANIM_SWAPTIME;
                    x += step * this.animation_counter;
                    break;
                case ANIM_SWAP_RIGHT:
                    var step = SQ / ANIM_SWAPTIME;
                    x -= step * this.animation_counter;
                    break;
                case ANIM_CLEAR_BLINK:
                    var frames = BLOCKS.animations.clear;
                    sprite_index = frames[this.animation_counter % frames.length];
                    break;
                case ANIM_CLEAR_FACE:
                    var frames = BLOCKS.animations.face;
                    sprite_index = frames[0];
                    break;
                case ANIM_CLEAR_DEAD:
                    return;
                case ANIM_LAND:
                    var frames = BLOCKS.animations.land;
                    sprite_index = frames[frames.length - this.animation_counter];
                    break;
                default:
                    if (this.isDanger(2)) {
                        var frames = BLOCKS.animations.danger;
                        sprite_index = frames[Math.round(this.game.totalTicks) % frames.length];
                        break;
                    }

            }
        } else {
            x = this.x * SQ;
            y = this.game.height * SQ + offset_y;
            sprite_index = 1;
        }
        ctx.drawImage(BLOCKS.sprites[this.sprite], sprite_index * SQ, 0, SQ, SQ, x, y, SQ, SQ);
    }

    /* This block will give its state and sprite to the block under it and then
     * reset to an empty block.
     */
    this.fall = function () {
        this.under.state = this.state;
        this.under.counter = this.counter;
        this.under.sprite = this.sprite;
        this.under.chain = this.chain;

        this.state = STATIC;
        this.counter = 0;
        this.sprite = null;
        this.chain = false;
    }

    /* Swap this block with its right neighbour.
     */
    this.swap = function () {
        console.log('llega');
        var temp_sprite = this.right.sprite;

        this.right.sprite = this.sprite;
        this.right.chain = false;

        this.sprite = temp_sprite;
        this.chain = false;

        if (this.sprite == null) {
            this.state = SWAP;
            this.counter = 0;
        } else {
            this.state = SWAP;
            this.counter = SWAPTIME;
            this.animation_state = ANIM_SWAP_LEFT;
            this.animation_counter = ANIM_SWAPTIME;
        }

        if (this.right.sprite == null) {
            this.right.state = SWAP;
            this.right.counter = 0;
        } else {
            this.right.state = SWAP;
            this.right.counter = SWAPTIME;
            this.right.animation_state = ANIM_SWAP_RIGHT;
            this.right.animation_counter = ANIM_SWAPTIME;
        }
    }

    /* Erase the contents of this block and start a chain in
     * its upper neighbour.
     */
    this.erase = function () {
        this.sprite = null;
        this.state = STATIC;
        this.counter = 0;
        this.chain = false;
        if (this.above.sprite)
            this.above.chain = true;
    }

    /* Sets this blocks state to CLEAR.
     *
     * returns chain where
     * chain is a boolean telling if this block is part of a chain.
     */
    this.clear = function () {
        if (!this.game.combo.includes(this)) {
            this.game.combo.push(this);
        }

        return this.chain;
    }

    /* Combos and Chains the current block with its neighbours.
     *
     * Sets the relevant blocks to clear and returns chain where
     * chain is a boolean telling if this combo is part of a chain.
     */
    this.cnc = function () {
        var chain = false;

        if (!this.isClearable()) {
            return false;
        }

        if (this.left.isClearable() && this.right.isClearable()) {
            if (this.left.sprite == this.sprite
                && this.right.sprite == this.sprite) {
                var left = this.left.clear();
                var middle = this.clear();
                var right = this.right.clear();

                if (middle || left || right) {
                    chain = true;
                }
            }
        }

        if (this.above.isClearable() && this.under.isClearable()) {
            if (this.above.sprite == this.sprite
                && this.under.sprite == this.sprite) {
                var above = this.above.clear();
                var middle = this.clear();
                var under = this.under.clear();

                if (middle || above || under) {
                    chain = true;
                }
            }
        }

        return chain;
    }

    this.isDanger = function (height) {
        if (!height)
            height = 2;
        for (var y = this.game.height - 1; y > (this.game.height - 1) - height; y--) {
            if (this.game.blocks[this.x][y].sprite) {
                return true;
            }
        }
    }
}

