import {Color, DIRECTION_BIT} from '../../helpers.js';
import {MineGenerator} from './mine_generator.js';
import { Default_Terrain_Generator } from '../default.js';
import {BLOCK} from '../../blocks.js';

export default class MineGenerator2 extends Default_Terrain_Generator {

    constructor(seed, world_id) {
        super();
        this.setSeed(0);
        this.mine = new MineGenerator(this, 180, 2, 173);
    }

    async init() {}
    
    generate(chunk) {
        if(chunk.addr.y == 0) {
            for(let x = 0; x < chunk.size.x; x++) {
                for(let z = 0; z < chunk.size.z; z++) {
                    let n = (chunk.addr.x == 180 && chunk.addr.z == 173) ? 0 : 1;
                    for(let y = 0; y <= n; y++) {
                        this.setBlock(chunk, x, y, z, BLOCK.GRASS_DIRT);
                    }
                }
            }
        }
        
        this.mine.generate(chunk);
        
        let cell = {biome: {dirt_color: new Color(850 / 1024, 930 / 1024, 0, 0), code: 'Flat'}};
        let cells = Array(chunk.size.x).fill(null).map(el => Array(chunk.size.z).fill(cell));

        let addr = chunk.addr;
        let size = chunk.size;

        return {
            chunk: {
                id:     [addr.x, addr.y, addr.z, size.x, size.y, size.z].join('_'),
                blocks: {},
                seed:   chunk.seed,
                addr:   addr,
                size:   size,
                coord:  addr.mul(size),
            },
            options: {
                WATER_LINE: 63, // Ватер-линия
            },
            info: {
                cells: cells
            }
        };
    }
}