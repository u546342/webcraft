/**
 * Generate underworld infinity stones
 */
export default class Biome3LayerStone {

    /**
     * @param { import("../index.js").Terrain_Generator } generator
     */
    constructor(generator) {

        this.generator = generator

        this.noise2d = generator.noise2d
        this.noise3d = generator.noise3d
        this.block_manager = generator.block_manager
        this.maps = new Map()

    }

    generate(chunk, seed, rnd) {

        const BLOCK = this.generator.block_manager

        if(chunk.addr.y < 0)  {
            const { cx, cy, cz, cw, uint16View } = chunk.tblocks.dataChunk
            const block_id = BLOCK.STONE.id
            for(let x = 0; x < chunk.size.x; x++) {
                for(let z = 0; z < chunk.size.z; z++) {
                    for(let y = 0; y < chunk.size.y; y++) {
                        const index = cx * x + cy * y + cz * z + cw
                        uint16View[index] = block_id
                    }
                }
            }
        }

        return this.generator.generateDefaultMap(chunk)

    }

}