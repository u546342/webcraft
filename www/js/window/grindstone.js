import { BLOCK } from "../blocks.js";
import { Button, Label, TextEdit } from "../../tools/gui/wm.js";
import { INVENTORY_SLOT_SIZE } from "../constant.js";
import { CraftTableSlot, BaseCraftWindow } from "./base_craft_window.js";

//
class GrindstoneSlot extends CraftTableSlot {
    constructor(x, y, w, h, id, title, text, ct) {
        super(x, y, w, h, id, title, text, ct, null);
        
        this.ct = ct;

        this.onMouseEnter = function() {
            this.style.background.color = '#ffffff55';
            this.getResult();
        };

        this.onMouseLeave = function() {
            this.style.background.color = '#00000000';
            this.getResult();
        };
        
        this.onMouseDown = function(e) { 
            const dragItem = this.getItem();
            if (!dragItem) {
                return;
            }
            if (this == ct.result_slot) {
                this.getResult(true);
                ct.first_slot.setItem(null);
                ct.second_slot.setItem(null);
            }
            this.getInventory().setDragItem(this, dragItem, e.drag, this.width, this.height);
            this.setItem(null);
            this.getResult();
        };
        
        this.onDrop = function(e) {
            if (this == ct.result_slot) {
                return;
            }
            const dragItem = this.getItem();
            const dropItem = e.drag.getItem().item;
            if(!dropItem) {
                return;
            }
            this.setItem(dropItem, e);
            this.getInventory().setDragItem(this, dragItem, e.drag, this.width, this.height);
            
            this.getResult();
        };
    }
    
    getInventory() {
        return this.ct.inventory;
    }
    
    getResult(create) {
        const first_item = this.ct.first_slot.getItem();
        const second_item = this.ct.second_slot.getItem();
    }
    
}

//
export class GrindstoneWindow extends BaseCraftWindow {

    constructor(inventory) {
        
        super(10, 10, 350, 330, 'frmGrindstone', null, null);
        
        this.width *= this.zoom;
        this.height *= this.zoom;
        this.style.background.image_size_mode = 'stretch';

        this.inventory = inventory;
        this.state = false;

        const options = {
            background: {
                image: './media/gui/grindstone.png',
                image_size_mode: 'sprite',
                sprite: {
                    mode: 'stretch',
                    x: 0,
                    y: 0,
                    width: 350 * 2,
                    height: 330 * 2
                }
            }
        };
        this.style.background = {...this.style.background, ...options.background};

        // Get window by ID
        const ct = this;
        ct.style.background.color = '#00000000';
        ct.style.border.hidden = true;
        ct.setBackground(options.background.image);
        ct.hide();
        
        // Add labels to window
        ct.add(new Label(20 * this.zoom, 8 * this.zoom, 180 * this.zoom, 30 * this.zoom, 'lbl1', null, 'Repair & Disenchant'));
        
        // Ширина / высота слота
        this.cell_size = INVENTORY_SLOT_SIZE * this.zoom;
        
         // Создание слотов для инвентаря
        this.createInventorySlots(this.cell_size);
        
        // Создание слотов для крафта
        this.createCraft(this.cell_size);
        
        // Обработчик закрытия формы
        this.onHide = function() {
            this.inventory.clearDragItem();
            // Save inventory
            Qubatch.world.server.InventoryNewState(this.inventory.exportItems(), []);
        }
        
        // Обработчик открытия формы
        this.onShow = function() {
            Qubatch.releaseMousePointer();
        }
        
        // Add close button
        this.loadCloseButtonImage((image) => {
            // Add buttons
            const ct = this;
            // Close button
            let btnClose = new Button(ct.width - 34 * this.zoom, 9 * this.zoom, 20 * this.zoom, 20 * this.zoom, 'btnClose', '');
            btnClose.style.font.family = 'Arial';
            btnClose.style.background.image = image;
            btnClose.onDrop = btnClose.onMouseDown = function(e) {
                ct.hide();
            }
            ct.add(btnClose);
        });

        // Hook for keyboard input
        this.onKeyEvent = (e) => {
            const {keyCode, down, first} = e;
            switch(keyCode) {
                case KEY.ESC: {
                    if(!down) {
                        ct.hide();
                        try {
                            Qubatch.setupMousePointer(true);
                        } catch(e) {
                            console.error(e);
                        }
                    }
                    return true;
                }
            }
            return false;
        }
    }
    
    
    createCraft(cell_size) {
        this.first_slot = new GrindstoneSlot(96 * this.zoom, 36 * this.zoom, cell_size, cell_size, 'lblGrindstoneFirstSlot', null, null, this);
        this.second_slot = new GrindstoneSlot(96 * this.zoom, 78 * this.zoom, cell_size, cell_size, 'lblGrindstoneSecondSlot', null, null, this);
        this.result_slot = new GrindstoneSlot(256 * this.zoom, 66 * this.zoom, cell_size, cell_size, 'lblGrindstoneResultSlot', null, null, this);
        this.add(this.first_slot);
        this.add(this.second_slot);
        this.add(this.result_slot);
    }
    
    draw(ctx, ax, ay) {
        super.draw(ctx, ax, ay);
        if(!this.state) {
            if(typeof this.style.background.image == 'object') {
                const x = ax + this.x;
                const y = ay + this.y;
                const arrow = {x: 704, y: 0, width: 112, height: 80, tox: 188 * this.zoom, toy: 60 * this.zoom};
                ctx.drawImage(
                    this.style.background.image,
                    arrow.x,
                    arrow.y,
                    arrow.width,
                    arrow.height,
                    x + arrow.tox,
                    y + arrow.toy,
                    arrow.width * this.zoom / 2,
                    arrow.height * this.zoom / 2
                );
            }
        }
        
    }
    
}

