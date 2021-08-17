import {blocks} from '../biomes.js';
import { Color, Vector } from '../helpers.js';
import {impl as alea} from '../../vendors/alea.js';

export default class Terrain_Generator {

    constructor() {
        this.seed = 0;
    }


    setSeed(seed) {
    }

    generate(chunk) {

        const seed                  = chunk.id;
        const aleaRandom            = new alea(seed);

        for(let x = 0; x < chunk.size.x; x++) {
            for(let z = 0; z < chunk.size.z; z++) {
                // AIR
                chunk.blocks[x][z] = Array(chunk.size.y).fill(null);

                for(let y = 0; y < 1; y++) {
                    if(x > 0 && x < 14 && z > 1 && z < 15) {
                        // территория строений
                        // трава
                        if(x >= 2 && x <= 12 && z >= 3 && z <= 13) {
                            chunk.blocks[x][z][y] = blocks.DIRT;
                        } else {
                            chunk.blocks[x][z][y] = blocks.STONE;
                        }
                    } else {
                        // дороги вокруг дома
                        chunk.blocks[x][z][y] = blocks.BEDROCK;
                    }
                }

                if(x > 5 && x < 10) {
                    if(z > 5 && z < 10) {
                        let height = parseInt(aleaRandom.double() * 10 + 5);
                        for(let y = 1; y < height; y++) {
                            chunk.blocks[x][z][y] = blocks.BRICK;
                        }
                    }
                }

            }
        }

        // разметка
        for(let x = 1; x < chunk.size.z-2; x += 2) {
            chunk.blocks[x][0][0] = blocks.SNOW_BLOCK;
            chunk.blocks[15][x + 1][0] = blocks.SNOW_BLOCK;
        }

        let cell = {biome: {dirt_color: new Color(980 / 1024, 980 / 1024, 0, 0)}};
        let cells = Array(chunk.size.x).fill(null).map(el => Array(chunk.size.z).fill(cell));

        return {
            chunk: chunk,
            options: {
                WATER_LINE: 63, // Ватер-линия
            },
            info: {
                cells: cells
            }
        };

    }

}