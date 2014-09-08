angular.module('sawa-patient.services', ['ngResource'])

    // interceptor to add Authorization header for all requests - calculates HMAC via RequestSigner
    // note: also, for this to work, the server needs to accept Authorization header
    // -- see 'Access-Control-Allow-Headers' in CorsFilter
    .factory('HMACInterceptor', function ($q, $log, RequestSigner, CredentialsHolder, AUTH_HEADER_PREFIX) {
        return {
            'request': function (config) {
                // add authorization header to remote requests only
                if (config.url.indexOf('http') == 0) {
                    $log.debug('signing request: ' + config.url);
                    var uri = (new URI(config.url)).pathname();
                    // get email and privateAuthKey of logged in user so we can sign the request
                    // note: if user not logged in (requesting a login), then don't sign the request
                    if (CredentialsHolder.isLoggedIn()) {
                        var credentials = CredentialsHolder.getCredentials();
                        var signedRequest = RequestSigner.sign(uri, credentials.email, credentials.privateAuthKey);
                        config.headers.Authorization = AUTH_HEADER_PREFIX + signedRequest.email + ':' + signedRequest.signature;
                        $log.debug('config.headers: ' + JSON.stringify(config.headers));
                    }
                }
                return config || $q.when(config);
            },
            'responseError': function (rejection) {
                $log.debug("http interceptor caught a response error with status=" + rejection.status);
                return $q.reject(rejection);
            }
        };
    })

    // add interceptor to sign remote requests
    .config(function ($httpProvider) {
        $httpProvider.interceptors.push('HMACInterceptor');
    })

    .factory('CareSvc', ['$resource', '$log', '$state', 'API_HOST',
        function ($resource, $log, $state, API_HOST) {
            // defines the endpoint, optional params, and method names (in addition to the default ones)
            // note: email of logged-in patient is automatically passed in all requests
            var careResource = $resource(API_HOST + '/api/v1.0/cares/:careId', {careId: '@id'});

            var factory = {};

            factory.queryAll = function () {
                return careResource.query();
            };
            factory.createCare = function (care) {
                return (new careResource(care)).$save();
            };
            factory.queryOne = function (careId) {
                return careResource.get({careId: careId});
            };
            factory.deleteOne = function (careId) {
                return careResource.delete({careId: careId});
            };
            factory.updateCare = function (care) {
                return $resource(API_HOST + '/api/v1.0/cares', {}, {'updateOne': {method: 'PUT'}}).updateOne(care);
            };
            return factory;
        }])

    .factory('PractitionerSvc', ['$resource', '$log', '$state', 'API_HOST',
        function ($resource, $log, $state, API_HOST) {
            // defines the endpoint, optional params, and method names (in addition to the default ones)
            var practitionerResource = $resource(
                API_HOST + '/api/v1.0/practitioners/:pId/care/:cId',
                {pId: '@id', cId: '@id'},
                {'queryForCare': {method: 'GET', isArray: true}}
            );

            var factory = {};

            factory.queryForCare = function (care) {
                return practitionerResource.queryForCare({cId: care.id});
            };
            factory.createPractitionerForCare = function (practitioner, careId) {
                return (new practitionerResource(practitioner)).$save({cId: careId});
            };
            factory.queryOne = function (practitionerId) {
                return $resource(API_HOST + '/api/v1.0/practitioners/:pId', {pId: '@id'}).get({pId: practitionerId});
            };
            factory.deleteOne = function (practitionerId) {
                return $resource(API_HOST + '/api/v1.0/practitioners/:pId', {pId: '@id'}).delete({pId: practitionerId});
            };
            factory.updatePractitioner = function (practitioner) {
                return $resource(API_HOST + '/api/v1.0/practitioners', {}, {'updateOne': {method: 'PUT'}})
                    .updateOne(practitioner);
            };
            // note: email of logged in patient is passed automatically in this request
            factory.queryForPatient = function () {
                return $resource(API_HOST + '/api/v1.0/practitioners').query();
            };
            return factory;
        }])

    .factory('NoteSvc', ['$resource', '$log', '$state', 'API_HOST',
        function ($resource, $log, $state, API_HOST) {
            // defines the endpoint, optional params, and method names (in addition to the default ones)
            var noteResource = $resource(
                API_HOST + '/api/v1.0/notes/:nId/practitioner/:pId',
                {nId: '@id', pId: '@id'},
                {'queryForPractitioner': {method: 'GET', isArray: true}},
                {'getOne': {method: 'GET', isArray: false}}
            );

            var factory = {};

            factory.queryAll = function (practitioner) {
                return noteResource.queryForPractitioner({pId: practitioner.id});
            };
            factory.createNoteForPractitioner = function (note, practitionerId) {
                return (new noteResource(note)).$save({pId: practitionerId});
            };
            factory.queryOne = function (noteId, practitionerId) {
                return $resource(API_HOST + '/api/v1.0/notes/:nId', {nId: '@id'}).get({nId: noteId});
            };
            factory.deleteOne = function (noteId) {
                return $resource(
                    API_HOST + '/api/v1.0/notes/:nId',
                    {nId: '@id'}
                ).delete({nId: noteId});
            };
            factory.updateNote = function (note) {
                return $resource(API_HOST + '/api/v1.0/notes', {}, {'updateOne': {method: 'PUT'}}).updateOne(note);
            };
            return factory;
        }])

    // request signer
    // todo: include POST/PUT payload in signature calculations, not just URI
    .factory('RequestSigner', function () {
        var params = {};
        return {
            sign: function (uri, email, privateAuthKey) {
                params.email = email;
                params.signature = CryptoJS.HmacSHA1(uri, privateAuthKey).toString();
                return params;
            }
        }
    })

    // holder of email and privateAuthKey in local storage
    // - email and privateAuthKey are obtained in response to /login POST (on success)
    // - email and privateAuthKey are deleted on /logout success
    .factory('CredentialsHolder', ['$log', 'LOCAL_STORAGE_EMAIL_KEY', 'LOCAL_STORAGE_PAK_KEY',
        function ($log, LOCAL_STORAGE_EMAIL_KEY, LOCAL_STORAGE_PAK_KEY) {
            var params = {};
            return {
                getCredentials: function () {
                    params.email = window.localStorage.getItem(LOCAL_STORAGE_EMAIL_KEY);
                    params.privateAuthKey = window.localStorage.getItem(LOCAL_STORAGE_PAK_KEY);
                    return params;
                },
                setCredentials: function (email, privateAuthKey) {
                    $log.debug('saving email, privateAuthKey');
                    window.localStorage.setItem(LOCAL_STORAGE_EMAIL_KEY, email);
                    window.localStorage.setItem(LOCAL_STORAGE_PAK_KEY, privateAuthKey);
                },
                resetCredentials: function () {
                    $log.debug('reset email, privateAuthKey');
                    window.localStorage.removeItem(LOCAL_STORAGE_EMAIL_KEY);
                    window.localStorage.removeItem(LOCAL_STORAGE_PAK_KEY);
                },
                isLoggedIn: function () {
                    $log.debug('checking if user is logged in...');
                    var email = window.localStorage.getItem(LOCAL_STORAGE_EMAIL_KEY);
                    $log.debug('email: ' + email);
                    return email != null;
                }
            }
        }])

    // service to make login/logout requests to remote server
    .factory('AuthenticationService', ['$http', '$log', '$state', '$ionicPopup', 'CredentialsHolder', 'API_HOST', 'LoaderService',
        function ($http, $log, $state, $ionicPopup, CredentialsHolder, API_HOST, LoaderService) {
            return {
                login: function (user) {
                    LoaderService.show(100);
                    // THIS SHOULD BE HTTPS because privateKey should not be exposed over http
                    $http.post(API_HOST + '/login', user)
                        .success(function (data) {
                            CredentialsHolder.setCredentials(data.email, data.privateAuthKey);
                            LoaderService.hide();
                            $state.go('tab.cares');
                        })
                        .error(function (data, status, headers, config) {
                            $log.debug('in AuthenticationService, there was an error in login - status: ' + status);
                            if (status == 401) {
                                setTimeout(function () {
                                    $ionicPopup.alert({
                                        title: 'Error',
                                        content: '<div style="text-align: center;">Incorrect email or password</div>'
                                    }).then(function (res) {
                                            LoaderService.hide();
                                        });
                                }, 100);
                            }
                            else if (status == 404) {
                                setTimeout(function () {
                                    $ionicPopup.alert({
                                        title: 'Could not reach server',
                                        content: '<div style="text-align: center;">Please try again later</div>'
                                    }).then(function (res) {
                                            LoaderService.hide();
                                        });
                                }, 100);
                            }
                            else {
                                setTimeout(function () {
                                    $ionicPopup.alert({
                                        title: 'Error',
                                        content: '<div style="text-align: center;">Please try again later</div>'
                                    }).then(function (res) {
                                            LoaderService.hide();
                                        });
                                }, 100);
                            }
                        });
                },
                logout: function () {
                    $log.debug('user logged out');
                    CredentialsHolder.resetCredentials();
                    $state.go('login');
                }
            }
        }])

    // trigger the loading indicator
    .factory('LoaderService', function ($rootScope, $ionicLoading) {
        return {
            show: function (delay) {
                $rootScope.loading = $ionicLoading.show({
                    content: '<h1><i class="icon ion-ios7-reloading"></i></h1>',
                    animation: 'fade-in',
                    showBackdrop: true,
                    maxWidth: 200,
                    showDelay: delay > 0 ? delay : 0
                });
            },
            hide: function () {
                $rootScope.loading.hide();
            }
        }
    })

    .factory('ModalSvc', function ($ionicModal, $ionicPopup) {
        return {
            setupModal: function (type, $scope, $log) {
                $ionicModal.fromTemplateUrl('templates/modal-' + type + '.html',
                    function (modal) {
                        if (type == 'care') {
                            $scope.careModal = modal;
                            $log.info(type + ' modal setup');
                        } else if (type == 'practitioner') {
                            $scope.practitionerModal = modal;
                            $log.info(type + ' modal setup');
                        } else if (type == 'note') {
                            $scope.noteModal = modal;
                            $log.info(type + ' modal setup');
                        }
                    },
                    {
                        scope: $scope,
                        animation: 'slide-in-up'
                    });
            },
            alert: function(message) {
                $ionicPopup.alert({
                    title: 'Error',
                    content: '<div style="text-align: center;">' + message + '</div>'
                })
            }
        }
    })

;
