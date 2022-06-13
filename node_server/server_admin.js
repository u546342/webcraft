import express from "express"; 

export class ServerAdmin {

    static init(app) {
        // Serves resources from public folder
        app.use('/admin', express.static('../admin/'));
    }

}