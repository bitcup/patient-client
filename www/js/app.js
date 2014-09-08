angular.module('sawa-patient', ['ionic', 'sawa-patient.controllers', 'sawa-patient.services'])

    .run(function ($ionicPlatform) {
        $ionicPlatform.ready(function () {
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }
        });
    })

    .config(function ($stateProvider, $urlRouterProvider) {

        // Ionic uses AngularUI Router which uses the concept of states
        // Learn more here: https://github.com/angular-ui/ui-router
        // Set up the various states which the app can be in.
        // Each state's controller can be found in controllers.js
        $stateProvider

            .state('login', {
                url: "/login",
                templateUrl: "templates/login.html",
                controller: 'LoginCtrl'
            })

            // setup an abstract state for the tabs directive
            .state('tab', {
                url: "/tab",
                abstract: true,
                templateUrl: "templates/tabs.html"
            })

            // -------------------------------------------------
            // all these tabs have same history stack: tab-cares
            // -------------------------------------------------
            .state('tab.cares', {
                url: '/cares',
                views: {
                    'tab-cares': {
                        templateUrl: 'templates/tab-cares.html',
                        controller: 'CaresCtrl'
                    }
                }
            })

            .state('tab.care-details', {
                url: '/care-details/:id',
                views: {
                    'tab-cares': {
                        templateUrl: 'templates/tab-care-details.html',
                        controller: 'CareDetailsCtrl'
                    }
                }
            })

            .state('tab.care-practitioners', {
                url: '/care-practitioners/:id',
                views: {
                    'tab-cares': {
                        templateUrl: 'templates/tab-care-practitioners.html',
                        controller: 'CareDetailsCtrl'
                    }
                }
            })

            .state('tab.practitioner-details', {
                url: '/practitioner-details/:pId/:cId',
                views: {
                    'tab-cares': {
                        templateUrl: 'templates/tab-practitioner-details.html',
                        controller: 'PractitionerDetailsCtrl'
                    }
                }
            })

            .state('tab.practitioner-notes', {
                url: '/practitioner-notes/:pId/:cId',
                views: {
                    'tab-cares': {
                        templateUrl: 'templates/tab-practitioner-notes.html',
                        controller: 'PractitionerDetailsCtrl'
                    }
                }
            })

            .state('tab.note-details', {
                url: '/note-details/:nId/:pId/:cId',
                views: {
                    'tab-cares': {
                        templateUrl: 'templates/tab-note-details.html',
                        controller: 'NoteDetailsCtrl'
                    }
                }
            })

            // -------------------------------------------------
            // all these tabs have same history stack: tab-practitioners
            // -------------------------------------------------
            .state('tab.practitioners', {
                url: '/practitioners',
                views: {
                    'tab-practitioners': {
                        templateUrl: 'templates/tab-practitioners.html',
                        controller: 'PractitionersCtrl'
                    }
                }
            })

            /*
            .state('tab.practitioner-details-2', {
                url: '/practitioner-details-2/:pId/:cId',
                views: {
                    'tab-practitioners': {
                        templateUrl: 'templates/tab-practitioner-details.html',
                        controller: 'PractitionerDetailsCtrl'
                    }
                }
            })
            */

            // -------------------------------------------------
            // all these tabs have same history stack: tab-share
            // -------------------------------------------------
            .state('tab.share', {
                url: '/share',
                views: {
                    'tab-share': {
                        templateUrl: 'templates/tab-share.html',
                        controller: 'ShareCtrl'
                    }
                }
            })

            // -------------------------------------------------
            // all these tabs have same history stack: tab-account
            // -------------------------------------------------
            .state('tab.account', {
                url: '/account',
                views: {
                    'tab-account': {
                        templateUrl: 'templates/tab-account.html',
                        controller: 'AccountCtrl'
                    }
                }
            });

        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/tab/cares');

    })

    .constant('API_HOST', 'http://obaba-mbp.local:8080')
    .constant('LOCAL_STORAGE_EMAIL_KEY', 'sawa.patient.email')
    .constant('LOCAL_STORAGE_PAK_KEY', 'sawa.patient.privateAuthKey')
    .constant('AUTH_HEADER_PREFIX', 'SAWA ')

    //.constant('API_HOST', 'http://serene-bayou-3861.herokuapp.com')
;

