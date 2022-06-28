import {UIApp} from './app.js';

const app = angular.module('app', []);
const admin_ctrl = async function($scope, $timeout) {
    
    $scope.App = new UIApp();
    
    $scope.info = {
        visible: false,
    }
    
    $scope.players = {
        visible: false,
        info: function(world, id) {
            $scope.App.InfoPlayer({world: world, id: id}, (player) => {
                $timeout(() => {
                    $scope.worlds.visible = false;
                    $scope.players.visible = false;
                    $scope.info = player;
                    $scope.info.visible = true;
                });
            });
        },
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
    
    $scope.worlds = {
        visible: true,
        update: function(page) {
            $scope.worlds.visible = true;
            $scope.players.visible = false;
            $scope.info.visible = false;
            $scope.App.ListWorlds({page: page}, (worlds) => {
                $timeout(() => {
                    $scope.worlds.rows = worlds.rows;
                    $scope.worlds.pagin = worlds.pagin;
                    $scope.worlds.count = worlds.count;
                });
            });
        }
    }
};

app.controller('admin_ctrl', admin_ctrl);