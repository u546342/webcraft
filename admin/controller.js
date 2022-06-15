import {UIApp} from './app.js';

let app = angular.module('adminApp', []);

let adminCtrl = async function($scope, $timeout) {
    
    $scope.App = new UIApp();
    
    $scope.registration = {
        loading: false,
        form: {
            username: '',
            password: ''
        },
        submit: function() {
            $scope.App.MyWorlds({}, (worlds) => {
                $scope.worlds = worlds;
                console.log(worlds)
            });
        }
    }
};

app.controller('adminCtrl', adminCtrl);