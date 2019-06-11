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
import {computedFrom} from 'aurelia-framework';
import {Led} from '../containers/led';
import {BaseObject} from './baseobject';
import {Logger} from '../components/logger';
import Shared from '../components/shared';

export class Output extends BaseObject {
    constructor(...rest /*, id */) {
        let id = rest.pop();
        super(...rest);
        this.id = id;
        this.processing = false;
        this.key = 'id';
        this.floor = undefined;
        this.moduleType = undefined;
        this.name = '';
        this.type = undefined;
        this.timer = undefined;
        this.dimmer = undefined;
        this.status = undefined;
        this.led1 = undefined;
        this.led2 = undefined;
        this.led3 = undefined;
        this.led4 = undefined;
        this.room = undefined;

        this.mapping = {
            id: 'id',
            floor: 'floor',
            moduleType: 'module_type',
            name: 'name',
            type: 'type',
            timer: [['timer'], timer => {
                return timer === 65535 && Shared.features.contains('default_timer_disabled') ? 0 : timer;
            }],
            dimmer: 'dimmer',
            status: 'status',
            room: 'room',
            led1: [['can_led_1_function', 'can_led_1_id'], (enumerator, id) => {
                return new Led(id, enumerator, 'input');
            }],
            led2: [['can_led_2_function', 'can_led_2_id'], (enumerator, id) => {
                return new Led(id, enumerator, 'input');
            }],
            led3: [['can_led_3_function', 'can_led_3_id'], (enumerator, id) => {
                return new Led(id, enumerator, 'input');
            }],
            led4: [['can_led_4_function', 'can_led_4_id'], (enumerator, id) => {
                return new Led(id, enumerator, 'input');
            }]
        };
    }

    @computedFrom('type')
    get isLight() {
        return this.type === 255;
    }

    @computedFrom('type')
    set isLight(value) {
        this.type = value ? 255 : 0;
    }

    @computedFrom('moduleType')
    get isVirtual() {
        return this.moduleType !== undefined && this.moduleType === this.moduleType.toLowerCase();
    }

    @computedFrom('moduleType')
    get isDimmer() {
        return this.moduleType !== undefined && this.moduleType.toUpperCase() === 'D';
    }

    @computedFrom('name')
    get inUse() {
        return this.name !== '' && this.name !== 'NOT_IN_USE';
    }

    @computedFrom('status')
    get isOn() {
        return ![0, undefined, null].contains(this.status);
    }

    @computedFrom('status')
    set isOn(value) {
        this.status = value ? 1 : 0;
    }

    @computedFrom('id', 'inUse', 'name')
    get identifier() {
        if (this.id === undefined) {
            return '';
        }
        return this.inUse ? this.name : this.id.toString();
    }

    async save() {
        try {
            await this.api.setOutputConfiguration(
                this.id,
                this.floor,
                this.name,
                this.timer,
                this.type,
                this.moduleType,
                this.room,
                [
                    [this.led1.id, this.led1.enumerator],
                    [this.led2.id, this.led2.enumerator],
                    [this.led3.id, this.led3.enumerator],
                    [this.led4.id, this.led4.enumerator],
                ]
            );
        } catch (error) {
            Logger.error(`Could not save Output configuration ${this.name}: ${error.message}`)
        }
        this._skip = true;
        this._freeze = false;
    }

    async set() {
        let dimmer, timer;
        if (this.isOn === true) {
            dimmer = this.dimmer;
            timer = this.timer;
            if (![150, 450, 900, 1500, 2220, 3120].contains(timer)) {
                timer = undefined;
            }
        }
        this._skip = true;
        try {
            await this.api.setOutput(this.id, this.isOn, dimmer, timer);
        } catch (error) {
            Logger.error(`Could not set Output ${this.name}: ${error.message}`);
        }
        this._freeze = false;
        this.processing = false;
    }

    async toggle(on) {
        this._freeze = true;
        this.processing = true;
        if (on === undefined) {
            this.isOn = !this.isOn;
        } else {
            this.isOn = !!on;
        }
        return this.set();
    }

    async onToggle(event) {
        return this.toggle(event.detail.value);
    }

    async dim(value) {
        this._freeze = true;
        this.processing = true;
        if (this.isDimmer) {
            if (value > 0) {
                this.isOn = true;
                this.dimmer = value;
            } else {
                this.isOn = false;
                this.dimmer = 0;
            }
            return this.set();
        }
        this._freeze = false;
        this.processing = false;
        throw new Error('A non-dimmer output can not be dimmed');
    }

    async onDim(event) {
        return this.dim(event.detail.value);
    }

    async indicate() {
        return this.api.flashLeds(0, this.id);
    }
}
