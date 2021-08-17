import {blocks} from '../biomes.js';
import {Color, Helpers, Vector} from '../helpers.js';
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

        let BRICK = blocks.BRICK;
        const GLASS = blocks.GLASS;
        let LIGHT = blocks.GLOWSTONE;

        const { blocks1 } = this;

        const wnd = [0,0,0,0,0,0,0,0,0];

        let r = aleaRandom.double();
        if(r < .2) {
            BRICK = blocks.STONE;
        } else if (r < .4) {
            BRICK = blocks.STONE_BRICK;
        }

        for(let x = 0; x < chunk.size.x; x++) {
            for (let z = 0; z < chunk.size.z; z++) {
                // AIR
                chunk.blocks[x][z] = Array(chunk.size.y).fill(null);
            }
        }

        if(chunk.addr.x % 10 == 0) {

            for(let x = 0; x < chunk.size.x; x++) {
                for (let z = 0; z < chunk.size.z; z++) {
                    if(x == 0 || x >= 14) {
                        chunk.blocks[x][z][0] = blocks.BEDROCK;
                    } else if (x == 1 || x == 13) {
                        chunk.blocks[x][z][0] = blocks.STONE;
                    } else if(x) {
                        chunk.blocks[x][z][0] = blocks.DIRT;
                    }
                }
            }

            // ЖД
            for(let z = 0; z < chunk.size.z; z++) {
                // рельсы
                chunk.blocks[7][z][12] = blocks.PLANK;
                // по краям рельс
                chunk.blocks[6][z][12] = blocks.STONE_BRICK;
                chunk.blocks[7][z][12] = blocks.STONE_BRICK;
                // шпалы
                if(z % 2 == 0) {
                    for(let a of [4, 5, 6, 7, 8, 9]) {
                        chunk.blocks[a][z][12 + 1] = blocks.STONE;
                    }
                }
                // рельсы
                for(let y = 14; y < 15; y++) {
                    chunk.blocks[5][z][y] = blocks.WOOL_BLACK;
                    chunk.blocks[8][z][y] = blocks.WOOL_BLACK;
                }
                // столбы
                if(z == 4) {
                    for(let y = 0; y < 12; y++) {
                        chunk.blocks[5][z][y] = blocks.STONE_BRICK;
                        chunk.blocks[8][z][y] = blocks.STONE_BRICK;
                    }
                }
            }

            // разметка
            for(let x = 1; x < chunk.size.z-2; x += 2) {
                chunk.blocks[15][x + 1][0] = blocks.SNOW_BLOCK;
            }

        } else {

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

            let levels = aleaRandom.double() * 10 + 4;
            if (levels > 8) {
                levels = aleaRandom.double() * 10 + 4;
            }
            levels = levels | 0;

            let H = 1;
            let mainColor = blocks1[(Math.random() * blocks1.length | 0)];

            if (aleaRandom.double() * 10 < 1) {
                levels = -1;
                H = 0;
            }

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

                // строения на крыше
                if (level === levels + 1) {
                    for(let sz of [1, 2, 2]) {
                        let ceil_x = 3 + parseInt(aleaRandom.double() * 8);
                        let ceil_z = 4 + parseInt(aleaRandom.double() * 8);
                        for(let i = 0; i < sz; i++) {
                            for(let j = 0; j < sz; j++) {
                                chunk.blocks[ceil_x + i][ceil_z + j][H + 1] = mainColor;
                            }
                        }
                    }
                }

                if (aleaRandom.double() * 10 < 1) {
                    mainColor = blocks1[(Math.random() * blocks1.length | 0)];
                }

                for (let i=0;i<12;i++) {
                    wnd[i] = aleaRandom.double() * 12 < 1.0 ? LIGHT : GLASS;
                }

                for (let y = H + 1; y <= H + h; y++) {
                    for (let x = 0; x <= 10; x++) {
                        let b = -1;

                        if (x > 0 && x < 3) {
                            b = 0;
                        }
                        if (x > 3 && x < 7) {
                            b = 1;
                        }
                        if (x > 7 && x < 10) {
                            b = 2;
                        }

                        chunk.blocks[x + 2][3][y] = b >= 0 ? wnd[b * 4 + 0]: BRICK;
                        chunk.blocks[x + 2][13][y] = b >= 0 ? wnd[b * 4 + 1]: BRICK;
                        chunk.blocks[2][x + 3][y] = b >= 0 ? wnd[b * 4 + 2]: BRICK;
                        chunk.blocks[12][x + 3][y] = b >= 0 ? wnd[b * 4 + 3]: BRICK;
                    }
                }

                H += h + 1;
            }

            if (levels < 0 || aleaRandom.double() * 20 < 1) {
                for (let x = 3; x <= 11; x++) {
                    for (let z = 4; z <= 12; z++) {
                        chunk.blocks[x][z][H] = blocks.DIRT;
                    }
                }
                this.plantTree({
                    height: (aleaRandom.double()*4|0) + 5,
                    type: {
                        trunk: blocks.SPRUCE, leaves: blocks.SPRUCE_LEAVES, height: 7
                    }
                }, chunk,
                    5 + (aleaRandom.double() * 4 | 0), H+1, 5 + (aleaRandom.double() * 4 | 0));
            }

            // разметка
            for(let x = 1; x < chunk.size.z-2; x += 2) {
                chunk.blocks[x][0][0] = blocks.SNOW_BLOCK;
                chunk.blocks[15][x + 1][0] = blocks.SNOW_BLOCK;
            }

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

    plantTree(options, chunk, x, y, z) {
        const height        = options.height;
        const type        = options.type;
        let ystart = y + height;
        // ствол
        for(let p = y; p < ystart; p++) {
            if(chunk.getBlock(x + chunk.coord.x, p + chunk.coord.y, z + chunk.coord.z).id >= 0) {
                if(x >= 0 && x < chunk.size.x && z >= 0 && z < chunk.size.z) {
                    chunk.blocks[x][z][p] = type.trunk;
                }
            }
        }
        // дуб, берёза
        let py = y + height;
        for(let rad of [1, 1, 2, 2]) {
            for(let i = x - rad; i <= x + rad; i++) {
                for(let j = z - rad; j <= z + rad; j++) {
                    if(i >= 0 && i < chunk.size.x && j >= 0 && j < chunk.size.z) {
                        let m = (i == x - rad && j == z - rad) ||
                            (i == x + rad && j == z + rad) ||
                            (i == x - rad && j == z + rad) ||
                            (i == x + rad && j == z - rad);
                        let m2 = (py == y + height) ||
                            (i + chunk.coord.x + j + chunk.coord.z + py) % 3 > 0;
                        if(m && m2) {
                            continue;
                        }
                        let b = chunk.blocks[i][j][py];
                        if(!b || b.id >= 0 && b.id != type.trunk.id) {
                            chunk.blocks[i][j][py] = type.leaves;
                        }
                    }
                }
            }
            py--;
        }
    }

}
