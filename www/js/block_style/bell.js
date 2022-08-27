import {DIRECTION, QUAD_FLAGS, IndexedColor, Vector} from '../helpers.js';
import { BLOCK } from "../blocks.js";
import { AABB } from '../core/AABB.js';
import { default as default_style } from './default.js';
import glMatrix from "../../vendors/gl-matrix-3.3.min.js"

const {mat4} = glMatrix;

// колокол
export default class style {

    static getRegInfo() {
        return {
            styles: ['bell'],
            func: this.func,
            aabb: this.computeAABB
        };
    }
    
    static computeAABB(block, for_physic) {
        const aabbs = [];
        aabbs.push(new AABB().set(0.25, 0.28, 0.25, 0.75, 0.41, 0.75));
        aabbs.push(new AABB().set(0.31, 0.38, 0.31, 0.69, 0.81, 0.69));
        if (block.rotate.y == -1) {
            aabbs.push(new AABB().set(0.44, 0.81, 0.44, 0.56, 1, 0.56));
        } else if (block.rotate.y == 1) {
            const cd = block.getCardinalDirection();
            if (cd == DIRECTION.WEST || cd == DIRECTION.EAST) {
                aabbs.push(new AABB().set(0.44, 0.81, 0.13, 0.56, 0.94, 0.88));
                aabbs.push(new AABB().set(0.38, 0, 0.88, 0.63, 1, 1));
                aabbs.push(new AABB().set(0.38, 0, 0, 0.63, 1, 0.13));
            } else {
                aabbs.push(new AABB().set(0.13, 0.81, 0.44, 0.88, 0.94, 0.56));
                aabbs.push(new AABB().set(0.88, 0, 0.38, 1, 1, 0.63));
                aabbs.push(new AABB().set(0, 0, 0.38, 0.13, 1, 0.63));
            }
        }
        return aabbs;
    }

