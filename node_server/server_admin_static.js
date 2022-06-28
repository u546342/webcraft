import express from "express"; 

export class ServerAdminStatic {

    static init(app) {
        // Serves resources from public folder
        app.use('/', express.static('../www_admin/'));
    }

}