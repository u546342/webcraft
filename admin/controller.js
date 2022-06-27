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
                    
                    console.log(player);
                });
            });
        }
    }
    
    $scope.worlds = {
        visible: true,
        submit: function() {
            $scope.worlds.visible = true;
            $scope.players.visible = false;
            $scope.info.visible = false;
            $scope.App.ListWorlds({}, (worlds) => {
                $timeout(() => {
                    $scope.worlds.list = worlds.list;
                    $scope.worlds.count = worlds.length;
                });
            });
        },
        info: function(id) {
            $scope.App.ListPlayers({id: id}, (players) => {
                $timeout(() => {
                    $scope.worlds.visible = false;
                    $scope.info.visible = false;
                    $scope.players.visible = true;
                    $scope.players.list = players;
                    $scope.players.count = players.length;
                });
            });
        }
    }
};

app.controller('admin_ctrl', admin_ctrl);