    static func(block, vertices, chunk, x, y, z, neighbours, biome, dirt_color, unknown, matrix, pivot, force_tex) {

        if(!block || typeof block == 'undefined' || !block.rotate) {
            return;
        }
        
        const texture = block.material.texture;
        const side = BLOCK.calcTexture(texture, DIRECTION.WEST);
        const down = BLOCK.calcTexture(texture, DIRECTION.DOWN);
        const up = BLOCK.calcTexture(texture, DIRECTION.UP);
        const dark_oak_planks = BLOCK.calcTexture(BLOCK.DARK_OAK_PLANKS.texture, DIRECTION.UP);
        const stone = BLOCK.calcTexture(BLOCK.STONE.texture, DIRECTION.UP);
        const flag = 0;
        const parts = [];
        //Струкутра колокола
        parts.push(...[
            {
                "size": {"x": 8, "y": 2, "z": 8},
                "translate": {"x": 0, "y": -2.5, "z": 0},
                "faces": {
                    "up":    {"uv": [4, 4], "flag": flag, "texture": down},
                    "down":  {"uv": [4, 4], "flag": flag, "texture": down},
                    "north": {"uv": [4, 8], "flag": flag, "texture": side},
                    "south": {"uv": [4, 8], "flag": flag, "texture": side},
                    "west":  {"uv": [4, 8], "flag": flag, "texture": side},
                    "east":  {"uv": [4, 8], "flag": flag, "texture": side}
                }
            },
            {
                "size": {"x": 6, "y": 7, "z": 6},
                "translate": {"x": 0, "y": 1.5, "z": 0},
                "faces": {
                    "up":    {"uv": [4, 4], "flag": flag, "texture": up},
                    "north": {"uv": [4, 3.5], "flag": flag, "texture": side},
                    "south": {"uv": [4, 3.5], "flag": flag, "texture": side},
                    "west":  {"uv": [4, 3.5], "flag": flag, "texture": side},
                    "east":  {"uv": [4, 3.5], "flag": flag, "texture": side}
                }
            }
        ]);
        
        
        if (block.rotate.y == -1) {
            parts.push(...[
                {
                    "size": {"x": 2, "y": 3, "z": 2},
                    "translate": {"x": 0, "y": 6.5, "z": 0},
                    "faces": {
                        "north": {"uv": [8, 8], "flag": flag, "texture": dark_oak_planks},
                        "south": {"uv": [8, 8], "flag": flag, "texture": dark_oak_planks},
                        "west":  {"uv": [8, 8], "flag": flag, "texture": dark_oak_planks},
                        "east":  {"uv": [8, 8], "flag": flag, "texture": dark_oak_planks}
                    }
                }
            ]);
        } else if (block.rotate.y == 1) {
            matrix = mat4.create();
            const cd = block.getCardinalDirection();
            if (cd == DIRECTION.WEST || cd == DIRECTION.EAST) {
                mat4.rotateY(matrix, matrix, Math.PI / 2);
            }
            parts.push(...[
                {
                    "size": {"x": 12, "y": 2, "z": 2},
                    "translate": {"x": 0, "y": 6, "z": 0},
                    "faces": {
                        "up": {"uv": [8, 8], "flag": flag, "texture": dark_oak_planks},
                        "down": {"uv": [8, 8], "flag": flag, "texture": dark_oak_planks},
                        "north": {"uv": [8, 8], "flag": flag, "texture": dark_oak_planks},
                        "south": {"uv": [8, 8], "flag": flag, "texture": dark_oak_planks},
                        "west":  {"uv": [8, 8], "flag": flag, "texture": dark_oak_planks},
                        "east":  {"uv": [8, 8], "flag": flag, "texture": dark_oak_planks}
                    }
                },
                {
                   "size": {"x": 2, "y": 16, "z": 4},
                   "translate": {"x": 7, "y": 0, "z": 0},
                    "faces": {
                        "up": {"uv": [8, 8], "flag": flag, "texture": stone},
                        "down": {"uv": [8, 8], "flag": flag, "texture": stone},
                        "north": {"uv": [8, 8], "flag": flag, "texture": stone},
                        "south": {"uv": [8, 8], "flag": flag, "texture": stone},
                        "west":  {"uv": [8, 8], "flag": flag, "texture": stone},
                        "east":  {"uv": [8, 8], "flag": flag, "texture": stone}
                    }
                },
                {
                    "size": {"x": 2, "y": 16, "z": 4},
                    "translate": {"x": -7, "y": 0, "z": 0},
                    "faces": {
                        "up": {"uv": [8, 8], "flag": flag, "texture": stone},
                        "down": {"uv": [8, 8], "flag": flag, "texture": stone},
                        "north": {"uv": [8, 8], "flag": flag, "texture": stone},
                        "south": {"uv": [8, 8], "flag": flag, "texture": stone},
                        "west":  {"uv": [8, 8], "flag": flag, "texture": stone},
                        "east":  {"uv": [8, 8], "flag": flag, "texture": stone}
                    }
                }
            ]);
        } else {
            let tx = 0, tz = 0, sx = 2, sz = 2;
            if (neighbours.NORTH.id != BLOCK.AIR.id || neighbours.SOUTH.id != BLOCK.AIR.id) {
                sx = 2;
                tx = 0;
                tz = 0;
                sz = (neighbours.NORTH.id == neighbours.SOUTH.id) ? 16 : 13;
                if (sz == 13) {
                    tz = (neighbours.SOUTH.id != BLOCK.AIR.id) ? -1.5 : 1.5;
                }
            } else if (neighbours.WEST.id != BLOCK.AIR.id || neighbours.EAST.id != BLOCK.AIR.id) {
                sz = 2;
                tz = 0;
                tx = 0;
                sx = (neighbours.WEST.id == neighbours.EAST.id) ? 16 : 13;
                if (sx == 13) {
                    tx = (neighbours.WEST.id != BLOCK.AIR.id) ? -1.5 : 1.5;
                }
            }
            parts.push(...[
            {
                        "size": {"x": sx, "y": 2, "z": sz},
                        "translate": {"x": tx, "y": 6, "z": tz},
                        "faces": {
                            "up": {"uv": [8, 8], "flag": flag, "texture": dark_oak_planks},
                            "down": {"uv": [8, 8], "flag": flag, "texture": dark_oak_planks},
                            "north": {"uv": [8, 8], "flag": flag, "texture": dark_oak_planks},
                            "south": {"uv": [8, 8], "flag": flag, "texture": dark_oak_planks},
                            "west":  {"uv": [8, 8], "flag": flag, "texture": dark_oak_planks},
                            "east":  {"uv": [8, 8], "flag": flag, "texture": dark_oak_planks}
                        }
                    }
            ]);
            
            
        }
        
        const pos = new Vector(x, y, z);
        const lm = IndexedColor.WHITE;
        for(let part of parts) {
            default_style.pushAABB(vertices, {
                ...part,
                lm:         lm,
                pos:        pos,
                matrix:     matrix
            });
        }
    }

}