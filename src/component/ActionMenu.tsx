import React from 'react';
import {
    Menu,
    MenuItem,
    MenuButton,
    MenuDivider
} from '@szhsin/react-menu';
import '@szhsin/react-menu/dist/index.css';

import '../styles/actionmenu.css';

import { FiSettings, FiCopy } from 'react-icons/fi';

import AES from 'crypto-js/aes';
import SHA256 from 'crypto-js/sha256';
import random from 'crypto-js/lib-typedarrays'
import Utf8 from 'crypto-js/enc-utf8';

import Peer from 'peerjs';

import { toast } from 'react-toastify';

import '../styles/alert.css';

import copy from 'copy-to-clipboard';

interface IProps {
    editMode: boolean;
    setEditMode: Function;
    saveData: Function;
    getData: Function;
}

function uploadAlertTemplate(key: string) {
    const keyFormatted = key.substr(0,3) + '-' + key.substr(3, 3) + "-" + key.substr(6, 3);

    return (
        <div className="alert">
            <span className="title"> <span className="title-icon">🛈</span> Ready to upload workbook.</span>
            <p className="text">Download using the following key</p>
            <p className="button-box">
                <button onClick={() => {
                    copy(keyFormatted);
                    toast("Copied to clipboard!", {
                        autoClose: 2000,
                        type: "success"
                    });
                }}>
                        {keyFormatted}
                        <FiCopy className="button-icon"/>
                </button>
            </p>
        </div>
    )
}

export class ActionMenu extends React.Component<IProps> {
    constructor(props: IProps) {
        super(props);
    }

    createKey() {
        const seed = random.random(16);
        const sha256 = SHA256(seed).toString();
        const key = sha256.slice(0, 9)
        return key;
    }

    createChannelFromKey(key: string): string {
        const sha256 = SHA256(key).toString();
        const channel = sha256.slice(0, 9)
        return channel;
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
        const channel = this.createChannelFromKey(key);

        var peer = new Peer("sheet-dashboard-sender-" + channel);

        peer.on('open', (id) => {
            peer.on('connection', (conn) => {
                conn.on('open', () => {
                    const dataString = JSON.stringify(this.props.getData());
                    const message = AES.encrypt(dataString, key);

                    conn.send(message.toString());
                });
            });

            const keyFormatted = key.substr(0,3) + '-' + key.substr(3, 3) + "-" + key.substr(6, 3);
            // toast(`Uploaded workbook. <p>The key is ${keyFormatted}</p>`);
            toast(uploadAlertTemplate(key));
        });
    }

    handleDownloadClick() {
        const keyPrompt: string = prompt("Please enter the 9 character key:") as string;
        const key = keyPrompt.replaceAll("-", "");
        const channel = this.createChannelFromKey(key);

        var peer = new Peer("sheet-dashboard-receiver-" + channel);

        peer.on('open', (id) => {
            var conn = peer.connect("sheet-dashboard-sender-" + channel);

            conn.on('open', () => {
                // Receive messages
                conn.on('data', (data) => {
                    const dataDecrypted = AES.decrypt(data.toString(), key);
                    const json = JSON.parse(dataDecrypted.toString(Utf8));

                    this.props.saveData(json, true);
                });
            });
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
            <div>
                <Menu menuButton={<MenuButton><FiSettings /></MenuButton>}>
                    <MenuItem onClick={() => {this.handleHeaderClick()}}>{headerTitle}</MenuItem>
                    <MenuDivider />
                    <MenuItem onClick={() => {this.handleUploadClick()}}>Upload</MenuItem>
                    <MenuItem onClick={() => {this.handleDownloadClick()}}>Download</MenuItem>
                    <MenuItem onClick={() => {this.handlRefreshClick()}}>Refresh</MenuItem>
                    <MenuDivider />
                    <MenuItem styles={{color: "red"}} onClick={() => {this.handleDeleteClick()}}>Delete data</MenuItem>
                </Menu>
            </div>
        )
    }
}