/**
 * Created by john.ye on 1/27/2018.
 */
angular.module('nice.saas.wfm.groupsModule')
    .controller('campaignModalCtrl', function GroupsCtrl($scope, GroupsService, $uibModalInstance, Utils, $log, UserService,  _, $translate, $q, $uibModal, PermissionService) {
        'use strict';
        $scope.headerText = "Select Campaigns";

        $scope.lstUsers = [];
        $scope.groups = [];
        $scope.totalRowCount = 0;
        $scope.editRowIndex = [];
        $scope.isDeleteEnabled = false;
        $scope.noItemsOverlayTranslationData = {
            itemLabel: $translate.instant('groupsPage.item')
        };
        $scope.groupsPopovers = {
            deleteTemplateUrl: 'groups/popovers/deletePopover.tpl.html',
            deleteSelectedGroupsTplUrl: 'groups/popovers/deleteSelectedGroupsPopover.tpl.html'
        };

        var controller = this;

        controller.$onInit = function () {
            $scope.isDeleteEnabled = PermissionService.allowAccess('user:delete');
        };

        function onRowClicked(params) {
            $scope.currentRow = params.rowIndex;
            var clonedGroup = angular.copy(params.data);
            $scope.openGroupModal(clonedGroup);
        }

        function onGridReady(event) {
            $scope.gridOptions.api.showLoadingOverlay();
        }

        var columnDefs = [
            {
                width: 400,
                field: 'name',
                headerCellRenderer: function (params) {
                    return '<span translate="groupsPage.gridColumnsHeaders.name" />';
                },
                onCellClicked: onRowClicked
            },
            {
                width: 330,
                field: 'employees',
                headerCellRenderer: function (params) {
                    return '<span translate="groupsPage.gridColumnsHeaders.employees" />';
                },
                onCellClicked: onRowClicked
            }
        ];

        $scope.gridOptions = {
            columnDefs: columnDefs,
            dontUseScrolls: false,
            rowSelection: 'multiple',
            rowDeselection: true,
            rowHeight: 45,
            enableColResize: true,
            enableSorting: true,
            angularCompileRows: true,
            angularCompileHeaders: true,
            suppressCellSelection: true,
            suppressRowClickSelection: true,
            onReady: onGridReady
        };

        function sortByGroupName(groupsArr) {
            return _.sortBy(groupsArr, function (group) {
                return group.name ? group.name.toLowerCase() : '';
            });
        }

        function retrieveUsers() {
            UserService.getUserList()
                .then(function (result) {
                    $scope.lstUsers = result;
                    convertUsersArrayToHash($scope.lstUsers);
                    $scope.getGroupsWithAssignedUsersNumber();
                });
        }

        function convertUsersArrayToHash(usersArr) {
            $scope.hashUsers = {};
            _.each(usersArr, function (user) {
                $scope.hashUsers[user.id] = user;
            });
        }

        $scope.getGroupsWithAssignedUsersNumber = function () {
            if ($scope.gridOptions.api) {
                $scope.gridOptions.api.showLoadingOverlay();
            }

            GroupsService.getGroups()
                .then(function(groups) {
                    var sortedGroups = sortByGroupName(groups);
                    if (sortedGroups) {
                        for (var i = 0; i < sortedGroups.length; i += 1) {
                            sortedGroups[i].employees = sortedGroups[i].userCount;
                        }
                    }
                    $scope.groups = sortedGroups;
                    $scope.gridOptions.rowData = sortedGroups;
                    $scope.totalRowCount = sortedGroups.length;
                    if ($scope.gridOptions.api) {
                        $scope.gridOptions.api.setRowData();
                        $scope.gridOptions.api.hideOverlay();
                    }
                });
        };

        retrieveUsers();

        $scope.openGroupModal = function (group) {
            var modalInstance = $uibModal.open({
                templateUrl: 'groups/modals/groupModal/groupModal.tpl.html',
                controller: 'GroupModalCtrl',
                windowTopClass: 'groups-modal-wrapper',
                size: 'lg',
                backdrop: 'static',
                resolve: {
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
                }
            });

            modalInstance.result.then(function (createSucceeded) {
                $log.debug('create/update group is successfully done. modal closed');
                if (createSucceeded) {
                    $scope.getGroupsWithAssignedUsersNumber();
                }
            });
        };

        // johnye
        $scope.cancel = function () {
            $scope.closeModal = true;
            $uibModalInstance.dismiss('cancel');
        };

        $scope.isCurrentRowEditable = function (rowIndex) {
            return _.include($scope.editRowIndex, rowIndex);
        };

        function deleteRowFromTable(rowIndex) {
            $scope.gridOptions.rowData.splice(rowIndex, 1);
            $scope.gridOptions.api.onNewRows();
        }

        function getRow(rowIndex) {
            return $scope.gridOptions.api.getModel().getVirtualRow(rowIndex);
        }

        $scope.deleteRow = function () {
            if ($scope.deleteRowIndex === undefined) {
                $log.error('No row was selected for deletion');
                Utils.displayBottomMessage('groupsPage.errorDelete', 'error');//todo change to group error
                return;
            }
            var rowToDelete = getRow($scope.deleteRowIndex);
            $scope.inSavingProcess = true;
            GroupsService.deleteGroups([rowToDelete.data]).then(function () {
                $scope.inSavingProcess = false;
                deleteRowFromTable(rowToDelete.id);
                $scope.deleteRowIndex = '';
                $scope.totalRowCount = $scope.gridOptions.rowData.length;
            }, function (error) {
                Utils.displayErrorMessage(error);
                $scope.inSavingProcess = false;
            });
        };

        $scope.deleteClicked = function (rowIndex) {
            $scope.deleteRowIndex = rowIndex;
        };

        $scope.deleteSelectedGroups = function () {
            var selectedNodes = $scope.gridOptions.api.getSelectedNodes();
            var groupsTodelete = [];
            _.map(selectedNodes, function (node) {
                groupsTodelete.push(node.data);
            });

            GroupsService.deleteGroups(groupsTodelete)
                .then(function success() {
                    for (var j = selectedNodes.length - 1; j >= 0; j -= 1) { //support sorting
                        $scope.gridOptions.rowData.splice(selectedNodes[j].id, 1);
                    }
                    $scope.gridOptions.api.onNewRows();
                    $scope.totalRowCount = $scope.gridOptions.rowData.length;

                }, function failure(error) {
                    Utils.displayErrorMessage(error);
                });
        };

        if (PermissionService.allowAccess('user:delete')) {
            $scope.bulkOperations = [
                {
                    name: $translate.instant('commonButtons.delete'),
                    class: 'delete-btn btn-secondary',
                    popoverTemplateUrl: $scope.groupsPopovers.deleteSelectedGroupsTplUrl
                }
            ];

            //workaround - we should upgrade to the latest angular-translate version that implements a new api 'onReady()' -
            //returns a promise that resolved when $translate service is ready - and use it in the InitializationService.
            //The following should be deleted afterwards.
            $translate('commonButtons.delete').then(function (result) {
                $scope.bulkOperations[0].name = result;
            });
        }
    });
