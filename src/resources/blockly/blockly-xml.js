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
export class BlocklyXML {
    static generateStartXML(actions) {
        // TODO: Add shadow blocks
        return new Promise((resolve) => {
            let parsedActions = [];
            if (actions !== undefined && actions !== '') {
                parsedActions = actions.split(',');
            }
            for (let i = 0; i < parsedActions.length; i++) {
                parsedActions[i] = parseInt(parsedActions[i]);
            }
            let parser = new DOMParser();
            let xml = parser.parseFromString('<xml></xml>', 'text/xml');
            let root = xml.childNodes[0];
            let block = xml.createElement('block');
            root.appendChild(block);
            block.setAttribute('type', 'om_start');
            block.setAttribute('deletable', 'false');
            block.setAttribute('movable', 'false');
            block.setAttribute('x', '10');
            block.setAttribute('y', '20');
            let next = xml.createElement('next');
            block.appendChild(next);
            BlocklyXML.generateXMLChunck(xml, next, parsedActions);
            let serializer = new XMLSerializer();
            let startXML = serializer.serializeToString(xml);
            console.debug(startXML);
            resolve(startXML);
        });
    }

    static generateXMLChunck(xml, parent, actions) {
        console.debug('Processing ' + JSON.stringify(actions));
        let i = 0;
        let next = parent;
        while (true) {
            if (i >= actions.length)
                break;
            let action = actions[i];
            let number = actions[i + 1];
            let block = xml.createElement('block');
            next.appendChild(block);
            if (action === 2) {
                // om_exec_groupaction - Execute Group Action
                console.debug('Found 2: om_exec_groupaction');
                block.setAttribute('type', 'om_exec_groupaction');
                let value = xml.createElement('value');
                block.appendChild(value);
                value.setAttribute('name', 'GROUPACTION');
                let innerBlock = xml.createElement('block');
                value.appendChild(innerBlock);
                innerBlock.setAttribute('type', 'om_groupaction');
                let field = xml.createElement('field');
                innerBlock.appendChild(field);
                field.setAttribute('name', 'VALUE');
                field.textContent = number;
            } else if (action === 60) {
                // om_send_event - Send event
                console.debug('Found 60: om_send_event');
                block.setAttribute('type', 'om_send_event');
                let field = xml.createElement('field');
                block.appendChild(field);
                field.setAttribute('name', 'NUMBER');
                field.textContent = number;
            } else if (action === 161 || (action === 160 && (actions.length <= i + 2 || actions[i + 2] !== 169))) {
                // om_output_onoff - Turn an Output on/off
                console.debug('Found 160|161: om_output_onoff');
                block.setAttribute('type', 'om_output_onoff');
                let field = xml.createElement('field');
                block.appendChild(field);
                field.setAttribute('name', 'VALUE');
                field.textContent = action === 160 ? '0' : '1';
                let value = xml.createElement('value');
                block.appendChild(value);
                value.setAttribute('name', 'OUTPUT');
                let innerBlock = xml.createElement('block');
                value.appendChild(innerBlock);
                innerBlock.setAttribute('type', 'om_output');
                field = xml.createElement('field');
                innerBlock.appendChild(field);
                field.setAttribute('name', 'VALUE');
                field.textContent = number;
            } else if (action === 162) {
                // om_toggle - Toggles output
                console.debug('Found 162: om_toggle');
                block.setAttribute('type', 'om_toggle');
                let value = xml.createElement('value');
                block.appendChild(value);
                value.setAttribute('name', 'OUTPUT');
                let innerBlock = xml.createElement('block');
                value.appendChild(innerBlock);
                innerBlock.setAttribute('type', 'om_output');
                let field = xml.createElement('field');
                innerBlock.appendChild(field);
                field.setAttribute('name', 'VALUE');
                field.textContent = number;
            } else if (action === 174) {
                // om_toggle_follow - Let a group of toggles follow the first
                console.debug('Found 174: om_follow_toggle');
                block.setAttribute('type', 'om_toggle_follow');
                let statement = xml.createElement('statement');
                block.appendChild(statement);
                statement.setAttribute('name', 'TOGGLES');
                let toggles = [];
                i += 2;
                while (actions[i] !== 175) {
                    toggles.push(actions[i]);
                    toggles.push(actions[i + 1]);
                    i += 2;
                }
                console.debug('+ Toggles');
                BlocklyXML.generateXMLChunck(xml, statement, toggles);
                console.debug('+ End follow toggle')
            } else if ((action >= 176 && action <= 184) || (action >= 195 && action <= 206) || action === 165 || action === 166) {
                // om_output_on_with - Output ON with dimmer at X
                console.debug('Found 165|166|176-184|195-206: om_output_on_with');
                block.setAttribute('type', 'om_output_on_with');
                let value = xml.createElement('value');
                block.appendChild(value);
                value.setAttribute('name', 'OUTPUT');
                let innerBlock = xml.createElement('block');
                value.appendChild(innerBlock);
                innerBlock.setAttribute('type', 'om_output');
                let field = xml.createElement('field');
                innerBlock.appendChild(field);
                field.setAttribute('name', 'VALUE');
                field.textContent = number;
                value = xml.createElement('value');
                block.appendChild(value);
                value.setAttribute('name', 'VALUE');
                innerBlock = xml.createElement('block');
                value.appendChild(innerBlock);
                if (action >= 195 && action <= 206) {
                    innerBlock.setAttribute('type', 'om_timer_value');
                    field = xml.createElement('field');
                    innerBlock.appendChild(field);
                    field.setAttribute('name', 'VALUE');
                    field.textContent = action >= 201 ? action - 201 : action - 195;
                    field = xml.createElement('field');
                    innerBlock.appendChild(field);
                    field.setAttribute('name', 'RESET');
                    field.textContent = action >= 201 ? '0' : '1';
                } else {
                    innerBlock.setAttribute('type', 'om_dimmer_value');
                    field = xml.createElement('field');
                    innerBlock.appendChild(field);
                    field.setAttribute('name', 'VALUE');
                    if (action === 165) {
                        field.textContent = '0';
                    } else if (action === 166) {
                        field.textContent = '10';
                    } else {
                        field.textContent = action - 176 + 1;
                    }
                }
            } else if ((action >= 185 && action <= 194) || action === 160) {
                // om_toggle_with - Toggle output with dimmer at X
                console.debug('Found 185-194|160+169: om_toggle_with');
                block.setAttribute('type', 'om_toggle_with');
                let value = xml.createElement('value');
                block.appendChild(value);
                value.setAttribute('name', 'OUTPUT');
                let innerBlock = xml.createElement('block');
                value.appendChild(innerBlock);
                innerBlock.setAttribute('type', 'om_output');
                let field = xml.createElement('field');
                innerBlock.appendChild(field);
                field.setAttribute('name', 'VALUE');
                field.textContent = number;
                value = xml.createElement('value');
                block.appendChild(value);
                value.setAttribute('name', 'VALUE');
                innerBlock = xml.createElement('block');
                value.appendChild(innerBlock);
                innerBlock.setAttribute('type', 'om_dimmer_value');
                field = xml.createElement('field');
                innerBlock.appendChild(field);
                field.setAttribute('name', 'VALUE');
                field.textContent = action === 160 ? '0' : action - 184;
                if (action === 160) {
                    i += 2;
                }
            } else if ([207, 208, 209, 210, 211, 236].contains(action)) {
                // om_delayed_set - Delaying actions
                console.debug('Found 207|208|209|210|211|236: om_delayed_set');
                block.setAttribute('type', 'om_delayed_set');
                let delayed = {
                    2: undefined,
                    3: undefined,
                    4: undefined,
                    5: undefined,
                    6: undefined
                };
                let j = i;
                while (true) {
                    if (j >= actions.length) {
                        break;
                    }
                    if ([207, 208, 209, 210, 211].contains(actions[j])) {
                        delayed[actions[j] - 205] = actions[j + 1];
                        actions.splice(j, 2);
                    } else if (actions[j] === 236) {
                        let start = j;
                        let length = 0;
                        let statement = xml.createElement('statement');
                        block.appendChild(statement);
                        statement.setAttribute('name', 'ACTIONS');
                        let releaseActions = [];
                        j += 2;
                        while (actions[j] !== 236 || actions[j + 1] !== 255) {
                            releaseActions.push(actions[j]);
                            releaseActions.push(actions[j + 1]);
                            j += 2;
                            length += 2;
                        }
                        length += 2;
                        console.debug('+ Release actions');
                        BlocklyXML.generateXMLChunck(xml, statement, releaseActions);
                        actions.splice(start, length);
                    } else {
                        j += 2;
                    }
                }
                console.debug('+ Delayed actions: ' + JSON.stringify(delayed));
                for (let delay of [2, 3, 4, 5, 6]) {
                    let value = xml.createElement('value');
                    block.appendChild(value);
                    value.setAttribute('name', 'GROUPACTION_' + delay);
                    if (delayed[delay] !== undefined) {
                        let innerBlock = xml.createElement('block');
                        value.appendChild(innerBlock);
                        innerBlock.setAttribute('type', 'om_groupaction');
                        let field = xml.createElement('field');
                        innerBlock.appendChild(field);
                        field.setAttribute('name', 'VALUE');
                        field.textContent = delayed[delay];
                    }
                }
                console.debug('+ End delayed');
            } else if ([237, 238, 239].contains(action)) {
                // om_set_bit - Sets/clears/toggles bit
                console.debug('Found 237|238|239: om_set_bit');
                block.setAttribute('type', 'om_set_bit');
                let field = xml.createElement('field');
                block.appendChild(field);
                field.setAttribute('name', 'ACTION');
                field.textContent = parseInt(action) - 237;
                field = xml.createElement('field');
                block.appendChild(field);
                field.setAttribute('name', 'BIT');
                field.textContent = number;
            } else if (action === 240 && number === 0) {
                // om_if - If structure
                console.debug('Found 240.0: om_if');
                block.setAttribute('type', 'om_if');
                let value = xml.createElement('value');
                block.appendChild(value);
                value.setAttribute('name', 'CHECK');
                let checkActions = [];
                i += 2;
                while (actions[i] !== 240 || actions[i + 1] !== 10) {
                    checkActions.push(actions[i]);
                    checkActions.push(actions[i + 1]);
                    i += 2;
                }
                console.debug('+ Check');
                BlocklyXML.generateXMLChunck(xml, value, checkActions);
                let statement = xml.createElement('statement');
                block.appendChild(statement);
                statement.setAttribute('name', 'THEN');
                let thenActions = [];
                i += 2;
                while (actions[i] !== 240 || (actions[i + 1] !== 20 && actions[i + 1] !== 255)) {
                    thenActions.push(actions[i]);
                    thenActions.push(actions[i + 1]);
                    i += 2;
                }
                console.debug('+ Then');
                BlocklyXML.generateXMLChunck(xml, statement, thenActions);
                if (actions[i + 1] === 20) {
                    statement = xml.createElement('statement');
                    block.appendChild(statement);
                    statement.setAttribute('name', 'ELSE');
                    let elseActions = [];
                    i += 2;
                    while (actions[i] !== 240 || actions[i + 1] !== 255) {
                        elseActions.push(actions[i]);
                        elseActions.push(actions[i + 1]);
                        i += 2;
                    }
                    console.debug('+ Else');
                    BlocklyXML.generateXMLChunck(xml, statement, elseActions);
                }
                console.debug('+ End if')
            } else if (action === 240 && number >= 1 && number <= 6) {
                // om_where_operator - AND/OR/...
                console.debug('Found 240.1-6: om_where_operator');
                block.setAttribute('type', 'om_where_operator');
                let field = xml.createElement('field');
                block.appendChild(field);
                field.setAttribute('name', 'VALUE');
                field.textContent = number;
                let value = xml.createElement('value');
                block.appendChild(value);
                value.setAttribute('name', 'NEXT');
                let nextActions = [];
                i += 2;
                while (i < actions.length) {
                    nextActions.push(actions[i]);
                    i++;
                }
                console.debug('+ continue');
                BlocklyXML.generateXMLChunck(xml, value, nextActions);
            } else if (action >= 241 && action <= 244) {
                // om_check_io_on - Check if input/output is on/off
                console.debug('Found 241|242|243|244: om_check_io_on');
                block.setAttribute('type', 'om_check_io_on');
                let field = xml.createElement('field');
                block.appendChild(field);
                field.setAttribute('name', 'VALUE');
                field.textContent = (action === 241 || action === 243) ? '1' : '0';
                let value = xml.createElement('value');
                block.appendChild(value);
                value.setAttribute('name', 'TARGET');
                let innerBlock = xml.createElement('block');
                value.appendChild(innerBlock);
                innerBlock.setAttribute('type', (action === 241 || action === 242) ? 'om_input' : 'om_output');
                field = xml.createElement('field');
                innerBlock.appendChild(field);
                field.setAttribute('name', 'VALUE');
                field.textContent = number;
                value = xml.createElement('value');
                block.appendChild(value);
                value.setAttribute('name', 'NEXT');
                let nextActions = [];
                i += 2;
                while (i < actions.length) {
                    nextActions.push(actions[i]);
                    i++;
                }
                console.debug('+ continue');
                BlocklyXML.generateXMLChunck(xml, value, nextActions);
            } else if ([245, 246].contains(action)) {
                // om_check_validationbit - Check if bit is set/cleared
                console.debug('Found 245|246: om_check_validationbit');
                block.setAttribute('type', 'om_check_validationbit');
                let field = xml.createElement('field');
                block.appendChild(field);
                field.setAttribute('name', 'BIT');
                field.textContent = number;
                field = xml.createElement('field');
                block.appendChild(field);
                field.setAttribute('name', 'VALUE');
                field.textContent = action === 245 ? '1' : '0';
                let value = xml.createElement('value');
                block.appendChild(value);
                value.setAttribute('name', 'NEXT');
                let nextActions = [];
                i += 2;
                while (i < actions.length) {
                    nextActions.push(actions[i]);
                    i++;
                }
                console.debug('+ continue');
                BlocklyXML.generateXMLChunck(xml, value, nextActions);
            } else if (action === 247 && number <= 95) {
                // om_check_sensor
                console.debug('Found 247.0-95: om_check_sensor');
                block.setAttribute('type', 'om_check_sensor');
                let value = xml.createElement('value');
                block.appendChild(value);
                value.setAttribute('name', 'SENSOR');
                let innerBlock = xml.createElement('block');
                value.appendChild(innerBlock);
                let type = 'temperature';
                let sensorValue = actions[i + 3] / 2 - 32;
                let offset = 0;
                if (number >= 32) {
                    type = 'humidity';
                    sensorValue = actions[i + 3] / 2;
                    offset = 32;
                }
                if (number >= 64) {
                    type = 'brightness';
                    sensorValue = actions[i + 3];
                    offset = 64;
                }
                innerBlock.setAttribute('type', 'om_sensor_' + type);
                let field = xml.createElement('field');
                innerBlock.appendChild(field);
                field.setAttribute('name', 'VALUE');
                field.textContent = number - offset;
                field = xml.createElement('field');
                block.appendChild(field);
                field.setAttribute('name', 'CHECK');
                field.textContent = actions[i + 2] - 248;
                field = xml.createElement('field');
                block.appendChild(field);
                field.setAttribute('name', 'VALUE');
                field.textContent = sensorValue;
                i += 2;
                let nextActions = [];
                i += 2;
                while (i < actions.length) {
                    nextActions.push(actions[i]);
                    i++;
                }
                console.debug('+ continue');
                BlocklyXML.generateXMLChunck(xml, value, nextActions);
            } else {
                // om_raw - Contains 'unknown' actions
                console.debug('Unsupported action: om_raw');
                block.setAttribute('type', 'om_raw');
                let field = xml.createElement('field');
                block.appendChild(field);
                field.setAttribute('name', 'ACTION');
                field.textContent = action;
                field = xml.createElement('field');
                block.appendChild(field);
                field.setAttribute('name', 'NUMBER');
                field.textContent = number;
            }
            next = xml.createElement('next');
            block.appendChild(next);
            i += 2;
        }
    }
}
