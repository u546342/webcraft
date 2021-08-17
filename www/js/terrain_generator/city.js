import {blocks} from '../biomes.js';
import { Color, Vector } from '../helpers.js';
import {impl as alea} from '../../vendors/alea.js';
import {BLOCK} from '../blocks.js';

export default class Terrain_Generator {

    constructor() {
        this.seed = 0;

        const blocks = this.blocks1 = [];
        for (let key in BLOCK) {
            if (key.substring(0, 4) === 'TERR' || key.substring(0, 4) === 'WOOL') {
                blocks.push(BLOCK[key]);
            }
        }

        for(let key of Object.keys(blocks)) {
            let b = blocks[key];
            b = {...b};
            delete(b.texture);
            blocks[key] = b;
        }
    }


    setSeed(seed) {
    }

    generate(chunk) {

        const seed                  = chunk.id;
        const aleaRandom            = new alea(seed);

        const BRICK = blocks.BRICK;
        const GLASS = blocks.GLASS;

        const { blocks1 } = this;

        for(let x = 0; x < chunk.size.x; x++) {
            for (let z = 0; z < chunk.size.z; z++) {
                // AIR
                chunk.blocks[x][z] = Array(chunk.size.y).fill(null);
            }
        }

        for(let x = 0; x < chunk.size.x; x++) {
            for (let z = 0; z < chunk.size.z; z++) {
                for (let y = 0; y < 1; y++) {
                    if (x > 0 && x < 14 && z > 1 && z < 15) {
                        // территория строений
                        // трава
                        if (x >= 2 && x <= 12 && z >= 3 && z <= 13) {
                            chunk.blocks[x][z][y] = blocks.DIRT;
                        } else {
                            chunk.blocks[x][z][y] = blocks.STONE;
                        }
                    } else {
                        // дороги вокруг дома
                        chunk.blocks[x][z][y] = blocks.BEDROCK;
                    }
                }
            }
        }

        // этажи

        if (aleaRandom.double() * 10 > 1) {
            let levels = aleaRandom.double() * 10 + 4;
            if (levels > 8) {
                levels = aleaRandom.double() * 10 + 4;
            }
            levels = levels | 0;

            let H = 1;
            let mainColor = blocks1[(Math.random() * blocks1.length | 0)];

            for (let level = 1; level <= levels + 1; level++) {
                let h = (aleaRandom.double() * 2 | 0) + 3;

                if (level === levels + 1) {
                    h = 0;
                }
                let y = H;
                for (let x = 2; x <= 12; x++) {
                    for (let z = 3; z <= 13; z++) {
                        chunk.blocks[x][z][y] = mainColor;
                    }
                }

                if (aleaRandom.double() * 10 < 1) {
                    mainColor = blocks1[(Math.random() * blocks1.length | 0)];
                }

                for (let y = H + 1; y <= H + h; y++) {
                    for (let x = 0; x <= 10; x++) {
                        let b = GLASS;
                        if (x == 0 || x == 3 || x == 7 || x == 10) {
                            b = BRICK;
                        }
                        chunk.blocks[x + 2][3][y] = b;
                        chunk.blocks[x + 2][13][y] = b;

                        chunk.blocks[2][x + 3][y] = b;
                        chunk.blocks[12][x + 3][y] = b;
                    }
                }

                H += h + 1;
            }
        } else {
            for (let x = 6; x <= 10; x++) {
                for (let z = 6; z <= 10; z++) {
                    let height = parseInt(aleaRandom.double() * 10 + 5);
                    for (let y = 1; y < height; y++) {
                        chunk.blocks[x][z][y] = BRICK;
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
