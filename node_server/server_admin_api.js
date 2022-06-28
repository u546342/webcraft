import express from "express"; 
import { DBWorld } from './db_world.js';

const TABLE_COUNT_ROWS = 12;

export class ServerAdminAPI {
    
    static init(app) {
        // JSONRpc API
        app.use(express.json());
        app.use('/api', async(req, res) => {
            console.log('> Admin API:' + req.originalUrl);
            try {
                switch(req.originalUrl) {
                    //логин
                    case '/api/Admin/Login': {
                        let session = await Game.db.Login(req.body.username, req.body.password);
                        console.log(session)
                        Log.append('Login', {username: req.body.username});
                        res.status(200).json(session);
                        break;
                    }
                    //Список миров
                    case '/api/Admin/ListWorlds': {
                        let data = {
                            rows: [],
                            count: 0,
                            pagin:[]
                        };
                        
                        const page = parseInt(req.body.page) || 0;
                        const session = await Game.db.GetPlayerSession(req.get('x-session-id'));
                        console.log(req.get('x-session-id'));
                        const result = await Game.db.getListWorlds(session.user_id);
                        for (const row of result) {
                            row.online = 0;
                            row.chunks = 0;
                            const players = await Game.db.getListPlayers(row.id, session.user_id);
                            row.players = players.length;
                            const world = Game.worlds.get(row.guid);
                            if (world) {
                                row.chunks = world.chunks.all.size;
                                row.online = world.players.size;
                            }
                            data.rows.push(row);
                        }
                        
                        data.count = data.rows.length;
                        
                        data.rows.sort(function(a, b) {
                            return b.online - a.online;
                        });
                        
                        data.rows = data.rows.slice(TABLE_COUNT_ROWS * page, TABLE_COUNT_ROWS * ( page + 1));
                        
                        for (let i = 0; i < Math.ceil(data.count / TABLE_COUNT_ROWS); i++) {
                            data.pagin.push({
                                'id': i,
                            })
                        }
                        res.status(200).json(data);
                        break;
                    }
                    //Список пользователей в мире
                    case '/api/Admin/ListPlayers': {
                        const page = parseInt(req.body.page) || 0;
                        const session = await Game.db.GetPlayerSession(req.get('x-session-id'));
                        const world = await Game.db.getWorldById(req.body.id, session.user_id);
                        let data = {
                            rows: [],
                            count: 0,
                            pagin:[]
                        };
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
                                    if (info.inventory) {
                                        for (let cell of info.inventory.items) {
                                            if (cell) {
                                                items++;
                                            }
                                        }
                                    }
                                    data.rows.push({
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
                        
                        data.count = data.rows.length;
                        
                        data.rows = data.rows.slice(TABLE_COUNT_ROWS * page, TABLE_COUNT_ROWS * ( page + 1));
                        
                        for (let i = 0; i < Math.ceil(data.count / TABLE_COUNT_ROWS); i++) {
                            data.pagin.push({
                                'id': i,
                            })
                        }
                        
                        res.status(200).json(data);
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
                console.log('> Admin API: ' + e);
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
    
}