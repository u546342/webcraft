import {UIApp} from './app.js';

const app = angular.module('app', []);
const admin_ctrl = async function($scope, $timeout) {
    
    $scope.App = new UIApp();
    
    $scope.login = {
        visible: false,
        submit: function() {
            $scope.App.Login(this, (resp) => {
                $timeout(() => {
                    $scope.login.visible = false;
                    $scope.worlds.update();
                });
            });
        },
        init: function() {
            let session = $scope.App.getSession();
            if (session) {
                $scope.worlds.update();
            } else {
                this.visible = true;
            }
        },
        logout() {
            $scope.App.logout();
            $scope.login.visible = true;
        }
    }
    
    $scope.worlds = {
        visible: false,
        update: function(page = 0) {
            $scope.App.ListWorlds({page: page}, (worlds) => {
                $timeout(() => {
                    $scope.worlds.visible = true;
                    $scope.players.visible = false;
                    $scope.info.visible = false;
                    $scope.worlds.rows = worlds.rows;
                    $scope.worlds.pagin = worlds.pagin;
                    $scope.worlds.count = worlds.count;
                });
            });
        }
    }
    
    $scope.players = {
        visible: false,
        update: function(id, page) {
            $scope.App.ListPlayers({id: id, page: page}, (players) => {
                $timeout(() => {
                    $scope.worlds.visible = false;
                    $scope.info.visible = false;
                    $scope.players.visible = true;
                    $scope.players.rows = players.rows;
                    $scope.players.pagin = players.pagin;
                    $scope.players.count = players.count;
                });
            });
        }
    }
    
    $scope.info = {
        visible: false,
        update: function(world, id) {
            $scope.App.InfoPlayer({world: world, id: id}, (player) => {
                $timeout(() => {
                    $scope.worlds.visible = false;
                    $scope.players.visible = false;
                    $scope.info = player;
                    $scope.info.visible = true;
                });
            });
        },
    }
    
};

app.controller('admin_ctrl', admin_ctrl);