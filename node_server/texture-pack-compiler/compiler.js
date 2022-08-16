import skiaCanvas from 'skia-canvas';
import fs from 'fs';
import { Spritesheet } from "./spritesheet.js";
import { CompileData } from "./compile_data.js";

const BLOCK_NAMES = {
    DIRT: 'DIRT',
    MOB_SPAWN: 'MOB_SPAWN',
    GRASS_BLOCK: 'GRASS_BLOCK'
};

// Compiler
export class Compiler {

    constructor(options) {
        options.n_color = '#8080ff';
        options.n_texture_id = '_n';
        this.spritesheets = new Map();
        // options.blockstates_dir = options.texture_pack_dir + '/assets/minecraft/blockstates';
        if(!Array.isArray(options.texture_pack_dir)) {
            options.texture_pack_dir = [options.texture_pack_dir];
        }
        for(let i = 0; i < options.texture_pack_dir.length; i++) {
            options.texture_pack_dir[i] = options.texture_pack_dir[i] + '/assets/minecraft/textures';
        }
        this.options = options;
        // Make default n texture
        this.default_n = new skiaCanvas.Canvas(options.resolution, options.resolution);
        const ctx = this.default_n.getContext('2d');
        ctx.fillStyle = options.n_color;
        ctx.fillRect(0, 0, options.resolution, options.resolution);
    }

    // Return spritesheet file
    getSpritesheet(id) {
        let spritesheet = this.spritesheets.get(id);
        if(!spritesheet) {
            console.log(this.base_conf);
            const tx_cnt = this.base_conf.textures[id].tx_cnt;
            spritesheet = new Spritesheet(id, tx_cnt, this.options.resolution, this.options);
            this.spritesheets.set(id, spritesheet);
        }
        return spritesheet;
    }

    // Init
    async init() {
        const compile_json = await import(this.options.compile_json, {
            assert: { type: 'json' }
        });
        this.compile_data = new CompileData(compile_json.default);
        await this.compile_data.init();
        //
        this.base_conf = (await import(this.options.base_conf, {
            assert: { type: 'json' }
        })).default;
    }

    async run() {
        // Predefined textures
        for(let texture of this.compile_data.predefined_textures) {
            const spritesheet = this.getSpritesheet(texture.spritesheet_id);
            const tex = await spritesheet.loadTex(texture.image);
            spritesheet.drawTexture(tex.texture, texture.x, texture.y, texture.has_mask);
            spritesheet.drawTexture(tex.n || this.default_n, texture.x, texture.y, false, null, null, this.options.n_texture_id);
        }
        try {
            await this.compileBlocks(this.compile_data.blocks);
            await this.export();
        } catch(e) {
            console.error(e);
        }
    }

    // Export
    async export() {
        for(const item of this.spritesheets.values()) {
            item.export();
        }
        const data = JSON.stringify(this.compile_data.blocks, null, 4);
        fs.writeFileSync(`${this.options.output_dir}/blocks.json`, data);
        // copy files
        for(let fn of this.options.copy_files) {
            fs.copyFile(`./${fn}`, `${this.options.output_dir}/${fn}`, (err) => {
                if(err) {
                    throw err;
                }
                console.error(`${fn} was copied to destination`);
            });
        }
    }

    // imageOverlay
    imageOverlay(img, overlay_color, w, h) {
        if(!this.tempCanvases) {
            this.tempCanvases = new Map();
        }
        const key = `${w}x${h}`;
        let item = this.tempCanvases.get(key);
        if(!item) {
            item = {
                cnv: new skiaCanvas.Canvas(w, h)
            }
            item.ctx = item.cnv.getContext('2d');
            item.ctx.imageSmoothingEnabled = false;
            this.tempCanvases.set(key, item)
        }
        //
        item.ctx.globalCompositeOperation = 'source-over';
        item.ctx.fillStyle = overlay_color;
        item.ctx.fillRect(0, 0, w, h);
        //
        item.ctx.globalCompositeOperation = 'overlay';
        item.ctx.drawImage(img, 0, 0, w, h);
        //
        item.ctx.globalCompositeOperation = 'destination-in';
        item.ctx.drawImage(img, 0, 0, w, h);
        return item.cnv;
    }

