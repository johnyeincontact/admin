/**
 * Created by john.ye on 1/30/2018.
 */

// johnye: new file.


/**
 * nice-add-employees-ui
 * @version v1.28.0 - 2018-01-14
 * @link
    * @author  <>
 */
angular.module('nice.add.employees.ui', [
    'pascalprecht.translate',
    'nice-add-employees-ui-translation-loader',
    'nice.common.filters',
    'nice.modal.ui',
    'nice.user.services'
])
    .constant('_', window._)
    .config(['$translateProvider', function ($translateProvider) {
        'use strict';
        $translateProvider.preferredLanguage('en_US');
    }]);

angular.module('nice.add.employees.ui')
    .directive('addCampaigns', ["$q", "_", "modalSliderService", "SkillsService", "EmployeeGroupsService", "GroupsService", function ($q, _, modalSliderService, SkillsService, EmployeeGroupsService, GroupsService) {
        'use strict';

        var controller = function ($scope, _) {

            var skillsCache, schedulingUnitsCache;

            $scope.loadFilterDataSources = function () {
                $q.all([SkillsService.getSkillIdLabelPairs(), EmployeeGroupsService.getEmployeeGroupIdLabelPairs(), GroupsService.getGroupIdLabelPairs()])
                    .then(function (values) {
                        var skills = values[0],
                            schedulingUnits = values[1],
                            groups = values[2];

                        $scope.filterDatasources = [
                            {id: 'employeeGroups', translationKey: 'scheduler.filters.schedulingUnits', items: schedulingUnits},
                            {id: 'skills', translationKey: 'scheduler.filters.skills', items: skills},
                            {id: 'groups', translationKey: 'scheduler.filters.groups', items: groups}
                        ];
                    });
            };
            $scope.loadFilterDataSources();

            $scope.addEmployeeBar = {
                searchable: true,
                filterable: true,
                areFiltersVisible: false,
                filterDatasources: [],
                filterOptionsChosen: {
                    groups: [],
                    skills: [],
                    employeeGroups: []
                },
                filterSearchOperators: {
                    skills: 'and',
                    groups: $scope.groupFilterOperator ? $scope.groupFilterOperator : 'and'
                },
                searchCriteria: '',
                filteredItems: [] //items remained after filter & search. for couinting
            };

            $scope.selectedEmployeesBar = {
                searchable: true,
                filterable: false,
                areFiltersVisible: false,
                filterDataSources: false,
                filterOptionsChosen: [],
                searchCriteria: '',
                filteredItems: [] //items remained after filter & search. for couinting
            };

            $scope.omniBar = $scope.addEmployeeBar;

            $scope.$watch('showOnlySelectedUsers', function(showOnlySelectedUsers) {
                if (showOnlySelectedUsers) {
                    $scope.omniBar = $scope.selectedEmployeesBar;
                }
                else {
                    $scope.omniBar = $scope.addEmployeeBar;
                }
            });
        };
        controller.$inject = ["$scope", "_"];

        var link = function (scope, element) {
            scope.lastGroupUsersState = []; // to have the last state of groupUsers in a case of 'cancel' - the groupUsers should not be changed.
            scope.selectedUsers = [];// were just selected to this group
            scope.showOnlySelectedUsers = false;

            scope.ngModel = scope.ngModel ? scope.ngModel : {};
            scope.ngModel.allOtherUsers = scope.ngModel.allOtherUsers ? scope.ngModel.allOtherUsers : []; // users that do not belong to this group and are not selected in ui checkbox
            scope.ngModel.groupUsers = scope.ngModel.groupUsers ? scope.ngModel.groupUsers : [];
            scope.ngModel.origGroupUsers = scope.ngModel.origGroupUsers ? scope.ngModel.origGroupUsers : [];
            scope.ngDisabled = scope.ngDisabled ? scope.ngDisabled : false;

            var mapUsers = function (val) {
                val.fullName = val.firstName + ' ' + val.lastName;
                return val;
            };

            scope.$watchCollection('ngModel.allOtherUsers', function(newAllOtherUsers){
                if (!_.isEmpty(newAllOtherUsers) && _.isUndefined(newAllOtherUsers[0].fullName)) {
                    scope.ngModel.allOtherUsers.map(mapUsers);
                }
            });

            scope.$watchCollection('ngModel.groupUsers', function(newGroupUsers){
                if ( !_.isEmpty(newGroupUsers) && _.isUndefined(newGroupUsers[0].fullName)) {
                    scope.ngModel.groupUsers.map(mapUsers);
                }
            });

            scope.showAllOtherUsers = function () {
                scope.lastGroupUsersState = scope.ngModel.groupUsers.slice(); // backup the groupUsers list in a case of 'cancel'
                modalSliderService.slideIn();
                scope.selectedUsers = [];
                scope.showOnlySelectedUsers = false;
                scope.omniBar.searchCriteria = '';
                angular.forEach(scope.omniBar.filterOptionsChosen, function(value, key) {
                    scope.omniBar.filterOptionsChosen[key] = [];
                });
            };

            function addDeletedUserToAllOtherUsers(user) {
                if (!_.contains(scope.ngModel.allOtherUsers, user)) {
                    scope.ngModel.allOtherUsers.push(user);
                }
            }

            var removeFromSelectedUsers = function (user) {
                _.pull(scope.selectedUsers, user);
            };

            scope.removeUserFromGroup = function (user) {
                _.pull(scope.ngModel.groupUsers, user);
                removeFromSelectedUsers(user);
                addDeletedUserToAllOtherUsers(user);
            };

            scope.cancelAction = function () {
                scope.ngModel.groupUsers = scope.lastGroupUsersState;
                modalSliderService.slideOut();
            };

            var addToSelectedUsers = function (user) {
                scope.selectedUsers.push(user);
            };

            var removeFromAllOtherUsers = function (user) {
                _.pull(scope.ngModel.allOtherUsers, user);
            };

            scope.clearSelectedUsers = function () {
                scope.omniBar.filteredItems.forEach(function(item){
                    removeFromSelectedUsers(item);
                });
            };

            scope.userSelected = function (user) {
                return _.contains(scope.selectedUsers, user);
            };

            scope.onUserClicked = function (user) {
                if (scope.userSelected(user)) {
                    removeFromSelectedUsers(user);
                }
                else {
                    addToSelectedUsers(user);
                }
            };

            scope.selectAllUsers = function(){
                scope.selectedUsers = [];
                scope.omniBar.filteredItems.forEach(function(item){
                    addToSelectedUsers(item);
                });
            };

            scope.toggleOnlySelectedUsers = function () {
                scope.showOnlySelectedUsers = !scope.showOnlySelectedUsers;
            };

            scope.addSelectedUsersToGroup = function () {
                modalSliderService.slideOut();
                scope.ngModel.groupUsers = scope.ngModel.groupUsers.concat(scope.selectedUsers);
                scope.ngModel.allOtherUsers = _.difference(scope.ngModel.allOtherUsers, scope.selectedUsers);
            };

            if (scope.hideAddEmployeeButton) {
                scope.lastGroupUsersState = scope.ngModel.groupUsers.slice(); // backup the groupUsers list in a case of 'cancel'
                scope.selectedUsers = [];
                scope.showOnlySelectedUsers = false;
                scope.omniBar.searchCriteria = '';
                angular.forEach(scope.omniBar.filterOptionsChosen, function(value, key) {
                    scope.omniBar.filterOptionsChosen[key] = [];
                });
            }
        };

        return {
            restrict: 'E',
            templateUrl: 'addEmployees.tpl.html',
            scope: {
                ngModel: '=',
                ngDisabled: '=?',
                hideResults: '@?',
                hideAddEmployeeButton: '@?',
                selectedUsers: '=?',
                groupFilterOperator: '@?'
            },
            replace: true,
            controller: controller,
            link: link
        };
    }]);

