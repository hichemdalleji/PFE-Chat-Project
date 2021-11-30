/* eslint-disable import/first */
if (
    (window.location.protocol === 'https:' || window.location.hostname === 'localhost')
    && navigator.serviceWorker
) {
    window.addEventListener('load', () => {
        const sw = process.env.NODE_ENV === 'development' ? '/static/fiora-sw.js' : '/fiora-sw.js';
        navigator.serviceWorker.register(sw);
    });
}

import 'babel-polyfill';

import React from 'react';
import ReactDom from 'react-dom';
import { Provider } from 'react-redux';
import platform from 'platform';

import fetch from 'utils/fetch';
import App from './App';
import store from './state/store';
import action from './state/action';
import socket from './socket';
import notification from '../utils/notification';
import sound from '../utils/sound';
import getFriendId from '../utils/getFriendId';
// import / convert server message;
import voice from '../utils/voice';

if (window.Notification && (window.Notification.permission === 'default' || window.Notification.permission === 'denied')) {
    window.Notification.requestPermission();
}

let windowStatus = 'focus';
window.onfocus = () => windowStatus = 'focus';
window.onblur = () => windowStatus = 'blur';


async function guest() {
    const [err, res] = await fetch('guest', {
        os: platform.os.family,
        browser: platform.name,
        environment: platform.description,
    });
    if (!err) {
        action.setGuest(res);
    }
}

socket.on('connect', async () => {
    const token = window.localStorage.getItem('token');
    if (token) {
        const [err, res] = await fetch('loginByToken', {
            token,
            os: platform.os.family,
            browser: platform.name,
            environment: platform.description,
        }, { toast: false });
        if (err) {
            guest();
        } else {
            action.setUser(res);
        }
    } else {
        guest();
    }
});
socket.on('disconnect', () => {
    action.disconnect();
});

let prevFrom = '';
socket.on('message', (message) => {
    // convertRobotMessage(message);

    const state = store.getState();
    const isSelfMessage = message.from._id === state.getIn(['user', '_id']);
    const linkman = state.getIn(['user', 'linkmans']).find(l => l.get('_id') === message.to);
    let title = '';
    if (linkman) {
        action.addLinkmanMessage(message.to, message);
        if (linkman.get('type') === 'group') {
            title = `${message.from.username} say hi to everyone ${linkman.get('name')}:`;
        } else {
            title = `${message.from.username} tell you:`;
        }
    } else {
        // The contact does not exist and is a self-issued message, no new contact is created
        if (isSelfMessage) {
            return;
        }
        const newLinkman = {
            _id: getFriendId(
                state.getIn(['user', '_id']),
                message.from._id,
            ),
            type: 'temporary',
            createTime: Date.now(),
            avatar: message.from.avatar,
            name: message.from.username,
            messages: [],
            unread: 1,
        };
        action.addLinkman(newLinkman);
        title = `${message.from.username} :`;

        fetch('getLinkmanHistoryMessages', { linkmanId: newLinkman._id }).then(([err, res]) => {
            if (!err) {
                action.addLinkmanMessages(newLinkman._id, res);
            }
        });
    }

    if (isSelfMessage) {
        return;
    }

    if (windowStatus === 'blur' && state.getIn(['ui', 'notificationSwitch'])) {
        notification(
            title,
            message.from.avatar,
            message.type === 'text' ? message.content.replace(/&lt;/g, '<').replace(/&gt;/g, '>') : `[${message.type}]`,
            Math.random(),
        );
    }

    if (state.getIn(['ui', 'soundSwitch'])) {
        const soundType = state.getIn(['ui', 'sound']);
        sound(soundType);
    }

    if (message.type === 'text' && state.getIn(['ui', 'voiceSwitch'])) {
        const text = message.content
            .replace(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g, '')
            .replace(/#/g, '');

        if (text.length > 100) {
            return;
        }

        const from = linkman && linkman.get('type') === 'group' ?
            `${message.from.username}IN${linkman.get('name')}say`
            :
            `${message.from.username}tell you`;
        if (text) {
            voice.push(from !== prevFrom ? from + text : text, message.from.username);
        }
        prevFrom = from;
    }
});

ReactDom.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('app'),
);
