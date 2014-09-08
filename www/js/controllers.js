angular.module('sawa-patient.controllers', [])

    .controller('CaresCtrl', function ($scope, $state, $log, CareSvc, CredentialsHolder, ModalSvc) {
        if (!CredentialsHolder.isLoggedIn()) {
            $state.go('login');
        }

        // load care data
        $scope.cares = CareSvc.queryAll();
        $scope.care = {};

        // create care
        ModalSvc.setupModal('care', $scope, $log);
        $scope.openCareModal = function () {
            $scope.careModal.show();
        };
        $scope.closeCareModal = function () {
            $scope.careModal.hide();
            $scope.careModal.remove();
            $scope.care = emptyCare;
        };
        $scope.saveCare = function () {
            $log.debug('current care: ' + JSON.stringify($scope.care));
            CareSvc.createCare($scope.care).then(
                function () {
                    $scope.closeCareModal();
                    $scope.cares = CareSvc.queryAll();
                },
                function () {
                    ModalSvc.alert('Could not save.  Please try again later.');
                });
        };
    })

    .controller('CareDetailsCtrl', function ($scope, $state, $stateParams, $ionicPopup, $log, CareSvc, CredentialsHolder, PractitionerSvc, ModalSvc) {
        if (!CredentialsHolder.isLoggedIn()) {
            $state.go('login');
        }

        // get selected care and associated practitioners
        CareSvc.queryOne($stateParams.id).$promise.then(function (care) {
            $scope.care = care;
            $scope.practitioner = {};
            $scope.practitioners = PractitionerSvc.queryForCare(care);
        });

        // update care
        ModalSvc.setupModal('care', $scope, $log);
        $scope.openCareModal = function () {
            $scope.careModal.show();
        };
        $scope.closeCareModal = function () {
            $scope.careModal.hide();
            $scope.careModal.remove();
        };
        $scope.saveCare = function () {
            $log.debug('updating current care: ' + JSON.stringify($scope.care));
            CareSvc.updateCare($scope.care).$promise.then(
                // success
                function () {
                    $scope.closeCareModal();
                },
                // error
                function () {
                    ModalSvc.alert('Could not save.  Please try again later.');
                });
        };

        // delete care
        $scope.deleteCare = function () {
            $ionicPopup.confirm({
                title: 'Delete Care',
                content: '<div style="text-align: center;">Are you sure you want to delete "' +
                    $scope.care.facilityName + '" and all its associated data?</div>'
            }).then(function (res) {
                    if (res) {
                        CareSvc.deleteOne($scope.care.id).$promise.then(
                            function () {
                                $scope.closeCareModal();
                                $state.go('tab.cares');
                            },
                            function () {
                                ModalSvc.alert('Could not delete.  Please try again later.');
                            });
                    }
                });
        };

        // create practitioner
        ModalSvc.setupModal('practitioner', $scope, $log);
        $scope.openPractitionerModal = function () {
            $scope.practitionerModal.show();
        };
        $scope.closePractitionerModal = function () {
            $scope.practitionerModal.hide();
            $scope.practitionerModal.remove();
            $scope.practitioner = emptyPractitioner;
        };
        $scope.savePractitioner = function () {
            PractitionerSvc.createPractitionerForCare($scope.practitioner, $scope.care.id).then(
                function () {
                    $scope.closePractitionerModal();
                    $scope.practitioners = PractitionerSvc.queryForCare($scope.care);
                },
                // error
                function () {
                    ModalSvc.alert('Could not save.  Please try again later.');
                });
        };
    })

    .controller('PractitionerDetailsCtrl', function ($scope, $state, $stateParams, $ionicPopup, $log,
                                                     CareSvc, NoteSvc, CredentialsHolder, PractitionerSvc, ModalSvc) {
        if (!CredentialsHolder.isLoggedIn()) {
            $state.go('login');
        }

        // get practitioner and associated notes
        PractitionerSvc.queryOne($stateParams.pId, $stateParams.cId).$promise.then(function (practitioner) {
            $scope.practitioner = practitioner;
            $scope.notes = NoteSvc.queryAll(practitioner);
            $scope.note = {};
            // get care in order to reload all practitioners
            CareSvc.queryOne(practitioner.care.id).$promise.then(function (care) {
                $scope.care = care;

            });
        });

        // update practitioner
        ModalSvc.setupModal('practitioner', $scope, $log);
        $scope.openPractitionerModal = function () {
            $scope.practitionerModal.show();
        };
        $scope.closePractitionerModal = function () {
            $scope.practitionerModal.hide();
            $scope.practitionerModal.remove();
        };
        $scope.savePractitioner = function () {
            PractitionerSvc.updatePractitioner($scope.practitioner).$promise.then(
                // success
                function () {
                    $scope.closePractitionerModal();
                },
                function () {
                    ModalSvc.alert('Could not save.  Please try again later.');
                });
        };

        // delete practitioner
        $scope.deletePractitioner = function () {
            $ionicPopup.confirm({
                title: 'Delete Practitioner',
                content: '<div style="text-align: center;">Are you sure you want to delete practitioner "' +
                    $scope.practitioner.name + '" and all their associated data?</div>'
            }).then(function (res) {
                    if (res) {
                        PractitionerSvc.deleteOne($scope.practitioner.id).$promise.then(
                            function () {
                                $scope.closePractitionerModal();
                                $state.go('tab.care-practitioners', {"id": $scope.care.id});
                            },
                            // error
                            function () {
                                ModalSvc.alert('Could not delete.  Please try again later.');
                            });
                    }
                });
        };

        // save note
        ModalSvc.setupModal('note', $scope, $log);
        $scope.openNoteModal = function () {
            $scope.noteModal.show();
        };
        $scope.closeNoteModal = function () {
            $scope.noteModal.hide();
            $scope.noteModal.remove();
            $scope.note = emptyNote;
        };
        $scope.saveNote = function () {
            NoteSvc.createNoteForPractitioner($scope.note, $scope.practitioner.id).then(
                function () {
                    $scope.closeNoteModal();
                    $scope.notes = NoteSvc.queryAll($scope.practitioner);
                },
                function () {
                    ModalSvc.alert('Could not save.  Please try again later.');
                });
        };
    })

    .controller('NoteDetailsCtrl', function ($scope, $state, $stateParams, $ionicPopup, $log,
                                             NoteSvc, CredentialsHolder, PractitionerSvc, ModalSvc) {
        if (!CredentialsHolder.isLoggedIn()) {
            $state.go('login');
        }

        // get note
        NoteSvc.queryOne($stateParams.nId, $stateParams.pId).$promise.then(function (note) {
            $scope.note = note;
            // get practitioner in order to reload all notes
            PractitionerSvc.queryOne($stateParams.pId, $stateParams.cId).$promise.then(function (practitioner) {
                $scope.practitioner = practitioner;

            });
        });

        // update note
        ModalSvc.setupModal('note', $scope, $log);
        $scope.openNoteModal = function () {
            $scope.noteModal.show();
        };
        $scope.closeNoteModal = function () {
            $scope.noteModal.hide();
            $scope.noteModal.remove();
        };
        $scope.saveNote = function () {
            $log.debug('current note: ' + JSON.stringify($scope.note));
            NoteSvc.updateNote($scope.note).$promise.then(
                // success
                function () {
                    $scope.closeNoteModal();
                },
                function () {
                    ModalSvc.alert('Could not save.  Please try again later.');
                });
        };

        // delete note
        $scope.deleteNote = function () {
            $ionicPopup.confirm({
                title: 'Delete Note',
                content: '<div style="text-align: center;">Are you sure you want to delete note?</div>'
            }).then(function (res) {
                    if (res) {
                        NoteSvc.deleteOne($scope.note.id).$promise.then(
                            function () {
                                $scope.closeNoteModal();
                                $state.go('tab.practitioner-notes',
                                    {"pId": $scope.practitioner.id, "cId": $scope.practitioner.care.id});
                            },
                            function () {
                                ModalSvc.alert('Could not delete.  Please try again later.');
                            });
                    }
                });
        };
    })

    .controller('PractitionersCtrl', function ($scope, $state, CredentialsHolder, PractitionerSvc) {
        if (!CredentialsHolder.isLoggedIn()) {
            $state.go('login');
        }
        $scope.practitioners = PractitionerSvc.queryForPatient();
    })

    .controller('ShareCtrl', function ($scope, $state, CredentialsHolder) {
        if (!CredentialsHolder.isLoggedIn()) {
            $state.go('login');
        }
    })

    .controller('AccountCtrl', function ($scope, $state, CredentialsHolder, AuthenticationService) {
        if (!CredentialsHolder.isLoggedIn()) {
            $state.go('login');
        }
        $scope.signOut = function () {
            AuthenticationService.logout();
        };
        $scope.loggedInUserEmail = CredentialsHolder.getCredentials().email;
    })

    .controller('LoginCtrl', function ($scope, AuthenticationService) {
        $scope.user = {
            email: null,
            password: null
        };

        $scope.logIn = function () {
            if (!$scope.user.email || !$scope.user.password) {
                return;
            }
            AuthenticationService.login($scope.user);
        };
    });

var emptyCare = {
    facilityName: "",
    location: "",
    start: "",
    end: "",
    reason: "",
    note: "",
    overnight: false
};

var emptyPractitioner = {
    name: "",
    specialty: "",
    phone: "",
    email: ""
};

var emptyNote = {
    date: "",
    content: ""
};