    //
    async compileBlocks(blocks) {
        // Each all blocks from JSON file
        let dirt_image = null;
        let num_blocks = 0;
        let tmpCnv;
        let tmpContext;
        for(let block of blocks) {
            if('texture' in block) {
                console.log(++num_blocks, block.name);
                let spritesheet_id = 'default';
                if(Array.isArray(block.texture)) {
                    throw 'error_invalid_texture_declaration1';
                }
                if(typeof block.texture === 'string' || block.texture instanceof String) {
                    block.texture = {side: block.texture};
                }
                // Tags
                block.tags = block.tags || [];
                if(['stairs'].indexOf(block.style) >= 0 || block.layering?.slab) {
                    block.tags.push('no_drop_ao');
                }
                const tags = ('tags' in block) ? block.tags : [];
                //
                for(let tid in block.texture) {
                    const value = block.texture[tid];
                    if(Array.isArray(value)) {
                        throw 'error_invalid_texture_declaration2';
                    }
                    if(tid == 'id') {
                        spritesheet_id = value;
                        continue
                    }
                    const spritesheet = this.getSpritesheet(spritesheet_id);

                    if(!tmpContext) {
                        tmpCnv = new skiaCanvas.Canvas(spritesheet.tx_sz, spritesheet.tx_sz);
                        tmpContext = tmpCnv.getContext('2d');
                        tmpContext.imageSmoothingEnabled = false;
                    }

                    let tex = spritesheet.textures.get(value);
                    if(value.indexOf('|') >= 0) {
                        const pos_arr = value.split('|');
                        tex = {pos: {x: parseFloat(pos_arr[0]), y: parseFloat(pos_arr[1])}};
                    }
                    let x_size = 1;
                    let y_size = 1;
                    const has_mask = tags.indexOf('mask_biome') >= 0 || tags.indexOf('mask_color') >= 0;
                    const compile = block.compile;
                    if(!tex) {
                        const img = await spritesheet.loadTex(value);
                        //
                        if(block.name == BLOCK_NAMES.DIRT) {
                            dirt_image = img.texture;
                        }
                        //
                        if(has_mask) {
                            x_size = 2;
                        } else {
                            x_size = Math.ceil(img.texture.width / spritesheet.tx_sz);
                            y_size = Math.min(img.texture.height / spritesheet.tx_sz, spritesheet.tx_cnt);
                        }
                        if(block.name == BLOCK_NAMES.MOB_SPAWN) {
                            y_size = 2;
                        }
                        //
                        const pos = spritesheet.findPlace(block, x_size, y_size);
                        tex = {
                            img: img.texture,
                            n: img.n || this.default_n,
                            pos,
                            has_mask,
                            x_size,
                            y_size
                        };
                        spritesheet.textures.set(value, tex);
                        if(block.name == BLOCK_NAMES.GRASS_BLOCK && tid == 'side') {
                            spritesheet.drawTexture(dirt_image, tex.pos.x, tex.pos.y);
                            spritesheet.drawTexture(tex.img, tex.pos.x, tex.pos.y);
                            spritesheet.drawTexture(tex.img, tex.pos.x, tex.pos.y, false, 'difference');
                            spritesheet.drawTexture(dirt_image, tex.pos.x + 1, tex.pos.y, false, 'source-over');
                            spritesheet.drawTexture(dirt_image, tex.pos.x + 1, tex.pos.y, false, 'difference');
                            spritesheet.drawTexture(tex.img, tex.pos.x + 1, tex.pos.y, false, 'source-over');
                            // grass head shadow
                            const canvas = new skiaCanvas.Canvas(tex.img.width, tex.img.height);
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(tex.img, 0, 0, tex.img.width, tex.img.height);
                            spritesheet.ctx.globalCompositeOperation = 'source-over';
                            spritesheet.ctx.fillStyle = '#00000065';
                            for(let i = 0; i < tex.img.width; i++) {
                                for(let j = 0; j < tex.img.height; j++) {
                                    const pix = ctx.getImageData(i, j, 1, 1).data;
                                    if(pix[3] == 0) {
                                        const x = tex.pos.x * spritesheet.tx_sz + i;
                                        const y = tex.pos.y * spritesheet.tx_sz + j;
                                        spritesheet.ctx.fillRect(x, y, 1, 1);
                                        spritesheet.ctx.fillRect(x, y + 1, 1, 1);
                                        break;
                                    }
                                }
                            }
                        } else if(block.name == BLOCK_NAMES.MOB_SPAWN) {
                            const img_glow = (await spritesheet.loadTex('block/spawner_glow.png')).texture;
                            spritesheet.drawTexture(tex.img, tex.pos.x, tex.pos.y, has_mask);
                            spritesheet.drawTexture(tex.img, tex.pos.x, tex.pos.y + 1, has_mask);
                            spritesheet.drawTexture(img_glow, tex.pos.x, tex.pos.y + 1, has_mask);
                        } else {
                            await spritesheet.drawTexture(tex.img, tex.pos.x, tex.pos.y, has_mask, null, has_mask ? compile?.overlay_mask : null);
                            await spritesheet.drawTexture(tex.n, tex.pos.x, tex.pos.y, false, null, null, this.options.n_texture_id);
                        }
                    }

                    // calculate animation frames
                    if(block.texture_animations && tex.img) {
                        if(tid in block.texture_animations) {
                            if(block.texture_animations[tid] === null) {
                                block.texture_animations[tid] = Math.min(tex.img.height / spritesheet.tx_sz, spritesheet.tx_cnt);
                            }
                        }
                    }

                    // check compile rules
                    if(compile) {
                        const ctx = spritesheet.ctx;
                        const x = tex.pos.x * spritesheet.tx_sz;
                        const y = tex.pos.y * spritesheet.tx_sz;
                        const w = spritesheet.tx_sz;
                        const h = spritesheet.tx_sz;
                        // overlay color
                        if(compile.overlay_color) {
                            ctx.drawImage(this.imageOverlay(tex.img, compile.overlay_color, w, h), x, y, w, h);
                        }
                        //
                        if(compile.layers) {
                            for(let layer of compile.layers) {
                                const layer_img = await spritesheet.loadTex(layer.image);
                                ctx.drawImage(this.imageOverlay(layer_img.texture, layer.overlay_color, w, h), x, y, w, h);
                            }
                        }
                    }
                    //
                    block.texture[tid] = [tex.pos.x, tex.pos.y];
                    // check compile rules
                    if(block.compile) {
                        const compile = block.compile;
                        if(compile.add_3pos) {
                            // add third part for texture position
                            let param = compile.add_3pos[tid];
                            if(typeof param != 'undefined') {
                                block.texture[tid].push(param);
                            }
                        }
                    }
                }

                // inventory icon
                if(block?.inventory?.texture) {
                    let spritesheet_id = 'default';
                    let value = block.inventory.texture;
                    let tex = null;
                    if(typeof value == 'object' && 'image' in value && 'id' in value) {
                        spritesheet_id = value.id;
                        value = value.image;
                    }
                    //
                    const spritesheet = this.getSpritesheet(spritesheet_id);
                    if(value.indexOf('|') >= 0) {
                        const pos_arr = value.split('|');
                        tex = {pos: {x: parseFloat(pos_arr[0]), y: parseFloat(pos_arr[1])}};
                    } else {
                        const img = await spritesheet.loadTex(value);
                        tex = spritesheet.textures.get(value);
                        if(!tex) {
                            tex = {pos: spritesheet.findPlace(block, 1, 1)};
                            spritesheet.drawTexture(img.texture, tex.pos.x, tex.pos.y);
                            spritesheet.drawTexture(img.n || this.default_n, tex.pos.x, tex.pos.y, false, null, null, this.options.n_texture_id);
                        }
                    }
                    block.inventory.texture = {
                        id: spritesheet_id,
                        tx_cnt: spritesheet.tx_cnt,
                        side: [tex.pos.x, tex.pos.y]
                    }
                }

                // stage textures (eg. seeds)
                if(block?.stage_textures) {
                    const spritesheet = this.getSpritesheet('default');
                    for(let i in block.stage_textures) {
                        const value = block.stage_textures[i];
                        const img = await spritesheet.loadTex(value);
                        let tex = spritesheet.textures.get(value);
                        if(!tex) {
                            tex = {pos: spritesheet.findPlace(block, 1, 1)};
                            spritesheet.drawTexture(img.texture, tex.pos.x, tex.pos.y);
                            spritesheet.drawTexture(img.n || this.default_n, tex.pos.x, tex.pos.y, false, null, null, this.options.n_texture_id);
                            spritesheet.textures.set(value, tex);
                        }
                        block.stage_textures[i] = [tex.pos.x, tex.pos.y];
                    }
                }

                // redstone textures
                if(block.redstone?.textures) {
                    const spritesheet = this.getSpritesheet('default');
                    for(let k of ['dot', 'line']) {
                        for(let i in block.redstone.textures[k]) {
                            const value = block.redstone.textures[k][i];
                            const img = await spritesheet.loadTex(value);
                            let tex = spritesheet.textures.get(value);
                            if(!tex) {
                                tex = {pos: spritesheet.findPlace(block, 2, 1)};
                                spritesheet.drawTexture(img.texture, tex.pos.x, tex.pos.y, true);
                                spritesheet.drawTexture(img.n || this.default_n, tex.pos.x, tex.pos.y, false, null, null, this.options.n_texture_id);
                                spritesheet.textures.set(value, tex);
                            }
                            block.redstone.textures[k][i] = [tex.pos.x, tex.pos.y];
                        }
                    }
                }

                delete(block.compile);

            }
        }
    }

}