import { DIRECTION, IndexedColor } from '../helpers.js';
import { BLOCK } from "../blocks.js";
import { AABB } from '../core/AABB.js';

function box(width, length, height, texture, vertices, x, y, z, options) {
    width /= 16;
    height /= 16;
    length /= 16;
    const lm = IndexedColor.WHITE;
    const flags = 0;
    let uv = [0, 0, 1, 1];
    let textures = [texture, texture, texture, texture, texture, texture];
    if (options?.uv) {
        uv[0] = options.uv[0] / 1024;
        uv[1] = options.uv[1] / 16;
        uv[2] = options.uv[2] / 16;
        uv[3] = options.uv[3] / 16;
    }
    if (options?.textures) {
        textures[0] = options.textures[0];
        textures[1] = options.textures[1];
        textures[2] = options.textures[2];
        textures[3] = options.textures[3];
        textures[4] = options.textures[4];
        textures[5] = options.textures[5];
    }
    
    let direction = (options?.dir) ? options.dir : 0;
   
    let dir = (direction) % 4;
    vertices.push( x + 0.5, z + 0.5 + length / 2, y + 0.5, uv[2], 0, 0, 0, 0, -uv[3], textures[dir][0] + uv[0], textures[dir][1], textures[dir][2] * uv[2], textures[dir][3] * uv[3], lm.pack(), flags);
    dir = (direction + 1) % 4;
    vertices.push( x + 0.5 + width / 2, z + 0.5, y + 0.5, 0, -uv[2], 0, 0, 0, -uv[3], textures[dir][0] + uv[0], textures[dir][1], textures[dir][2] * uv[2], textures[dir][3] * uv[3], lm.pack(), flags);
    dir = (direction + 2) % 4;
    vertices.push( x + 0.5, z + 0.5 - length / 2, y + 0.5, -uv[2], 0, 0, 0, 0, -uv[3], textures[dir][0] + uv[0], textures[dir][1], textures[dir][2] * uv[2], textures[dir][3] * uv[3], lm.pack(), flags);
    
}

// Забор
export default class style {

    static getRegInfo() {
        return {
            styles: ['bell'],
            func: this.func,
            aabb: this.computeAABB
        };
    }
    
    static computeAABB(block, for_physic) {
        const aabb = new AABB();
        aabb.set(0, 0, 0, 1, 1, 1);
        return [aabb];
    }

    static func(block, vertices, chunk, x, y, z, neighbours, biome, dirt_color, unknown, matrix, pivot, force_tex) {

        if(!block || typeof block == 'undefined' || block.id == BLOCK.AIR.id) {
            return;
        }
        
        const texture = block.material.texture;
        const side = BLOCK.calcTexture(texture, DIRECTION.WEST);
        const options = {
            uv: [-8, 0, 8, 14]
        }
        box(8, 8, 12, side, vertices, x, y, z, options);
    }

}
