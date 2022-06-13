import {API_Client} from './api.js';

export class UIApp {

    constructor() {
        this.api = new API_Client();
        // Session
        this._loadSession();
        // Hooks
        this.onLogin = (e) => {};
        this.onLogout = (e) => {};
        this.onError = (e) => {};
    }

    // MyWorlds...
    async MyWorlds(form, callback, callback_error, callback_progress, callback_final) {
        let result = [];
        await this.api.call(this, '/api/Game/MyWorlds', form, (resp) => {
            result = resp;
            if(callback) {
                callback(result);
            }
        }, callback_error, callback_progress, callback_final);
        return result;
    }
    
    getSession() {
        return this.session;
    }
    
    _loadSession() {
        // Session
        let session = localStorage.getItem('session');
        if(session) {
            this.session = JSON.parse(session);
        } else {
            this.session = null;
        }
    }
    
}