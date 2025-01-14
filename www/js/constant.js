export const GAME_ONE_SECOND                = 72;
export const GAME_DAY_SECONDS               = 24000;
// If more time than this has passed since the last update, player.update() is skipped.
export const MAX_FPS_DELTA_PROCESSED        = 2000;
export const DRAW_HUD_INFO_DEFAULT          = false; // (fps, player, etc)
export const RAINDROP_NEW_INTERVAL          = 25;
export const DEFAULT_CLOUD_HEIGHT           = 230.1;
export const ONLINE_MAX_VISIBLE_IN_F3       = 7;
export const DROP_LIFE_TIME_SECONDS         = 60;
export const DEFAULT_SOUND_MAX_DIST         = 16;
export const NO_TICK_BLOCKS                 = false;
export const BODY_ROTATE_SPEED              = 7;
export const HEAD_MAX_ROTATE_ANGLE          = 45; // in degree
export const GRASS_PALETTE_OFFSET           = 256; // (in px) offset in mask_color.png for grass palette
export const DEFAULT_TX_CNT                 = 64;
export const DEFAULT_TX_SIZE                = 32;
export const DEFAULT_ATLAS_SIZE             = DEFAULT_TX_CNT * DEFAULT_TX_SIZE;
export const DIRT_COLOR_NOISE_RANGE         = 20; // mix dirt colors on every block with random value
export const COVER_STYLE_SIDES              = ['up', 'down', 'south', 'north', 'west', 'east'];
export const NO_DESTRUCTABLE_BLOCKS         = ['BEDROCK', 'STILL_WATER'];
export const NO_CREATABLE_BLOCKS            = ['BEDROCK', 'UNCERTAIN_STONE'];
export const NOT_SPAWNABLE_BUT_INHAND_BLOCKS= ['BEDROCK'];

export const INVENTORY_SLOT_SIZE            = 36;
export const HAND_ANIMATION_SPEED           = 20;
export const INVENTORY_SLOT_COUNT           = 42;
export const INVENTORY_VISIBLE_SLOT_COUNT   = 36;
export const INVENTORY_DRAG_SLOT_INDEX      = 41;
export const INVENTORY_HOTBAR_SLOT_COUNT    = 9;
export const MAGIC_ROTATE_DIV               = 900;
export const DRAW_SLOT_INDEX                = false;

export const DEFAULT_CHEST_SLOT_COUNT       = 27;
// It's added to pickatDistance on the client.
// If a player is farther away, the chest window closes.
export const CHEST_INTERACTION_MARGIN_BLOCKS = 2;
// It's added to the value above on the server.
// If a player is farther away, the chest interaction is not accepted.
// A client is expected to close the window before that.
// It serves 2 purposes: against cheaters who try to interact over huge distance,
// and to have a margin of safety ehn checking one half of a double chest in sendChestToPlayers()
export const CHEST_INTERACTION_MARGIN_BLOCKS_SERVER_ADD = 2;
// The maximum time for which the client don't send inventory changes (used only in chest windows so far)
export const MAX_DIRTY_INVENTORY_DURATION   = 5000;

export const RENDER_DEFAULT_ARM_HIT_PERIOD  = 200; // ms (player arm hit period)
export const MIN_BRIGHTNESS                 = 0.275;
export const PLAYER_MAX_DRAW_DISTANCE       = 256; // draw only nearest players
export const RENDER_EAT_FOOD_DURATION       = 1800;

// player
export const PLAYER_ZOOM                    = 1;
export const PLAYER_HEIGHT                  = 1.7 * PLAYER_ZOOM;
export const PLAYER_WIDTH                   = 0.7 * PLAYER_ZOOM;
export const SNEAK_MINUS_Y_MUL              = 0.2 * PLAYER_ZOOM; // decrease player height to this percent value
export const PLAYER_DIAMETER                = 0.7;
export const PLAYER_RADIUS                  = PLAYER_DIAMETER / 2;
export const MOB_EYE_HEIGHT_PERCENT         = 1 - 1/16;
export const THIRD_PERSON_CAMERA_DISTANCE   = 5 * PLAYER_ZOOM;

export const SPECTATOR_SPEED_MUL            = 1 * PLAYER_ZOOM;

// Player armor slots
export const PLAYER_ARMOR_SLOT_BOOTS        = 36; // boots
export const PLAYER_ARMOR_SLOT_LEGGINGS     = 37; // legs
export const PLAYER_ARMOR_SLOT_CHESTPLATE   = 38; // body
export const PLAYER_ARMOR_SLOT_HELMET       = 39; // head

// portal
export const PORTAL_USE_INTERVAL            = 5000; // ms
export const PORTAL_SIZE                    = {width: 4, height: 5};
export const MAX_PORTAL_SEARCH_DIST         = 128;
export const MAX_CHUNK_Y_DIFF_FOR_PORTAL    = 3;

// World types
export const WORLD_TYPE_NORMAL              = 1;
export const WORLD_TYPE_BUILDING_SCHEMAS    = 2;

// Global light type
export const LIGHT_TYPE_NO                  = 0;
export const LIGHT_TYPE_SMOOTH              = 1;
export const LIGHT_TYPE_RTX                 = 2;

export const MOUSE = {
    DOWN: 1,
    UP: 2,
    MOVE: 3,
    CLICK: 4,
    WHEEL: 5,
    BUTTON_LEFT: 1,
    BUTTON_WHEEL: 2,
    BUTTON_RIGHT: 3
};

export const KEY = {
    BACKSPACE: 8,
    TAB: 9,
    ENTER: 13,
    SHIFT: 16,
    ESC: 27,
    SPACE: 32,
    PAGE_UP: 33,
    PAGE_DOWN: 34,
    END: 35,
    HOME: 36,
    ARROW_LEFT: 37,
    ARROW_UP: 38,
    ARROW_RIGHT: 39,
    ARROW_DOWN: 40,
    DEL: 46,
    A: 65,
    B: 66,
    C: 67,
    D: 68,
    E: 69,
    G: 71,
    Q: 81,
    R: 82,
    S: 83,
    T: 84,
    V: 86,
    W: 87,
    WIN: 91,
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F5: 116,
    F6: 117,
    F7: 118,
    F8: 119,
    F9: 120,
    F10: 121,
    F11: 122,
    SLASH: 191,
    F11: 122
};

export const CLIENT_SKIN_ROOT = './media/models/player_skins/';

export const SKIN_RIGHTS_DEFAULT = 0;
export const SKIN_RIGHTS_FREE = 1;
export const SKIN_RIGHTS_UPLOADED = 2;

export const PLAYER_SKIN_TYPES = {
    0: 'player:steve',
    1: 'player:alex'
};

export const PLAYER_STATUS_DEAD         = 0;
/* A player with this status is alive, but doesn't move or interat with the world
until some necessary data is loaded (e.g. the chunks around them to choose a safe spawn point). */
export const PLAYER_STATUS_WAITING_DATA = 1;
export const PLAYER_STATUS_ALIVE        = 2;