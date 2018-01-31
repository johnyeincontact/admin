angular.module( 'nice.saas.wfm.customRolesModule', [
    'ui.router',
    'gridster'
]).config(function config($stateProvider) {
    'use strict';

    $stateProvider.state('customRoles', {
        url: '/customRoles',
        params: {currentRole: null},
        views: {
            main: 'customRoles'
        },
        data: {requireLogin: true, moduleId: 'admin', pageId: 'roleManagement'}
    });
});