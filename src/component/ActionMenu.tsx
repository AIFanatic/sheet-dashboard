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

import * as mqtt from 'paho-mqtt';

import AES from 'crypto-js/aes';
import SHA256 from 'crypto-js/sha256';
import random from 'crypto-js/lib-typedarrays'
import Utf8 from 'crypto-js/enc-utf8';

interface IProps {
    editMode: boolean;
    setEditMode: Function;
    saveData: Function;
    getData: Function;
}

export class ActionMenu extends React.Component<IProps> {
    private broker: string = "ws://broker.mqttdashboard.com:8000/mqtt";
    private clientId: string = "client-" + Math.random().toFixed(5);

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
        const key = this.createKey();
        const channel = key + "-channel";
        console.log(channel)

        const dataString = JSON.stringify(this.props.getData());

        const message = AES.encrypt(dataString, key);

        const mqttMessage = new mqtt.Message(message.toString());
        mqttMessage.destinationName = channel;
        mqttMessage.retained = true;

        const client = new mqtt.Client(this.broker, this.clientId);

        client.connect({
            onSuccess: (event) => {
                client.send(mqttMessage);

                const keyFormatted = key.substr(0,3) + '-' + key.substr(3, 3) + "-" + key.substr(6, 3);
                alert(`Uploaded workbook. The key is ${keyFormatted}`);

                client.disconnect();
            }
        });
    }

    handleDownloadClick() {
        const keyPrompt: string = prompt("Please enter the 9 character key:") as string;
        const key = keyPrompt.replaceAll("-", "");
        const channel = key + "-channel";

        const client = new mqtt.Client(this.broker, this.clientId);
        
        client.onMessageArrived = (message: mqtt.Message) => {
            try {
                const data = AES.decrypt(message.payloadString, key);
                const json = JSON.parse(data.toString(Utf8));

                // Delete retained message
                const mqttMessage = new mqtt.Message("");
                mqttMessage.destinationName = channel;
                mqttMessage.retained = true;
                client.send(mqttMessage);

                this.props.saveData(json, true);

            } catch (error) {
                alert("Invalid key provided, please try again.");
            }

            client.disconnect();
        };
    
        client.connect({
            onSuccess: (event) => {
                console.log("connected")
                client.subscribe(channel);

                setTimeout(() => {
                    alert("No data is available for download, try uploading again.");
                    client.disconnect();
                }, 5000);
            }
        });
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