import {ServerClient} from "../../www/js/server_client.js";

export class ServerPlayerDamage {
    
    constructor(player) {
        this.player = player;
        
        this.food_tick_timer = 0;
        this.oxygen_tick_timer = 0;
    }
    
    

    tick(delta, tick_number) {
        const player = this.player;
        if(player.is_dead || !player.game_mode.mayGetDamaged()) {
            return false;
        }
        // food из вики
        if (this.food_exhaustion_level > 4) {
            this.food_exhaustion_level -= 4;
            if (this.food_saturation_level > 0) {
                this.food_saturation_level = Math.max(this.food_saturation_level - 1, 0);
            } else {
                this.food_level = Math.max(this.food_level - 1, 0);
            }
        }
        if (this.food_level >= 18) {
            this.food_timer++;
            if (this.food_timer >= 80) {
                this.food_timer = 0;
                this.live_level = Math.min(this.live_level + 1, 20);
                this.addExhaustion(3);
            }
        } else if (this.food_level <= 0) {
            this.food_timer++;
            if (this.food_timer >= 80) {
                this.food_timer = 0;
                this.live_level = Math.max(this.live_level - 1, 0);
            }
        } else {
            this.food_timer = 0;
        }
        
        
        
        
        

        const params = {
            tick_number,
            tblocks: {
                head: world.getBlock(player.getEyePos().floored()),
                legs: world.getBlock(player.state.pos.floored())
            }
        }
        // Утопление + удушение
        this.checkLackOfOxygenAndAsphyxiation(params);
    }

    // Check lack of oxygen and asphyxiation
    checkLackOfOxygenAndAsphyxiation(params) {
        const player = this.player;
        const world = player.world;
        if(player.is_dead || !player.game_mode.getCurrent().asphyxiation) {
            return false;
        }
        const LOST_TICKS = 10;
        const GOT_TICKS = 5;
        if(((params.tick_number % LOST_TICKS) != 0) && (params.tick_number % GOT_TICKS) != 0) {
            return false;
        }
        const ind_def = world.getDefaultPlayerIndicators().oxygen;
        const ind_player = player.state.indicators[ind_def.name];
        const mat = params.tblocks.head.material;
        if(mat.has_oxygen) {
            if((params.tick_number % GOT_TICKS) == 0) {
                if(ind_player.value < ind_def.value) {
                    player.changeIndicator(ind_def.name, 1)
                }
            }
        } else {
            if((params.tick_number % LOST_TICKS) == 0) {
                if(ind_player.value > 0) {
                    player.changeIndicator(ind_def.name, -1);
                } else {
                    player.changeIndicator('live', -1);
                    if(player.state.indicators.live.value % 2 == 1) {
                        this.sendDamageSound('hit');
                    }
                }
            }
        }
    }

    sendDamageSound(action) {
        const packets = [{
            name: ServerClient.CMD_PLAY_SOUND,
            data: { tag: 'madcraft:block.player', action: action, pos: null}
        }];
        this.player.world.sendSelected(packets, [this.player.session.user_id]);
    }

}