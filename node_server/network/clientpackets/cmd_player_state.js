import { ServerClient } from "../../../www/js/server_client.js";
import { CMD_ENTITY_INDICATORS } from "../serverpackets/cmd_entity_indicators.js";

export default class packet_reader {

    static old_distance = 0;
    // must be puto to queue
    static get queue() {
        return false;
    }

    // which command can be parsed with this class
    static get command() {
        return ServerClient.CMD_PLAYER_STATE;
    }

    // 
    static async read(player, packet) {
        const data = packet.data;
        player.world.changePlayerPosition(player, data);
  
        //
        if (!player.game_mode.isSpectator()) {
            const distance = Math.sqrt(Math.pow(data.pos.x, 2) + Math.pow(data.pos.y, 2) + Math.pow(data.pos.z, 2));
            if (distance.toFixed(0) != packet_reader.old_distance.toFixed(0)) {
                player.state.stats.distance++;
                if ((player.state.stats.distance % 10) == 0) {
                    player.changeFood(-1);
				}
                packet_reader.old_distance = distance;
            }
        }
        return true;
    }

}