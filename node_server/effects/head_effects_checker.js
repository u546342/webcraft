import { TBlock } from "../../www/js/typed_blocks3.js";
import { ServerPlayer } from "../server_player.js";
import { LackOfOxygenAndAsphyxiationEffectID, LackOfOxygenAndAsphyxiationEffect } from "./lack_of_oxygen_and_asphyxiation_effect.js";



class HeadEffectChecker {
    /**
     * 
     * @param {ServerPlayer} player 
     * @param {TBlock} block 
     */

    checkEffectOfBlock(player, block) {

        // now it's only one effect
        /**
         * @type {null|LackOfOxygenAndAsphyxiationEffect}
         */
        let effect = null;
        for (let i = 0; i < player.effects.length; i++) {
            if (player.effects[i].effectId == LackOfOxygenAndAsphyxiationEffectID) {
                effect = player.effects[i];
            }
        }
        if (this.blockHasOxygen(block)){
            if (effect === null) {
                return;
            }
            effect.oxygenGot();
        } else {
            if (effect === null) {
                effect = new LackOfOxygenAndAsphyxiationEffect(player);
            }
            effect.oxygenBeenLost();
        }
    }

    /**
     * @private
     * @param {TBlock} block 
     * @returns {boolean}
     */
    blockHasOxygen(block){
        //[TODO] make better check with other types of material
        if(block.material.is_water === true){
            return false;
        }
        return true;
    }
}
export default new HeadEffectChecker();