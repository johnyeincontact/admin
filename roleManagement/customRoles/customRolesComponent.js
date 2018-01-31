angular.module('nice.saas.wfm.customRolesModule')
    .component('customRoles', {
        templateUrl: 'roleManagement/customRoles/customRoles.tpl.html',
        controller: ['$scope', 'userRolesService', 'PermissionIconsService', 'LicenseService', 'productCatalogService', '$timeout', 'Utils', '$log', '$state', '$sce', '$translate', '$uibModal', function ($scope, userRolesService, PermissionIconsService, LicenseService, productCatalogService, $timeout, Utils, $log, $state, $sce, $translate, $uibModal) {
            'use strict';
            var $ctrl = this;
            $ctrl.initialLoad = true;
            $scope.productCatalog = {};
            $scope.productCatalogUpdated = [];
            $scope.isPermissionNew = true;

            $scope.ACDLicense = false;
            $scope.role = {};
            $scope.selectedPrivilegeActions = {};

            $scope.isNewRole = function () {
                return ($state.params.currentRole === null);
            };

            $scope.isDraftRole = function () {
                if ($state.params.currentRole !== null){
                    return ($state.params.currentRole.role.status === 'DRAFT');
                }
                else {
                    return false;
                }
            };

            $scope.pageTitle = $scope.isNewRole() ?
                $translate.instant('rolesListPage.newRolePageTitle') :
                $translate.instant('rolesListPage.editRolePageTitle');

            $ctrl.customRole = {};

            $ctrl.$onInit = function () {
                if (!$scope.isNewRole()) {
                    $scope.role.id = $state.params.currentRole.role.roleId;
                    $scope.role.status = $state.params.currentRole.role.status;
                    $ctrl.customRole.displayName = $state.params.currentRole.role.displayName;
                    $ctrl.customRole.description = $state.params.currentRole.role.description;
                    $ctrl.updateDisplayRoleName();
                    for (var applicationIndex in $state.params.currentRole.role.applications){
                        for (var featureIndex in $state.params.currentRole.role.applications[applicationIndex].features){
                            for (var privilegeIndex in $state.params.currentRole.role.applications[applicationIndex].features[featureIndex].privileges){
                                var privilegeId = $state.params.currentRole.role.applications[applicationIndex].features[featureIndex].privileges[privilegeIndex].privilegeId;
                                var actions = $state.params.currentRole.role.applications[applicationIndex].features[featureIndex].privileges[privilegeIndex].actions;
                                $scope.selectedPrivilegeActions[privilegeId] = actions;
                            }
                        }
                    }
                }
            };

            $scope.isActionPresent = function (privilegeId, action) {
                var actions = $scope.selectedPrivilegeActions[privilegeId];
                for (var actionIndex in actions) {
                    if (actions[actionIndex] === action) {
                        return true;
                    }
                }
                return false;
            };

            $scope.getPrivileges = function(ids){
                var privileges = [];
                for (var idIndex in ids){
                    var id = ids[idIndex];
                    var privilegeMapped = $scope.productCatalog.products[0].privileges[id];
                    privileges.push(privilegeMapped);
                }
                for (var privilegeIndex in privileges){
                    for (var actionIndex in privileges[privilegeIndex].actions){
                        if (!$scope.isNewRole()) {
                            privileges[privilegeIndex].actions[actionIndex]['status'] = $scope.isActionPresent(privileges[privilegeIndex].id, privileges[privilegeIndex].actions[actionIndex].id);
                        }
                        else {
                            privileges[privilegeIndex].actions[actionIndex]['status'] = false;
                        }
                    }
                }
                return privileges;
            };
            $scope.getFeatures = function (featuresFromPC) {
                var features = [];
                for (var featureIndex in featuresFromPC){
                    var feature = featuresFromPC[featureIndex];
                    var featureId = feature.id;
                    var displayName = $scope.productCatalog.products[0].categories[featureId].name;
                    var privileges = $scope.getPrivileges($scope.productCatalog.products[0].categories[featureId].privilegeIds);
                    features.push({featureId : featureId, displayName : displayName, privileges : privileges});
                }
                return features;
            };

            $scope.updateProductCatalog = function(){
                for (var applicationIndex in $scope.productCatalog.products[0].categoriesHierarchy){
                    var application = $scope.productCatalog.products[0].categoriesHierarchy[applicationIndex];
                    var applicationId = application.id;
                    var applicationDisplayName = $scope.productCatalog.products[0].categories[applicationId].name;
                    var features = $scope.getFeatures(application.subCategories);
                    $scope.productCatalogUpdated.push({'applicationId' : applicationId, 'displayName': applicationDisplayName, 'features': features});
                    $scope.isPermissionResolved = true;
                }
            };

            productCatalogService.getProductCatalog()
                .then(function success(response) {
                    $scope.productCatalog = {'products' : response.products};
                    $scope.updateProductCatalog();
                    console.log(response);
                }, function failure(reason) {
                    $log.error('cannot get product catalog.: ', reason);
                });

            $scope.checkRestrictedAccess = function (category) {
                if (category === 'acd'){
                    $scope.ACDLicense = true;
                }
                else {
                    $scope.ACDLicense = false;
                }
            };

            $scope.getSelectedApplications = function(){
                var selectedApplications = [];
                for (var applicationIndex in $scope.productCatalogUpdated){
                    var selectedFeatures = $scope.getSelectedFeatures($scope.productCatalogUpdated[applicationIndex].features);
                    if (selectedFeatures.length !== 0){
                        selectedApplications.push({'applicationId' : $scope.productCatalogUpdated[applicationIndex].applicationId, 'features' : selectedFeatures});
                    }
                }
                return selectedApplications;
            };

            $scope.getSelectedFeatures = function(features){
                var selectedFeatures = [];
                for (var featureIndex in features){
                    var selectedPrivileges = $scope.getSelectedPrivileges(features[featureIndex].privileges);
                    if (selectedPrivileges.length !== 0){
                        selectedFeatures.push({'featureId' : features[featureIndex].featureId, 'privileges' : selectedPrivileges});
                    }
                }
                return selectedFeatures;
            };

            $scope.getSelectedPrivileges = function(privileges){
                var selectedPrivileges = [];
                for (var privilegeIndex in privileges){
                    var selectedActions = $scope.getSelectedActions(privileges[privilegeIndex].actions);
                    if (selectedActions.length !== 0){
                        selectedPrivileges.push({'privilegeId' : privileges[privilegeIndex].id, 'actions' : selectedActions});
                    }
                }
                return selectedPrivileges;
            };

            $scope.getSelectedActions = function(actions){
                var selectedActions = [];
                for (var actionIndex in actions){
                    if (actions[actionIndex].status === true){
                        selectedActions.push(actions[actionIndex].id);
                    }
                }
                return selectedActions;
            };
            $scope.getIconByCategory = function (iconId) {
                $log.info('Icon Id id '+ iconId + 'icon is '+ PermissionIconsService.getSvgCategoryIcons(iconId.toLowerCase()));
                return $sce.trustAsHtml(PermissionIconsService.getSvgCategoryIcons(iconId.toLowerCase()));
            };
            $scope.interacted = Utils.fieldInteracted;
            $scope.submitted = false;

            $scope.changePageState = function () {
                if ($scope.isPermissionNew === false) {
                    $scope.isPermissionNew = true;
                }
            };

            $ctrl.displayCustomRoleName = '';
            $scope.forms = {};

            var tabIndex = {
                'general': 0,
                'permissions': 1,
                'restrictedAccess': 2
            };

            $scope.cancel = function () {
                $state.go('roleManagement', '');
            };

            $ctrl.updateDisplayRoleName = function () {
                $ctrl.displayCustomRoleName = $ctrl.customRole.displayName;
            };

            $ctrl.saveCustomRole = function () {
                if ($scope.forms.generalInfoForm.roleName.$valid) {
                    $ctrl.customRole['applications'] = $scope.getSelectedApplications();
                    if ($scope.role.id !== undefined){
                        $ctrl.customRole['roleId'] = $scope.role.id;
                        $ctrl.customRole['status'] = $scope.role.status;
                        if ($ctrl.customRole.description === undefined || $ctrl.customRole.description === null) {
                            $ctrl.customRole.description = '';
                        }
                        userRolesService.editRole($ctrl.customRole)
                            .then(function success(response) {
                                if (response.success) {
                                    $scope.isPermissionNew = false;
                                    Utils.displayBottomMessage('rolesListPage.updateSuccessMsg', 'success');
                                    if (!$scope.isNewRole()){
                                        $state.go('roleManagement', '');
                                    }
                                }
                            }, function failure(reason) {
                                $log.error('cannot get roles.: ', reason);
                                if (reason.data && reason.data.details) {
                                    Utils.displayBottomTranslatedMessage(reason.data.details, 'error');
                                } else {
                                    Utils.displayBottomMessage('rolesListPage.updateFailureMsg', 'error');
                                }
                            });
                    }
                    else {
                        userRolesService.createRole($ctrl.customRole)
                            .then(function success(response) {
                                if (response.success) {
                                    $scope.role.id = response.roleId;
                                    $scope.role.status = 'DRAFT';
                                    $scope.role.name = response.roleName;
                                    $scope.isPermissionNew = false;
                                    Utils.displayBottomMessage('rolesListPage.successMsg', 'success');
                                }
                            }, function failure(reason) {
                                $log.error('cannot get roles.: ', reason);
                                if (reason.data && reason.data.details) {
                                    Utils.displayBottomTranslatedMessage(reason.data.details, 'error');
                                } else {
                                    Utils.displayBottomMessage('rolesListPage.failureMsg', 'error');
                                }
                            });
                    }
                }
            };
            $ctrl.saveAndActivateCustomRole = function () {
                if ($scope.forms.generalInfoForm.roleName.$valid) {
                    $ctrl.customRole['applications'] = $scope.getSelectedApplications();
                    $ctrl.customRole['status'] = 'ACTIVE';
                    if ($scope.role.id !== undefined){
                        $ctrl.customRole['roleId'] = $scope.role.id;
                        if ($ctrl.customRole.description === undefined) {
                            $ctrl.customRole.description = '';
                        }
                        userRolesService.editRole($ctrl.customRole)
                            .then(function success(response) {
                                if (response.success) {
                                    $scope.isPermissionNew = false;
                                    Utils.displayBottomMessage('rolesListPage.updateSuccessMsg', 'success');
                                    $state.go('roleManagement', '');
                                }
                            }, function failure(reason) {
                                $log.error('cannot get roles.: ', reason);
                                if (reason.data && reason.data.details) {
                                    Utils.displayBottomTranslatedMessage(reason.data.details, 'error');
                                } else {
                                    Utils.displayBottomMessage('rolesListPage.updateFailureMsg', 'error');
                                }
                            });
                    }
                    else {
                        userRolesService.createRole($ctrl.customRole)
                            .then(function success(response) {
                                if (response.success) {
                                    $scope.role.id = response.roleId;
                                    $scope.role.name = response.roleName;
                                    Utils.displayBottomMessage('rolesListPage.successMsg', 'success');
                                    $state.go('roleManagement', '');
                                }
                            }, function failure(reason) {
                                $log.error('cannot get roles.: ', reason);
                                if (reason.data && reason.data.details) {
                                    Utils.displayBottomTranslatedMessage(reason.data.details, 'error');
                                } else {
                                    Utils.displayBottomMessage('rolesListPage.failureMsg', 'error');
                                }
                            });
                    }
                }
            };

            $ctrl.hideAddCampaign = true;
            $ctrl.expandRow = function(){
                $ctrl.hideAddCampaign = !$ctrl.hideAddCampaign;
            };

            // ------------------------------------------------------------
            $ctrl.openGroupModal = function () {
                var modalInstance = $uibModal.open({
                    templateUrl: 'roleManagement/customRoles/restrictedAccess/modals/campaignModal/campaignModal.tpl.html',
                    controller: 'campaignModalCtrl',
                    windowTopClass: 'groups-modal-wrapper',
                    size: 'lg',
                    backdrop: 'static',
                    resolve: {
                        /* jwy: commented out since I don't know what it should be.
                        currentGroup: function () {
                            return group;
                        },
                        lstUsers: function () {
                            return $scope.lstUsers;
                        },
                        allGroupNames: function () {
                            if (!group) {
                                group = {name: ''};
                            }
                            return _.map($scope.groups, function (item) {
                                if (group.name !== item.name) {
                                    return item.name;
                                }
                            });
                        }
                        */
                    }
                });

                modalInstance.result.then(function (createSucceeded) {
                    $log.debug('create/update group is successfully done. modal closed');
                    if (createSucceeded) {
                        $scope.getGroupsWithAssignedUsersNumber();
                    }
                });
            }

            // ------------------------------------------------------------

            $ctrl.none = function(){
                alert('None');
            };

            $ctrl.allAndFuture = function(){
                alert('allAndFuture');
            };

            $ctrl.custom = function(){
                alert('custom');
            };

            $ctrl.addCampaign = function(){
                $ctrl.openGroupModal();
            };
        }]
    });