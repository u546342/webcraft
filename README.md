# MadCraft
Minecraft clone on JS

# Run and play
```
// Run GO server
go run .\main.go
open http://localhost:5700/

// Run NodeJS server
cd .\www\js\node_server
npm install express
cd ..\..\
node --experimental-json-modules --no-warnings .\js\node_server\index.js
```

# Commands
```JS
// Teleport current user to random location 
Game.player.teleport('random', null);

// Draw current user model at current location
Game.world.players.drawGhost(Game.player);

// Toggle rain
Game.render.setRain(true);

// Set block at current player coordinates
let pp = Game.player.getBlockPos();
Game.world.chunkManager.setBlock(pp.x, pp.y, pp.z, {id: 10}, true);

// Emulate user keyboard control
// .walk(direction, duration_milliseconds)
Game.player.walk('forward', 2000); // forward|back|left|right

// Get player rotate
let rotate = Game.player.rotate;

// Set player rotate
Game.player.setRotate({x: 0, y: 0, z: 0});

// Send message to chat
Game.player.chat.sendMessage('Hello, World!');

// Get all supported blocks
let blocks = Game.block_manager.getAll();

// Change game mode
Game.world.game_mode.setMode('creative'); // survival|creative|adventure|spectator

// Open inventory window
Game.player.inventory.open();

// Spawn mob
Game.player.world.server.Send({name: 70, data: {type: "horse", skin: "creamy", pos: Game.player.pos}});
Game.player.world.server.Send({name: 70, data: {type: "bee", skin: "base", pos: Game.player.pos}});

// Admins
// 1. admin list managed only by chat commands
// 2. only owner or another admin can add new admin
// 3. owner cannot be removed from admins
/admin list
/admin add username
/admin remove username
```