import {BLOCK} from "../blocks.js";
import {Button, Label, Window} from "../../tools/gui/wm.js";
import {CraftTableInventorySlot} from "./base_craft_window.js";
import {ServerClient} from "../server_client.js";

export default class ChestWindow extends Window {

    constructor(x, y, w, h, id, title, text, inventory) {

        super(x, y, w, h, id, title, text);

        this.width *= this.zoom;
        this.height *= this.zoom;
        this.style.background.image_size_mode = 'stretch';

        this.server     = inventory.player.world.server;
        this.inventory  = inventory;
        this.loading    = false;

        // Get window by ID
        const ct = this;
        ct.style.background.color = '#00000000';
        ct.style.border.hidden = true;
        ct.setBackground('./media/gui/form-chest.png');
        ct.hide();

        this.dragItem = null;

        // Ширина / высота слота
        this.cell_size = 36 * this.zoom;

        // Создание слотов сундука
        this.createChest(this.cell_size);
        
        // Создание слотов для инвентаря
        this.createInventorySlots(this.cell_size);

        // Обработчик открытия формы
        this.onShow = function() {
            this.getRoot().center(this);
            Game.releaseMousePointer();
            Game.sounds.play(BLOCK.CHEST.sound, 'open');
        }
        
        // Обработчик закрытия формы
        this.onHide = function() {
            // Drag
            let dragItem = this.getRoot().drag.getItem();
            if(dragItem) {
                this.inventory.increment(dragItem.item);
            }
            this.getRoot().drag.clear();
            Game.sounds.play(BLOCK.CHEST.sound, 'close');
            // @todo send close chest
            Game.world.server.InventoryNewState(this.inventory.exportItems(), []);
        }

        // Add labels to window
        ct.add(this.lbl1 = new Label(15 * this.zoom, 12 * this.zoom, 80 * this.zoom, 30 * this.zoom, 'lbl1', null, 'Chest'));
        ct.add(new Label(15 * this.zoom, 147 * this.zoom, 80 * this.zoom, 30 * this.zoom, 'lbl2', null, 'Inventory'));

        // Add listeners for server commands
        this.server.AddCmdListener([ServerClient.CMD_CHEST_CONTENT], (cmd) => {
            this.setData(cmd.data);
        });

        // Add close button
        this.loadCloseButtonImage((image) => {
            // Add buttons
            const ct = this;
            // Close button
            let btnClose = new Button(ct.width - 34 * this.zoom, 9 * this.zoom, 20 * this.zoom, 20 * this.zoom, 'btnClose', '');
            btnClose.style.font.family = 'Arial';
            btnClose.style.background.image = image;
            btnClose.style.background.image_size_mode = 'stretch';
            btnClose.onDrop = btnClose.onMouseDown = function(e) {
                ct.hide();
            }
            ct.add(btnClose);
        });

        //
        this.catchActions();

    }

    //
    catchActions() {

        const handlerMouseDown = function(e) {
            this._originalMouseDown(e);
            this.parent.confirmAction();
        };

        const handlerOnDrop = function(e) {
            this._originalOnDrop(e);
            this.parent.confirmAction();
        };

        for(let slots of [this.chest.slots, this.inventory_slots]) {
            for(let slot of slots) {
                // mouse down
                slot._originalMouseDown = slot.onMouseDown;
                slot.onMouseDown = handlerMouseDown;
                // drop
                slot._originalOnDrop = slot.onDrop;
                slot.onDrop = handlerOnDrop;
            }
        }
    
    }

    // Confirm action
    confirmAction() {
        const params = {
            drag: Game.hud.wm.drag?.item?.item,
            chest: {entity_id: this.entity_id, slots: []},
            inventory_slots: []
        };
        params.drag = params.drag ? BLOCK.convertItemToInventoryItem(params.drag) : null;
        // chest
        for(let slot of this.chest.slots) {
            if(slot.item) {
                params.chest.slots.push(BLOCK.convertItemToInventoryItem(slot.item));
            }
        }
        // inventory
        for(let slot of this.inventory_slots) {
            let item = slot.getItem();
            if(item) {
                params.inventory_slots.push(BLOCK.convertItemToInventoryItem(item));
            }
        }
        // Send to server
        this.server.ChestConfirm(params);
    }

