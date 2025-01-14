import { SpriteAtlas } from "./core/sprite_atlas.js";
import { Resources } from "./resources.js";
import { PlayerInventory } from "./player_inventory.js";
import { MySprite, MyTilemap } from "../tools/gui/MySpriteRenderer.js";
import { Effect } from "./block_type/effect.js";
import { Window } from "../tools/gui/wm.js";
import { CraftTableInventorySlot } from "./window/base_craft_window.js";
import { INVENTORY_HOTBAR_SLOT_COUNT } from "./constant.js";

const MAX_NAME_SHOW_TIME = 2000;

//
const LIVE_SHIFT_RANDOM = new Array(1024);
for(let i = 0; i < LIVE_SHIFT_RANDOM.length; i++) {
    LIVE_SHIFT_RANDOM[i] = Math.round(Math.random());
}

//
class Strings {

    constructor() {
        this.strings = [
            {text: null, set_time: null, measure: null, max_time: null},
            {text: null, set_time: null, measure: null, max_time: null}
        ];
    }
    
    // set new text
    setText(index, text, max_time) {
        this.strings[index].text = text;
        if(text) {
            this.strings[index].set_time = performance.now();
            this.strings[index].measure = null;
            this.strings[index].max_time = max_time;
        }
    }

    // set text if not same with previous
    updateText(index, text, max_time) {
        if(this.strings[index].text == text) {
            return false;
        }
        this.setText(index, text, max_time);
    }

    // draw
    draw(hud, y_margin, zoom, hud_pos, cell_size) {

        let draw_count = 0

        // TODO: pixi
        return

        // draw strings on center of display
        for(let i = 0; i < this.strings.length; i++) {
            const item = this.strings[i];
            if(!item.text) {
                continue;
            }
            const time_remains = performance.now() - item.set_time;
            const max_time = item.max_time || MAX_NAME_SHOW_TIME;
            if(time_remains > max_time) {
                continue;
            }
            //
            y_margin += (i * cell_size / 2);
            // Text opacity
            const alpha = Math.min(2 - (time_remains / max_time) * 2, 1);
            let aa = Math.ceil(255 * alpha).toString(16);
            if(aa.length == 1) {
                aa = '0' + aa;
            }
            //
            ctx.textBaseline = 'bottom';
            ctx.font = Math.round(24 * zoom) + 'px ' + UI_FONT;
            // Measure text
            if(!item.measure) {
                item.measure = ctx.measureText(item.text);
            }
            ctx.fillStyle = '#000000' + aa;
            ctx.fillText(item.text, hud.width / 2 - item.measure.width / 2, hud_pos.y + cell_size - y_margin);
            ctx.fillStyle = '#ffffff' + aa;
            ctx.fillText(item.text, hud.width / 2 - item.measure.width / 2, hud_pos.y + cell_size - y_margin - 2 * zoom);
            //
            draw_count++;
        }

        return draw_count > 0

    }

}

export class Hotbar {

    constructor(hud) {

        // console.log(new Error().stack)

        this.hud = hud
        this.last_damage_time = null
        this.strings = new Strings()

        // Load hotbar atlases
        const all = []
        all.push(this.effect_icons = new SpriteAtlas().fromFile('./media/gui/inventory2.png'))

        this.icons_atlas = Resources.atlas.icons
        
        Promise.all(all).then(_ => {

            this.tilemap = new MyTilemap()
            hud.wm.addChild(this.tilemap)

            // Init sprites
            this.sprites = {

                slot:               1,
                selector:           1,

                live:               0.9,
                live_half:          0.9,
                live_bg_black:      0.9,
                live_bg_white:      0.9,
                live_poison:        0.9,
                live_poison_half:   0.9,

                food_bg_black:      0.9,
                food:               0.9,
                food_half:          0.9,
                food_poison:        0.9,
                food_poison_half:   0.9,

                oxygen:             0.9,
                oxygen_half:        0.9,

                armor_bg_black:     0.9,
                armor:              0.9,
                armor_half:         0.9
            }

            this.hotbar_atlas = Resources.atlas.hotbar

            for(const [name, scale] of Object.entries(this.sprites)) {
                this.sprites[name] = new MySprite(this.hotbar_atlas.getSpriteFromMap(name), scale * this.zoom)
            }

            // Effects sprites
            this.effect_sprites = {}
            for(let effect of Effect.get()) {
                this.effect_sprites[effect.id] = new MySprite(Resources.atlas.bn.getSpriteFromMap(effect.icon), 1 * this.zoom)
            }

            this.sprite_effect_bg = new MySprite(Resources.atlas.bn.getSpriteFromMap('button_black'), 1 * this.zoom)

            this.hud.add(this, 0)

        })

    }

