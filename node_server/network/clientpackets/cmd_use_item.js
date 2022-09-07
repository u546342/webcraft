import { ServerClient } from "../../../www/js/server_client.js";

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
        console.log(packet);
        // do nothing
        return true;
    }

}