import express from "express"; 
import { DBWorld } from './db_world.js';

const FLAG_SYSTEM_ADMIN = 256;

export class ServerAPI {
    
    static IsOnline(user_id) {
        for(let world of Game.worlds.values()) {
            if(world.players) {
                console.log(world);
            }
        }
    }

    static init(app) {
        // JSONRpc API
        app.use(express.json());
        app.use('/api', async(req, res) => {
            console.log('> API:' + req.originalUrl);
            try {
                switch(req.originalUrl) {
                    case '/api/User/Registration': {
                        let session = await Game.db.Registration(req.body.username, req.body.password);
                        Log.append('Registration', {username: req.body.username});
                        res.status(200).json(session);
                        break;
                    }
                    case '/api/User/Login': {
                        let session = await Game.db.Login(req.body.username, req.body.password);
                        Log.append('Login', {username: req.body.username});
                        res.status(200).json(session);
                        break;
                    }
                    case '/api/Game/CreateWorld': {
                        let title       = req.body.title;
                        let seed        = req.body.seed;
                        let generator   = req.body.generator;
                        let game_mode   = 'survival';
                        let session     = await Game.db.GetPlayerSession(req.get('x-session-id'));
                        let world       = await Game.db.InsertNewWorld(session.user_id, generator, seed, title, game_mode);
                        Log.append('InsertNewWorld', {user_id: session.user_id, generator, seed, title, game_mode});
                        res.status(200).json(world);
                        break;
                    }
                    case '/api/Game/JoinWorld': {
                        const world_guid = req.body.world_guid;
                        const session    = await Game.db.GetPlayerSession(req.get('x-session-id'));
                        const world      = await Game.db.JoinWorld(session.user_id, world_guid);
                        Log.append('JoinWorld', {user_id: session.user_id, world_guid});
                        res.status(200).json(world);
                        break;
                    }
                    case '/api/Game/MyWorlds': {
                        let session = await Game.db.GetPlayerSession(req.get('x-session-id'));
                        let result = await Game.db.MyWorlds(session.user_id);
                        res.status(200).json(result);
                        break;
                    }
                    case '/api/Game/Online': {
                        let session = await Game.db.GetPlayerSession(req.get('x-session-id'));
                        ServerAPI.requireSessionFlag(session, FLAG_SYSTEM_ADMIN);
                        const resp = {
                            dt_started: Game.dt_started,
                            players_online: 0,
                            worlds: []
                        };
                        for(let world of Game.worlds.values()) {
                            if(world.info) {
                                let info = {...world.info, players: []};
                                for(let player of world.players.values()) {
                                    info.players.push({
                                        user_id: player.session.user_id,
                                        username: player.session.username,
                                        ...player.state,
                                        dt_connect: player.dt_connect
                                    });
                                    resp.players_online++;
                                }
                                resp.worlds.push(info);
                            }
                        }
                        res.status(200).json(resp);
                        break;
                    }
                    //Список миров
                    case '/api/Admin/ListWorlds': {
                        const session = await Game.db.GetPlayerSession(req.get('x-session-id'));
                        let result = await Game.db.getListWorlds(session.user_id);
                        for (const row of result) {
                            row.online = 0;
                            row.chunks = 0;
                            const players = await Game.db.getListPlayers(row.id, session.user_id);
                            row.players = players.length;
                            const world = Game.worlds.get(row.guid);
                            if (world) {
                                row.chunks = world.chunks.all.list.size;
                                row.online = world.players.size;
                            }
                        }
                        res.status(200).json(result);
                        break;
                    }
                    //Список пользователей в мире
                    case '/api/Admin/ListPlayers': {
                        const session = await Game.db.GetPlayerSession(req.get('x-session-id'));
                        const world = await Game.db.getWorldById(req.body.id, session.user_id);
                        let result = [];
                        if (world) {
                            const db = await DBWorld.openDB("../world/" + world.guid, null);
                            if (db) {
                                const players = await Game.db.getListPlayers(world.id);
                                const game = Game.worlds.get(world.guid);
                                for (const player of players) { 
                                    let online = false;
                                    let items = 0;
                                    if (game && game.players.get(player.id)) {
                                        online = true;
                                    }
                                    const info = await db.getPlayerInfo(player.id);
                                    for (let cell of info.inventory.items) {
                                        if (cell) {
                                            items++;
                                        }
                                    }
                                    result.push({
                                        'id': info.id,
                                        'world': world.id,
                                        'username': info.username,
                                        'is_admin': info.is_admin,
                                        'online': online,
                                        'items': items
                                    });
                                }
                            }
                        }
                        res.status(200).json(result);
                        break;
                    }
                    //Информация об игроке
                    case '/api/Admin/InfoPlayer': {
                        const session = await Game.db.GetPlayerSession(req.get('x-session-id'));
                        const world = await Game.db.getWorldById(req.body.world, session.user_id);
                        let result = [];
                        if (world) {
                            const db = await DBWorld.openDB("../world/" + world.guid, null);
                            if (db) {
                                result = await db.getPlayerInfo(req.body.id);
                            }
                        }
                        res.status(200).json(result);
                        break;
                    }
                    default: {
                        throw 'error_method_not_exists';
                        break;
                    }
                }
            } catch(e) {
                console.log('> API: ' + e);
                let message = e.code || e;
                let code = 950;
                if(message == 'error_invalid_session') {
                    code = 401;
                }
                res.status(200).json(
                    {"status":"error","code": code, "message": message}
                );
            }
        });
    }

    // requireSessionFlag...
    static requireSessionFlag(session, flag) {
        if((session.flags & flag) != flag) {
            throw 'error_require_permission';
        }
        return true;
    }

}