    /**
    * Создание слотов для инвентаря
    * @param int sz Ширина / высота слота
    */
    createInventorySlots(sz) {

        sz *= this.zoom

        const inventory_slots = this.inventory_slots = new Window(0, 0, INVENTORY_HOTBAR_SLOT_COUNT * sz, sz, 'hotbar_inventory_slots')
        // inventory_slots.style.background.color = '#00000044'
        inventory_slots.auto_center = false
        inventory_slots.catchEvents = false

        for(let i = 0; i < INVENTORY_HOTBAR_SLOT_COUNT; i++) {
            const lblSlot = new CraftTableInventorySlot(i * sz, 0, sz, sz, `lblSlot${i}`, null, null, this, i)
            inventory_slots.add(lblSlot)
        }
        this.hud.wm.addChild(inventory_slots)

    }

    get zoom() {
        return UI_ZOOM
    }

    /**
     * @param {PlayerInventory} inventory 
     */
    setInventory(inventory) {

        this.inventory = inventory

        this.createInventorySlots(40)

    }

    //
    damage(damage_value, reason_text) {
        this.last_damage_time = performance.now();
        console.error('error_not_implemented', damage_value, reason_text);
        this.inventory.player.world.server.ModifyIndicator('live', -damage_value, reason_text);
    }

    setState(new_state) {
        for(const [key, value] of Object.entries(new_state)) {
            this[key] = value;
        }
    }

    // выводит полосу
    drawStrip(x, y, val, full, half, bbg = null, wbg = null, blink = false, wave = false, reverse = false) {
        const size = full.width
        val /= 2
        const spn = Math.round(performance.now() / 75)
        if (bbg) {
            const bg = blink ? wbg : bbg
            for (let i = 0; i < 10; i++) {
                const sy = wave ? LIVE_SHIFT_RANDOM[(spn + i) % LIVE_SHIFT_RANDOM.length] * 5 : 0
                bg.x = x + ((reverse) ? i * size : (size * 9 - i * size))
                bg.y = y + sy
                this.tilemap.drawImage(bg)
            }
        }
        for (let i = 0; i < 10; i++) {
            const sy = wave ? LIVE_SHIFT_RANDOM[(spn + i) % LIVE_SHIFT_RANDOM.length] * 5 : 0
            const d = val - 0.5
            if ( d > i) {
                full.x = x + ((!reverse) ? i * size : (size * 9 - i * size))
                full.y = y + sy
                this.tilemap.drawImage(full)
            } else if (d == i) {
                half.x = x + ((!reverse) ? i * size : (size * 9 - i * size))
                half.y = y + sy
                this.tilemap.drawImage(half)
            }
        }
    }

