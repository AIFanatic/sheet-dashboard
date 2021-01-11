import React from 'react';
import {
    Menu,
    MenuItem,
    MenuButton,
    MenuDivider
} from '@szhsin/react-menu';
import '@szhsin/react-menu/dist/index.css';

import '../styles/actionmenu.css';

import { FiSettings } from 'react-icons/fi';

// import * as mqtt from 'paho-mqtt';

import AES from 'crypto-js/aes';
import SHA256 from 'crypto-js/sha256';
import random from 'crypto-js/lib-typedarrays'
import Utf8 from 'crypto-js/enc-utf8';

import * as mqtt from 'mqtt'

interface IProps {
    editMode: boolean;
    setEditMode: Function;
    saveData: Function;
    getData: Function;
}

export class ActionMenu extends React.Component<IProps> {
    private broker: string = "wss://test.mosquitto.org:8081";

    constructor(props: IProps) {
        super(props);
    }

    private createKey() {
        const seed = random.random(16);
        const sha256 = SHA256(seed).toString();
        const key = sha256.slice(0, 9)
        return key;
    }

    handleHeaderClick() {
        if (this.props.editMode) {
            this.props.setEditMode(false);
        }
        else {
            this.props.setEditMode(true);
        }
    }

    handleUploadClick() {
        const client  = mqtt.connect(this.broker)

        client.on('connect', () => {
            const key = this.createKey();
            const channel = key + "-channel";

            const dataString = JSON.stringify(this.props.getData());

            const message = AES.encrypt(dataString, key);

            client.publish(channel, message.toString(), {retain: true});

            client.end();

            const keyFormatted = key.substr(0,3) + '-' + key.substr(3, 3) + "-" + key.substr(6, 3);
            alert(`Uploaded workbook. The key is ${keyFormatted}`);
        });
    }

    handleDownloadClick() {
        const keyPrompt: string = prompt("Please enter the 9 character key:") as string;
        const key = keyPrompt.replaceAll("-", "");
        const channel = key + "-channel";

        const client  = mqtt.connect(this.broker)

        client.on('connect', () => {
            client.subscribe(channel, function (err) {
                if (err) {
                    alert("Unable to connect to MQTT channel");
                    console.error(err);
                    return;
                }
            })
        })

        client.on('message', (topic, message) => {
            console.log(message.toString())

            try {
                const data = AES.decrypt(message.toString(), key);
                const json = JSON.parse(data.toString(Utf8));

                // Delete retained message
                client.publish(channel, "", {retain: true});

                this.props.saveData(json, true);

            } catch (error) {
                alert("Invalid key provided, please try again.");
            }

            client.end();
        })
    }

    handlRefreshClick() {
        eval('luckysheet.refreshFormula()');
    }

    handleDeleteClick() {
        localStorage.clear();
        this.props.saveData(null, true);
    }
    
    render() {
        const headerTitle = this.props.editMode ? "Live Mode" : "Edit Mode";
        return (
            <Menu menuButton={<MenuButton><FiSettings /></MenuButton>}>
                <MenuItem onClick={() => {this.handleHeaderClick()}}>{headerTitle}</MenuItem>
                <MenuDivider />
                <MenuItem onClick={() => {this.handleUploadClick()}}>Upload</MenuItem>
                <MenuItem onClick={() => {this.handleDownloadClick()}}>Download</MenuItem>
                <MenuItem onClick={() => {this.handlRefreshClick()}}>Refresh</MenuItem>
                <MenuDivider />
                <MenuItem styles={{color: "red"}} onClick={() => {this.handleDeleteClick()}}>Delete data</MenuItem>
            </Menu>
        )
    }
}