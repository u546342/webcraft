import { ServerClient } from "../../../www/js/server_client.js";

const TIME_COOLDOWN = 100;
const TIME_CAST = 17;

export default class packet_reader {

    // must be put to queue
    static get queue() {
        return false;
    }

    // ping from player
    static get command() {
        return ServerClient.CMD_USE_ITEM;
    }

    // use item
    static async read(player, packet) {
        const data = packet.data;
        const item = player.getItemInHand();
        if (item && item.count > 0 && player.cast.time == 0) {
            if (data.start) {
                player.cast.item = item.id;
                player.cast.time = TIME_CAST;
            }
        }
        if (!data.start) {
            player.cast.item = -1;
            player.cast.time = 0;
        }
        console.log("!!! > " + data.start);
        // do nothing
        return true;
    }

}