    drawHUD(hud) {

        this.tilemap.clear()

        const player  = this.inventory.player;

        const visible = !player.game_mode.isSpectator()

        this.inventory_slots.visible = visible

        if(!visible) {
            return false;
        }

        // Inventory slots
        this.inventory_slots.transform.position.set(hud.width / 2 - this.inventory_slots.w / 2, hud.height - this.inventory_slots.h - 6 * this.zoom)
        if(this.inventory_update_number != this.inventory.update_number) {
            this.inventory_update_number = this.inventory.update_number
            this.inventory_slots.children.map(w => {
                if(w instanceof CraftTableInventorySlot) {
                    w.setItem(w.getItem(), false)
                }
            })
        }

        const mayGetDamaged = player.game_mode.mayGetDamaged();
        if (mayGetDamaged) {
            const left = 180 * this.zoom
            const right = 15 * this.zoom
            const bottom_one_line = 70 * this.zoom
            const bottom_two_line = 90 * this.zoom
            const diff = Math.round(performance.now() - Qubatch.hotbar.last_damage_time);
            // жизни
            const live = player.indicators.live.value;
            // моргание от урона 
            const is_damage = (diff > 0 && diff < 100 || diff > 200 && diff < 300)
            const low_live = live < 3
            if (player.getEffectLevel(Effect.POISON) > 0) {
                this.drawStrip(hud.width / 2 - left, hud.height - bottom_one_line , live, this.sprites.live_poison, this.sprites.live_poison_half, this.sprites.live_bg_black, this.sprites.live_bg_white, is_damage, low_live)
            } else {
                this.drawStrip(hud.width / 2 - left, hud.height - bottom_one_line , live, this.sprites.live, this.sprites.live_half, this.sprites.live_bg_black, this.sprites.live_bg_white, is_damage, low_live)
            }
            // еда
            const food = player.indicators.food.value;
            if (player.getEffectLevel(Effect.HUNGER) > 0) {
                this.drawStrip(hud.width / 2 + right, hud.height - bottom_one_line , food, this.sprites.food_poison, this.sprites.food_poison_half, this.sprites.food_bg_black, null, false, false, true);
            } else {
                this.drawStrip(hud.width / 2 + right, hud.height - bottom_one_line , food, this.sprites.food, this.sprites.food_half, this.sprites.food_bg_black, null, false, false, true);
            }
            // кислород
            const oxygen = player.indicators.oxygen.value;
            if (oxygen < 20) {
                this.drawStrip(hud.width / 2 + right,  hud.height - bottom_two_line, oxygen, this.sprites.oxygen, this.sprites.oxygen_half, null, null, false, false, true)
            }
            // броня
            const armor = this.inventory.getArmorLevel()
            if (armor > 0) {
                this.drawStrip(hud.width / 2 - left, hud.height - bottom_two_line, armor, this.sprites.armor, this.sprites.armor_half, this.sprites.armor_bg_black) 
            }
        }
        // хотбар и селектор
        const sx = this.sprites.slot.width
        const sy = this.sprites.slot.height + 5 * this.zoom
        for (let i = 0; i < 9; i++) {
            this.tilemap.drawImage(this.sprites.slot, (hud.width - sx * 9) / 2 + i * sx, hud.height - sy)
        }
        for (let i = 0; i < 9; i++) {
            if (i == this.inventory.getRightIndex()) {
                this.tilemap.drawImage(this.sprites.selector, (hud.width - sx * 9) / 2 + i * sx - 2 * this.zoom, hud.height - sy - 2 * this.zoom)
            }
        }

        // TODO: pixi
        this.drawEffects(hud)

    }

    drawEffects(hud) {
        const margin = 4 * this.zoom
        let pos = margin
        const bg = this.sprite_effect_bg
        for(let effect of this.inventory.player.effects.effects) {
            const sprite = this.effect_sprites[effect.id]
            const paddingx = bg.width / 2 - sprite.width / 2
            const paddingy = bg.height / 2 - sprite.height / 2
            const x = hud.width - pos - bg.width
            const y = margin
            this.tilemap.drawImage(bg, x, y)
            this.tilemap.drawImage(sprite, x + paddingx, y + paddingy)
            pos += margin + bg.width
        }
    }

}