angular.module('nice-add-employees-ui-translation-loader', ['pascalprecht.translate'])

    .config(function config($translateProvider) {
        var globalTranslations = $translateProvider.translations();
        var strings = [{"en_US":{"niceAddEmployeesUi.add":"Add","niceAddEmployeesUi.addEmployees":"Add Employees","niceAddEmployeesUi.AlreadyAssignedUsers":"Already assigned employees","niceAddEmployeesUi.assignedEmployeesTxt":"Assigned Employees","niceAddEmployeesUi.employeeCount":"{{count}} employees","niceAddEmployeesUi.noneAssigned":"No employees assigned yet","niceAddEmployeesUi.searchPlaceholder":"Start typing to find employee","niceAddEmployeesUi.selectEmployeesTxt":"Select employees","niceAddEmployeesUi.selectedTxt":"Selected:"}}];
        for (var i = 0; i < strings.length; i++){
            for (var langKey in strings[i]){
                $translateProvider.translations(langKey, strings[i][langKey]);
            }
        }
    });


angular.module('nice.add.employees.ui').run(['$templateCache', function($templateCache) {
    $templateCache.put("addEmployees.tpl.html",
        "<div class=\"addEmployeesDirective\" ng-class=\"{'no-slide': hideAddEmployeeButton}\">\n" +
        "    <div class=\"slider-wrapper\">\n" +
        "        <div class=\"selectEntities\" ng-class=\"{'slide-out': !hideAddEmployeeButton}\" id=\"slider\">\n" +
        "            <div class=\"allUsersContainer\">\n" +
        "                <div class=\"title-bar slider-header\" ng-if=\"!hideAddEmployeeButton\">\n" +
        "                    <a id=\"cancel-selected-users\" class=\"arrow-back cancel-add-users\" ng-click=\"cancelAction()\" uib-tooltip=\"{{'commonButtons.cancel' | translate}}\" tooltip-popup-delay=\"1000\" tooltip-append-to-body=\"true\"></a>\n" +
        "                    <h3 class=\"assigned-employees-title\" translate=\"niceAddEmployeesUi.selectEmployeesTxt\"></h3>\n" +
        "                    <button id=\"set-selected-users\" class=\"btn btn-primary\" ng-click=\"addSelectedUsersToGroup()\" translate=\"niceAddEmployeesUi.add\"></button>\n" +
        "                </div>\n" +
        "                <div class=\"slider-body\">\n" +
        "                    <div class=\"row omnibar-wrapper\">\n" +
        "                        <omnibar item-count=\"omniBar.filteredItems.length\"\n" +
        "                                 item-translation-key=\"niceAddEmployeesUi.employeeCount\"\n" +
        "                                 placeholder-translation-key=\"niceAddEmployeesUi.searchPlaceholder\"\n" +
        "                                 searchable=\"omniBar.searchable\"\n" +
        "                                 search-criteria=\"omniBar.searchCriteria\"\n" +
        "                                 filterable=\"omniBar.filterable\"\n" +
        "                                 filter-options-chosen=\"omniBar.filterOptionsChosen\"\n" +
        "                                 are-filters-visible=\"omniBar.areFiltersVisible\"\n" +
        "                                 filter-datasources=\"filterDatasources\"\n" +
        "                                >\n" +
        "                        </omnibar>\n" +
        "                    </div>\n" +
        "\n" +
        "                    <ul class=\"slider-buttons\">\n" +
        "                        <li>\n" +
        "                            <a class=\"assigned-employees-btn assigned-employees-selected\" ng-show=\"!showOnlySelectedUsers\" ng-click=\"toggleOnlySelectedUsers()\" translate=\"niceAddEmployeesUi.selectedTxt\"></a>\n" +
        "                            <a class=\"assigned-employees-btn assigned-employees-selected-num\" id=\"selectedUsersCounter\" ng-show=\"!showOnlySelectedUsers\" ng-click=\"toggleOnlySelectedUsers()\">({{selectedUsers.length}})</a>\n" +
        "                            <a class=\"assigned-employees-btn assigned-employees-show-all\" ng-show=\"showOnlySelectedUsers\" ng-click=\"toggleOnlySelectedUsers()\" translate=\"commonButtons.showAll\"></a>\n" +
        "                        </li>\n" +
        "                        <li>\n" +
        "                            <a class=\"clear-selected-employees\" ng-click=\"clearSelectedUsers()\" translate=\"commonButtons.clearAll\"></a>\n" +
        "                        </li>\n" +
        "                        <li>\n" +
        "                            <a class=\"clear-selected-employees\" ng-click=\"selectAllUsers()\" translate=\"commonButtons.selectAll\"></a>\n" +
        "                        </li>\n" +
        "                    </ul>\n" +
        "\n" +
        "                    <div class=\"userListsWrapper\">\n" +
        "                      <div class=\"row\" id=\"otherUsersList\" ng-if=\"!showOnlySelectedUsers\">\n" +
        "                          <!--filterAddEmployees: searchCriteria : filterOptionsChosen : searchCount-->\n" +
        "                          <div class=\"col-md-4 col-lg-3\" ng-repeat=\"user in omniBar.filteredItems = (ngModel.allOtherUsers | filter: {fullName: omniBar.searchCriteria} |  EmployeeFilter : omniBar.filterOptionsChosen : omniBar.filterSearchOperators | orderBy : ['firstName', 'lastName']) track by user.id\">\n" +
        "                            <div class=\"user-element\" ng-class=\"{checked: userSelected(user)}\" ng-click=\"onUserClicked(user)\">\n" +
        "                                <div><span class=\"circle-select\">{{user.initials}}</span></div>\n" +
        "                                <p class=\"checkdIcon\"></p>\n" +
        "                                <div class=\"user-info\">\n" +
        "                                    <div class=\"user-name\">{{user.firstName + ' ' +user.lastName}}</div>\n" +
        "                                    <!--div class=\"user-role\">{{user.role}}</div-->\n" +
        "                                    <!--The following is a temporary fix for displaying 'Agent' as a role instead of 'Employee' until custom roles will be fully supported-->\n" +
        "                                    <div class=\"user-role\">{{::user.role === 'Employee' ? 'Agent' : user.role}}</div>\n" +
        "                                </div>\n" +
        "                            </div>\n" +
        "                        </div>\n" +
        "                    </div>\n" +
        "                      <div class=\"row users-list\" id=\"usersList\" ng-show=\"!showOnlySelectedUsers\">\n" +
        "                        <div class=\"assignedUsersTitle\" translate=\"niceAddEmployeesUi.AlreadyAssignedUsers\" ng-show=\"ngModel.groupUsers.length\"></div>\n" +
        "                        <div class=\"col-md-4 col-lg-3\" ng-repeat=\"user in ngModel.groupUsers | orderBy : ['firstName', 'lastName'] track by user.id\">\n" +
        "                            <div class=\"user-element user-element-disabled\">\n" +
        "                                <div><span class=\"circle-select\">{{user.initials}}</span></div>\n" +
        "                                <p class=\"checkdIcon\"></p>\n" +
        "                                <div class=\"user-info\">\n" +
        "                                    <div class=\"user-name\">{{user.firstName + ' ' +user.lastName}}</div>\n" +
        "                                    <!--div class=\"user-role\">{{user.role}}</div-->\n" +
        "                                    <!--The following is a temporary fix for displaying 'Agent' as a role instead of 'Employee' until custom roles will be fully supported-->\n" +
        "                                    <div class=\"user-role\">{{::user.role === 'Employee' ? 'Agent' : user.role}}</div>\n" +
        "                                </div>\n" +
        "                            </div>\n" +
        "                        </div>\n" +
        "                    </div>\n" +
        "                      <div class=\"row only-selected-users-list\" ng-if=\"showOnlySelectedUsers\">\n" +
        "                        <div class=\"col-md-4 col-lg-3\" ng-repeat=\"user in omniBar.filteredItems = (selectedUsers | filter: {fullName: omniBar.searchCriteria}) track by user.id\">\n" +
        "                            <div class=\"user-element\" ng-class=\"{checked: userSelected(user)}\" ng-click=\"onUserClicked(user)\">\n" +
        "                                <div><span class=\"circle-select\">{{user.initials}}</span></div>\n" +
        "                                <button class=\"deleteUser\" ng-click=\"removeUserFromGroup(user)\" ng-disabled=\"skill.isDefault\"><p>&times;</p></button>\n" +
        "                                <div class=\"user-info\">\n" +
        "                                    <div class=\"user-name\">{{user.firstName + ' ' +user.lastName}}</div>\n" +
        "                                    <!--div class=\"user-role\">{{user.role}}</div-->\n" +
        "                                    <!--The following is a temporary fix for displaying 'Agent' as a role instead of 'Employee' until custom roles will be fully supported-->\n" +
        "                                    <div class=\"user-role\">{{::user.role === 'Employee' ? 'Agent' : user.role}}</div>\n" +
        "                                </div>\n" +
        "                            </div>\n" +
        "                        </div>\n" +
        "                    </div>\n" +
        "                    </div>\n" +
        "                </div>\n" +
        "            </div>\n" +
        "        </div>\n" +
        "    </div>\n" +
        "\n" +
        "    <div class=\"container innerUsersContainer\" id=\"mainUsersList\" ng-if=\"!hideAddEmployeeButton\">\n" +
        "        <div class=\"top-buttons\">\n" +
        "            <a class=\"btn-secondary add-employees-link btn btn-sm\" ng-click=\"showAllOtherUsers()\" ng-disabled=\"ngDisabled\">\n" +
        "                {{'niceAddEmployeesUi.addEmployees' | translate}}\n" +
        "            </a>\n" +
        "        </div>\n" +
        "        <div class=\"title-bar selected-users-details\" ng-if=\"!hideResults\">\n" +
        "            <span class=\"assigned-employees-title\" translate=\"niceAddEmployeesUi.assignedEmployeesTxt\"></span>\n" +
        "            <span class=\"assigned-employees-title\" id=\"assigned-employees-counter\">({{ngModel.groupUsers.length}})</span>\n" +
        "        </div>\n" +
        "        <div class=\"row user-tiles\" ng-if=\"!hideResults\">\n" +
        "            <div class=\"col-md-4 col-lg-3 skill-user\" ng-repeat=\"user in ngModel.groupUsers | filter: query | orderBy : ['firstName', 'lastName'] track by user.id\">\n" +
        "                <div class=\"user-element user-element-main-tab\">\n" +
        "                    <div><span class=\"circle-select\">{{user.initials}}</span></div>\n" +
        "                    <div class=\"user-info\">\n" +
        "                        <div class=\"user-name\">{{user.firstName + ' ' +user.lastName}}</div>\n" +
        "                        <!--div class=\"user-role\">{{user.role}}</div-->\n" +
        "                        <!--The following is a temporary fix for displaying 'Agent' as a role instead of 'Employee' until custom roles will be fully supported-->\n" +
        "                        <div class=\"user-role\">{{::user.role === 'Employee' ? 'Agent' : user.role}}</div>\n" +
        "                    </div>\n" +
        "                    <button class=\"deleteUser\" ng-click=\"removeUserFromGroup(user)\" ng-disabled=\"skill.isDefault\">&times;</button>\n" +
        "                </div>\n" +
        "            </div>\n" +
        "        </div>\n" +
        "        <div ng-if=\"!ngModel.groupUsers.length && !hideResults\" class=\"no-employees-assigned-txt\">{{'niceAddEmployeesUi.noneAssigned' | translate}}</div>\n" +
        "    </div>\n" +
        "</div>\n" +
        "");
}]);

