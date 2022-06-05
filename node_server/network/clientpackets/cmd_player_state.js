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
        const distance = Math.sqrt(Math.pow(data.pos.x, 2) + Math.pow(data.pos.y, 2) + Math.pow(data.pos.z, 2));
       // console.log(distance.toFixed(3) + " " + packet_reader.old);
        if (distance.toFixed(0) > packet_reader.old_distance.toFixed(0)) {
            player.state.stats.distance++;
            if ((player.state.stats.distance % 10) == 0) {
                player.state.indicators.food.value--;
                console.log(player.state.indicators.food);
			}
            packet_reader.old_distance = distance;
		}

      /*  if ((distance.toFixed(3) % 1) == 0) {
            player.state.stats.distance++;
            console.log(distance);
        }
        if ((distance.toFixed(0) % 10) == 0) {
            player.state.indicators.food.value = 5;
            //new CMD_ENTITY_INDICATORS(player);
           // console.log(player.state.indicators.food);
        }
        packet_reader.old = distance;
        */
        return true;
    }

}