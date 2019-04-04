/*
 * Copyright (C) 2016 OpenMotics BVBA
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import {PLATFORM} from 'aurelia-pal';
import {inject, Factory} from "aurelia-framework";
import {Router} from "aurelia-router";
import moment from "moment";
import {Base} from "./resources/base";
import {Storage} from "./components/storage";
import {Authentication} from "./components/authentication";
import {App} from "./containers/app";
import {Installation} from "./containers/installation";
import {Toolbox} from "./components/toolbox";

@inject(Router, Authentication, Factory.of(App), Factory.of(Installation))
export class Index extends Base {
    constructor(router, authenication, appFactory, installationFactory, ...rest) {
        super(...rest);
        this.appFactory = appFactory;
        this.installationFactory = installationFactory;
        this.router = router;
        this.authentication = authenication;
        this.apps = [];
        this.locale = undefined;
        this.connectionSubscription = undefined;
        this.copyrightYear = moment().year();

        this.shared.setInstallation = async (i) => { await this.setInstallation(i); }
    }

    async setLocale(locale) {
        let oldLocale = this.i18n.getLocale();
        await this.i18n.setLocale(locale);
        this.ea.publish('i18n:locale:changed', { oldValue: oldLocale, newValue: locale });
        this.locale = locale;
        this.shared.locale = locale;
        moment.locale(locale);
        Storage.setItem('locale', locale);
        this.signaler.signal('aurelia-translation-signal');
    }

    async setInstallation(installation) {
        if (installation !== undefined) {
            this.shared.installation = installation;
            Storage.setItem('installation', installation.id);
            await this.loadFeatures();
        } else {
            this.shared.installation = undefined;
            Storage.removeItem('installation');
            this.shared.features = [];
        }
        this.ea.publish('om:installation:change', {installation: this.shared.installation});
    }

    async loadFeatures() {
        try {
            this.shared.features = await this.api.getFeatures();
        } catch (error) {
            this.shared.features = [];
        }
        for (let route of this.router.navigation) {
            if (route.settings.needsFeature !== undefined) {
                route.config.show = this.shared.features.contains(route.settings.needsFeature);
            }
        }
        this.signaler.signal('navigate');
    }

    async setNavigationGroup(group) {
        if (this.shared.target !== 'cloud') {
            return;
        }
        this.shared.navigationGroup = group;
        if (group === 'installation') {
            if (this.shared.installation !== undefined) {
                this.router.navigate('dashboard');
            } else {
                this.router.navigate('cloud/installations');
            }
        } else {
            this.router.navigate('cloud/profile');
        }
    }

    // Aurelia
    async activate() {
        if (this.shared.target === 'cloud') {
            let installations = await this.api.getInstallations();
            Toolbox.crossfiller(installations, this.shared.installations, 'id', (id) => {
                return this.installationFactory(id);
            });
            let installationId = Storage.getItem('installation');
            if (installationId === undefined && this.shared.installations.length > 0) {
                installationId = this.shared.installations[0].id;
            }
            let installation = this.shared.installations.filter((i) => i.id === installationId)[0];
            if (installation !== undefined) {
                await installation.checkAlive(2000);
                if (!installation.alive) {
                    installation = undefined;
                }
            }
            await this.shared.setInstallation(installation);
        }

        let routes = [
            {
                route: '', redirect: ''
            },
            {
                route: 'dashboard', name: 'dashboard', moduleId: PLATFORM.moduleName('pages/dashboard', 'pages'), nav: true, auth: true, land: true, show: true,
                settings: {key: 'dashboard', title: this.i18n.tr('pages.dashboard.title'), group: 'installation'}
            },
            {
                route: 'outputs', name: 'outputs', moduleId: PLATFORM.moduleName('pages/outputs', 'pages'), nav: true, auth: true, land: true, show: true,
                settings: {key: 'outputs', title: this.i18n.tr('pages.outputs.title'), group: 'installation'}
            },
            {
                route: 'thermostats', name: 'thermostats', moduleId: PLATFORM.moduleName('pages/thermostats', 'pages'), nav: true, auth: true, land: true, show: true,
                settings: {key: 'thermostats', title: this.i18n.tr('pages.thermostats.title'), group: 'installation'}
            },
            {
                route: 'energy', name: 'energy', moduleId: PLATFORM.moduleName('pages/energy', 'pages'), nav: true, auth: true, land: true, show: true,
                settings: {key: 'energy', title: this.i18n.tr('pages.energy.title'), group: 'installation'}
            },
            {
                route: 'settings', name: 'settings', nav: true, redirect: '', show: true,
                settings: {key: 'settings', group: 'installation'}
            },
            {
                route: 'settings/initialisation', name: 'settings.initialisation', moduleId: PLATFORM.moduleName('pages/settings/initialisation', 'pages.settings'), nav: true, auth: true, land: true, show: true,
                settings: {key: 'settings.initialisation', title: this.i18n.tr('pages.settings.initialisation.title'), parent: 'settings', group: 'installation'}
            },
            {
                route: 'settings/outputs', name: 'settings.outputs', moduleId: PLATFORM.moduleName('pages/settings/outputs', 'pages.settings'), nav: true, auth: true, land: true, show: true,
                settings: {key: 'settings.outputs', title: this.i18n.tr('pages.settings.outputs.title'), parent: 'settings', group: 'installation'}
            },
            {
                route: 'settings/inputs', name: 'settings.inputs', moduleId: PLATFORM.moduleName('pages/settings/inputs', 'pages.settings'), nav: true, auth: true, land: true, show: true,
                settings: {key: 'settings.inputs', title: this.i18n.tr('pages.settings.inputs.title'), parent: 'settings', group: 'installation'}
            },
            {
                route: 'settings/sensors', name: 'settings.sensors', moduleId: PLATFORM.moduleName('pages/settings/sensors', 'pages.settings'), nav: true, auth: true, land: true, show: true,
                settings: {key: 'settings.sensors', title: this.i18n.tr('pages.settings.sensors.title'), parent: 'settings', group: 'installation'}
            },
            {
                route: 'settings/thermostats', name: 'settings.thermostats', moduleId: PLATFORM.moduleName('pages/settings/thermostats', 'pages.settings'), nav: true, auth: true, land: true, show: true,
                settings: {key: 'settings.thermostats', title: this.i18n.tr('pages.settings.thermostats.title'), parent: 'settings', group: 'installation'}
            },
            {
                route: 'settings/groupactions', name: 'settings.groupactions', moduleId: PLATFORM.moduleName('pages/settings/groupactions', 'pages.settings'), nav: true, auth: true, land: true, show: true,
                settings: {key: 'settings.groupactions', title: this.i18n.tr('pages.settings.groupactoins.title'), parent: 'settings', group: 'installation'}
            },
            {
                route: 'settings/environment', name: 'settings.environment', moduleId: PLATFORM.moduleName('pages/settings/environment', 'pages.settings'), nav: true, auth: true, land: true, show: true,
                settings: {key: 'settings.environment', title: this.i18n.tr('pages.settings.environment.title'), parent: 'settings', group: 'installation'}
            },
            ...Toolbox.iif(this.shared.target !== 'cloud', [
                {
                    route: 'settings/cloud', name: 'settings.cloud', moduleId: PLATFORM.moduleName('pages/settings/cloud', 'pages.settings'), nav: true, auth: true, land: true, show: true,
                    settings: {key: 'settings.cloud', title: this.i18n.tr('pages.settings.cloud.title'), parent: 'settings', group: 'installation'}
                }
            ], [
                {
                    route: 'settings/users', name: 'settings.users', moduleId: PLATFORM.moduleName('pages/settings/users', 'pages.settings'), nav: true, auth: true, land: true, show: true,
                    settings: {key: 'settings.users', title: this.i18n.tr('pages.settings.users.title'), parent: 'settings', group: 'installation'}
                }
            ]),
            {
                route: 'settings/schedules', name: 'settings.schedules', moduleId: PLATFORM.moduleName('pages/settings/schedules', 'pages.settings'), nav: true, auth: true, land: true, show: false,
                settings: {key: 'settings.schedules', title: this.i18n.tr('pages.settings.schedules.title'), parent: 'settings', group: 'installation', needsFeature: 'scheduling'}
            },
            {
                route: 'settings/apps', name: 'settings.apps', moduleId: PLATFORM.moduleName('pages/settings/apps', 'pages.settings'), nav: true, auth: true, land: true, show: true,
                settings: {key: 'settings.apps', title: this.i18n.tr('pages.settings.apps.title'), parent: 'settings', group: 'installation'}
            },
            ...Toolbox.iif(this.shared.target !== 'cloud', [
                {
                    route: 'apps/:reference', name: 'apps.index', moduleId: PLATFORM.moduleName('pages/apps/index', 'pages.apps'), nav: false, auth: true, land: true, show: true,
                    settings: {key: 'apps.index', title: '', group: 'installation'}
                }
            ], [
                {
                    route: 'cloud/installations', name: 'cloud.installations', moduleId: PLATFORM.moduleName('pages/cloud/installations', 'pages.cloud'), nav: false, auth: true, land: true, show: true,
                    settings: {key: 'cloud.installations', title: this.i18n.tr('pages.cloud.installations.title'), group: 'installation'}
                },
                {
                    route: 'cloud/profile', name: 'cloud.profile', moduleId: PLATFORM.moduleName('pages/cloud/profile', 'pages.cloud'), nav: true, auth: true, land: false, show: true,
                    settings: {key: 'cloud.profile', title: this.i18n.tr('pages.cloud.profile.title'), group: 'profile'}
                },
                {
                    route: 'cloud/oauth', name: 'cloud.oauth', moduleId: PLATFORM.moduleName('pages/cloud/oauth', 'pages.cloud'), nav: true, auth: true, land: false, show: true,
                    settings: {key: 'cloud.oauth', title: this.i18n.tr('pages.cloud.oauth.title'), group: 'profile'}
                }
            ]),
            {
                route: 'logout', name: 'logout', moduleId: PLATFORM.moduleName('pages/logout', 'main'), nav: true, auth: false, land: false, show: true,
                settings: {key: 'logout', group: 'profile'}
            }
        ];
        let routesMap = routes.reduce((map, route) => {
            map[route.route] = route;
            return map;
        }, {});

        let defaultLanding = this.shared.target === 'cloud' && this.shared.installation === undefined ? 'cloud/installations' : Storage.getItem('last');
        if (routes.filter((route) => route.show === true && route.route === defaultLanding).length !== 1) {
            defaultLanding = 'dashboard';
        }
        let settingsLanding = Storage.getItem('last_settings');
        if (routes.filter((route) => route.show === true && route.route === settingsLanding).length !== 1) {
            settingsLanding = 'settings/initialisation';
        }
        routesMap[''].redirect = defaultLanding;
        routesMap['settings'].redirect = settingsLanding;
        let unknownRoutes = {redirect: defaultLanding};

        await this.setLocale(Storage.getItem('locale', 'en'));
        await this.router.configure(async (config) => {
            config.title = 'OpenMotics';
            config.addAuthorizeStep({
                run: (navigationInstruction, next) => {
                    if (navigationInstruction.config.auth) {
                        if (!this.authentication.isLoggedIn) {
                            return next.cancel(this.authentication.logout());
                        }
                    }
                    return next();
                }
            });
            config.addPostRenderStep({
                run: (navigationInstruction, next) => {
                    if (navigationInstruction.config.land) {
                        let path = navigationInstruction.fragment;
                        if (path.startsWith('/')) {
                            path = path.slice(1);
                        }
                        Storage.setItem('last', path);
                        let parent = navigationInstruction.config.settings.parent;
                        if (parent !== undefined) {
                            Storage.setItem(`last_${parent}`, path);
                        }
                    }
                    this.shared.navigationGroup = navigationInstruction.config.settings.group;
                    this.signaler.signal('navigate');
                    return next();
                }
            });
            config.map(routes);
            config.mapUnknownRoutes(unknownRoutes);

            if (this.shared.target !== 'cloud') {
                let data = await this.api.getApps();
                for (let appData of data.plugins) {
                    let app = this.appFactory(appData.name);
                    app.fillData(appData);
                    if (app.hasWebUI && this.apps.find((entry) => entry.reference === app.reference) === undefined) {
                        this.apps.push({
                            name: app.name,
                            reference: app.reference
                        });
                    }
                }
            }
        });

        await this.loadFeatures();
    }

    attached() {
        window.addEventListener('aurelia-composed', () => { $('body').layout('fix'); });
        window.addEventListener('resize', () => { $('body').layout('fix'); });
        $('.dropdown-toggle').dropdown();
        this.locale = this.i18n.getLocale();
        this.shared.locale = this.locale;
        this.connectionSubscription = this.ea.subscribe('om:connection', data => {
            let connection = data.connection;
            if (!connection) {
                this.router.navigate('cloud/installations');
            }
        });
        this.api.connection = undefined;
    }

    detached() {
        window.removeEventListener('aurelia-composed', () => { $('body').layout('fix'); });
        window.removeEventListener('resize', () => { $('body').layout('fix'); });
        if (this.connectionSubscription !== undefined) {
            this.connectionSubscription.dispose();
        }
    }
}