    draw(ctx, ax, ay) {
        this.parent.center(this);
        super.draw(ctx, ax, ay);
    }

    // Запрос содержимого сундука
    load(entity_id) {
        let that = this;
        this.lbl1.setText('LOADING...');
        this.entity_id  = entity_id;
        this.loading    = true;
        this.clear();
        this.server.LoadChest(this.entity_id);
        setTimeout(function() {
            that.show();
        }, 50);
    }

    // Пришло содержимое сундука от сервера
    setData(chest) {
        // пришло содержимое другого сундука (не просматриваемого в данный момент)
        if(chest.item.entity_id != this.entity_id) {
            return;
        }
        this.lbl1.setText('CHEST');
        this.clear();
        for(let k of Object.keys(chest.slots)) {
            let item = chest.slots[k];
            if(!item) {
                continue;
            }
            let block = {...BLOCK.fromId(item.id)};
            block = Object.assign(block, item);
            this.chest.slots[k].setItem(block, null, true);
        }
    }

    // Очистка слотов сундука от предметов
    clear() {
        for(let slot of this.chest.slots) {
            slot.item = null; // slot.setItem(null);
        }
    }

    /**
    * Создание слотов сундука
    * @param int sz Ширина / высота слота
    */
    createChest(sz) {
        const ct = this;
        if(ct.chest) {
            console.error('createCraftSlots() already created');
            return;
        }
        let sx          = 14 * this.zoom;
        let sy          = 34 * this.zoom;
        let xcnt        = 9;
        this.chest = {
            slots: []
        };
        for(let i = 0; i < 27; i++) {
            let lblSlot = new CraftTableInventorySlot(sx + (i % xcnt) * sz, sy + Math.floor(i / xcnt) * (36 * this.zoom), sz, sz, 'lblCraftChestSlot' + i, null, '' + i, this, null);
            lblSlot.index = i;
            lblSlot.is_chest_slot = true;
            lblSlot.onMouseEnter = function() {
                this.style.background.color = '#ffffff33';
            }
            lblSlot.onMouseLeave = function() {
                this.style.background.color = '#00000000';
            }
            this.chest.slots.push(lblSlot);
            ct.add(lblSlot);
        }
    }

    /**
    * Создание слотов для инвентаря
    * @param int sz Ширина / высота слота
    */
    createInventorySlots(sz) {
        const ct = this;
        if(ct.inventory_slots) {
            console.error('createInventorySlots() already created');
            return;
        }
        ct.inventory_slots  = [];
        // нижний ряд (видимые на хотбаре)
        let sx          = 14 * this.zoom;
        let sy          = 282 * this.zoom;
        let xcnt        = 9;
        for(let i = 0; i < 9; i++) {
            let lblSlot = new CraftTableInventorySlot(sx + (i % xcnt) * sz, sy + Math.floor(i / xcnt) * (36 * this.zoom), sz, sz, 'lblSlot' + (i), null, '' + i, this, i);
            ct.add(lblSlot);
            ct.inventory_slots.push(lblSlot);
        }
        sx              = 14 * this.zoom;
        sy              = 166 * this.zoom;
        xcnt            = 9;
        // верхние 3 ряда
        for(let i = 0; i < 27; i++) {
            let lblSlot = new CraftTableInventorySlot(sx + (i % xcnt) * sz, sy + Math.floor(i / xcnt) * (36 * this.zoom), sz, sz, 'lblSlot' + (i + 9), null, '' + (i + 9), this, i + 9);
            ct.add(lblSlot);
            ct.inventory_slots.push(lblSlot);
        }
    }

    getSlots() {
        return this.chest.slots;
    }

}