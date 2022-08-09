import { BLOCK } from "../blocks.js";
import { Button, Label, Window, TextEdit } from "../../tools/gui/wm.js";
import { DEFAULT_CHEST_SLOT_COUNT, INVENTORY_HOTBAR_SLOT_COUNT, INVENTORY_SLOT_SIZE, INVENTORY_VISIBLE_SLOT_COUNT } from "../constant.js";
import { CraftTableSlot, BaseCraftWindow } from "./base_craft_window.js";

//to do разделить на классы
class LoomSlot extends CraftTableSlot {
    
    constructor(x, y, w, h, id, title, text, ct) {
        super(x, y, w, h, id, title, text, ct, null);
        
        this.ct = ct;

        this.onMouseEnter = function() {
            this.style.background.color = '#ffffff55';
        };

        this.onMouseLeave = function() {
            this.style.background.color = '#00000000';
        };
        
        this.onMouseDown = function(e) { 
            const dragItem = this.getItem();
            if (!dragItem) {
                return;
            }
            this.getInventory().setDragItem(this, dragItem, e.drag, this.width, this.height);
            this.setItem(null);
        };
        
        this.onDrop = function(e) {
            const dragItem = this.getItem();
            const dropItem = e.drag.getItem().item;
            if(!dropItem) {
                return;
            }
            this.setItem(dropItem, e);
            this.getInventory().setDragItem(this, dragItem, e.drag, this.width, this.height);
        };
    }
    
    getInventory() {
        return this.ct.inventory;
    }
    
}


export class LoomWindow extends BaseCraftWindow {
    
    constructor(inventory) {
        
        super(10, 10, 350, 330, 'frmLoom', null, null);
        
        this.width *= this.zoom;
        this.height *= this.zoom;
        this.style.background.image_size_mode = 'stretch';
        this.inventory = inventory;

        const options = {
            background: {
                image: './media/gui/loom.png',
                image_size_mode: 'sprite',
                sprite: {
                    mode: 'stretch',
                    x: 0,
                    y: 0,
                    width: 350,
                    height: 330
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
        ct.add(new Label(10 * this.zoom, 10 * this.zoom, 150 * this.zoom, 30 * this.zoom, 'lbl1', null, 'Loom'));
        
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
            let btnClose = new Button(ct.width - 26 * this.zoom, 9 * this.zoom, 20 * this.zoom, 20 * this.zoom, 'btnClose', '');
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
                case KEY.E:
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
        this.color_slot = new LoomSlot(62 * this.zoom, 50 * this.zoom, cell_size, cell_size, 'lblLoomColorSlot', null, null, this);
        this.pattern_slot = new LoomSlot(44 * this.zoom, 88 * this.zoom, cell_size, cell_size, 'lblLoomPatternSlot', null, null, this);
        this.item_slot = new LoomSlot(24 * this.zoom, 50 * this.zoom, cell_size, cell_size, 'lblLoomItemSlot', null, null, this);
        this.add(this.color_slot);
        this.add(this.pattern_slot);
        this.add(this.item_slot);
    }
    
}