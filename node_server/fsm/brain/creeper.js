import {FSMBrain} from "../brain.js";
import { Vector } from "../../../www/js/helpers.js";
import {PickatActions} from "../../../www/js/block_action.js";
import {ServerClient} from "../../../www/js/server_client.js";

const FOLLOW_DISTANCE       = 10;
const DISTANCE_LOST_TRAGET  = 16;
const DISTANCE_DETONATION   = 3;
const DETONATION_TIMER      = 1500; //ms
const EXPLODE_DEFAULT_RAD   = 2.55;

export class Brain extends FSMBrain {

    constructor(mob) {
        super(mob);
        //
        this.prevPos        = new Vector(mob.pos);
        this.lerpPos        = new Vector(mob.pos);
        this.pc             = this.createPlayerControl(this, {
            baseSpeed: 1/2,
            playerHeight: 1.6,
            stepHeight: 1
        });
        mob.extra_data.play_death_animation = false;
        this.detonationTime = 0;
        this.isAggrressor = true;
        this.explosion_damage = 12;
        this.players_damage_distance = DISTANCE_DETONATION;
        // Начинаем с просто "Стоять"
        this.stack.pushState(this.doStand);
    }

    isTarget() {
        if (this.isAggrressor && this.target == null) {
            let mob = this.mob;
            let players = this.getPlayersNear(mob.pos, FOLLOW_DISTANCE, true);
            for(let player of players) {
                const user_id = player.session.user_id;;
                console.log("[AI] find target and go " + user_id);
                this.target = user_id;
                this.stack.replaceState(this.doCatch);
                return true;
            }
        }
        return false;
    }

    runPanic() {

	}

    doStand(delta) {
        super.doStand(delta);

        if (this.isTarget()) {
            return;
        }
    }

    doForward(delta) {
        super.doForward(delta);

        if (this.isTarget()) {
            return;
        }
    }

    // Chasing a player
    async doCatch(delta) {

        this.updateControl({
            yaw: this.mob.rotate.z,
            forward: true,
            jump: this.checkInWater()
        });

        const mob = this.mob;
        const player = mob.getWorld().players.get(this.target);
        if(!player || !player.game_mode.getCurrent().can_take_damage) {
            return this.lostTarget();
        }

        //
        const dist = mob.pos.distance(player.state.pos);
        if (dist > DISTANCE_LOST_TRAGET) {
            return this.lostTarget();
        }

        if (dist < DISTANCE_DETONATION) {
            this.detonationTime = performance.now();
            mob.extra_data.detonation_started = true;
            await mob.getWorld().applyActions(null, {
                play_sound: [
                    { tag: 'madcraft:block.player', action: 'fuse', pos: new Vector(mob.pos) }
                ]
            });
            this.stack.replaceState(this.doTimerDetonation);
        }

        if (Math.random() < 0.5) {
            this.mob.rotate.z = this.angleTo(player.state.pos);
        }

        this.applyControl(delta);
        this.sendState();
    }

    lostTarget() {
        // console.log("[AI] mob " + this.mob.id + " lost player and stand");
        const mob = this.mob;
        mob.extra_data.detonation_started = false;
        this.target = null;
        this.isStand(1.0);
        this.sendState();
    }

    //
    doTimerDetonation(delta) {
        this.updateControl({
            jump: this.checkInWater(),
            forward: false
        });
        this.applyControl(delta);
        this.sendState();
        const mob = this.mob;
        const player = mob.getWorld().players.get(this.target);
        if(!player || !player.game_mode.getCurrent().can_take_damage) {
            return this.lostTarget();
        }
        const dist = mob.pos.distance(player.state.pos);
        if (dist < DISTANCE_DETONATION) {
            const time = performance.now() - this.detonationTime;
            if (time > DETONATION_TIMER) {
                this.mobDetonation(EXPLODE_DEFAULT_RAD);
            }
        } else {
            mob.extra_data.detonation_started = false;
            this.stack.replaceState(this.doCatch);
        }
    }

    //
    async mobDetonation(rad) {
        // console.log("[AI] mob " + this.mob.id + " detonation");
        const mob = this.mob;
        const mobPos = mob.pos.clone();
        const mobPosFloored = mobPos.clone().flooredSelf();
        const world = mob.getWorld();
        // Actions
        const actions = new PickatActions();
        actions.blocks.options.ignore_check_air = true;
        actions.blocks.options.on_block_set = false;
        // Extrude blocks
        const air = { id: 0 };
        const out_rad = Math.ceil(rad);
        const check_pos = mob.pos.flooredSelf().add(new Vector(.5, 0, .5));
        for (let i = -out_rad; i < out_rad; i++) {
            for (let j = -out_rad; j < out_rad; j++) {
                for (let k = -out_rad; k < out_rad; k++) {
                    const air_pos = mobPosFloored.add(new Vector(i, k, j));
                    if (air_pos.distance(check_pos) <= rad) {
                        actions.addBlocks([
                            {pos: air_pos, item: air}
                        ]);
                    }
                }
            }
        }
        // Kill mob
        await mob.kill();
        // Add sound
        actions.addPlaySound({ tag: 'madcraft:block.creeper', action: 'explode', pos: mobPos.clone() });
        actions.addExplosions([{pos: mobPos.clone().add(new Vector(0, mob.height / 2, 0))}]);
        // Found all players around creeper
        const players = this.getPlayersNear(mobPos, this.players_damage_distance, true);
        const custom_packets = {
            user_ids: [],
            list: [
                {
                    name: ServerClient.CMD_PLAY_SOUND,
                    data: { tag: 'madcraft:block.player', action: 'hit', pos: mobPos.clone()}
                }
            ]
        };
        for(let i = 0; i < players.length; i++) {
            const player = players[i];
            // change live
            player.changeLive(-this.explosion_damage);
            // play hit sound for this.player
            custom_packets.user_ids.push(player.session.user_id);
        }
        //
        if(custom_packets.list.length > 0) {
            world.sendSelected(custom_packets.list, custom_packets.user_ids)
        }
        //
        await world.applyActions(null, actions);
    }

}