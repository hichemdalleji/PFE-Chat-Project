import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { immutableRenderDecorator } from 'react-immutable-render-mixin';

import action from '@/state/action';
import IconButton from '@/components/IconButton';
import Dropdown from '@/components/Dropdown';
import { Menu, MenuItem } from '@/components/Menu';
import Dialog from '@/components/Dialog';
import Message from '@/components/Message';
// import Input from '@/components/Input';
// import Button from '@/components/Button';
// import Loading from '@/components/Loading';
import Avatar from '@/components/Avatar';

import getRandomHuaji from 'utils/getRandomHuaji';
import readDiskFile from 'utils/readDiskFile';
import fetch from 'utils/fetch';
import uploadFile from 'utils/uploadFile';

import Expression from './Expression';
import CodeEditor from './CodeEditor';
import config from '../../../../../config/client';

const xss = require('utils/xss');
// const Url = require('utils/url');

@immutableRenderDecorator
class ChatInput extends Component {
    static handleLogin() {
        action.showLoginDialog();
    }
    static insertAtCursor(input, value) {
        if (document.selection) {
            input.focus();
            const sel = document.selection.createRange();
            sel.text = value;
            sel.select();
        } else if (input.selectionStart || input.selectionStart === '0') {
            const startPos = input.selectionStart;
            const endPos = input.selectionEnd;
            const restoreTop = input.scrollTop;
            input.value = input.value.substring(0, startPos) + value + input.value.substring(endPos, input.value.length);
            if (restoreTop > 0) {
                input.scrollTop = restoreTop;
            }
            input.focus();
            input.selectionStart = startPos + value.length;
            input.selectionEnd = startPos + value.length;
        } else {
            input.value += value;
            input.focus();
        }
    }
    static compressImage(image, mimeType, quality = 1) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);
            canvas.toBlob(resolve, mimeType, quality);
        });
    }
    static propTypes = {
        isLogin: PropTypes.bool.isRequired,
        focus: PropTypes.string,
        connect: PropTypes.bool,
        members: ImmutablePropTypes.list,
        userId: PropTypes.string,
        userName: PropTypes.string,
        userAvatar: PropTypes.string,
    }
    constructor(...args) {
        super(...args);
        this.state = {
            expressionVisible: false,
            codeInputVisible: false,
            // expressionSearchVisible: false,
            // expressionSearchLoading: false,
            // expressionSearchResults: [],

            at: false, // Is it in @Input
            atContent: '', // @content
        };
        this.ime = false;
    }
    componentDidUpdate(prevProps) {
        if (this.props.focus !== prevProps.focus && this.message) {
            this.message.focus();
        }
    }
    getSuggestion = () => this.props.members.filter((member) => {
        const regex = new RegExp(`^${this.state.atContent}`);
        if (regex.test(member.getIn(['user', 'username']))) {
            return true;
        }
        return false;
    })
    handleVisibleChange = (visible) => {
        this.setState({
            expressionVisible: visible,
        });
    }
    handleFeatureMenuClick = ({ key }) => {
        switch (key) {
        case 'image': {
            this.handleSelectFile();
            break;
        }
        case 'huaji': {
            this.sendHuaji();
            break;
        }
        case 'code': {
            this.setState({
                codeInputVisible: true,
            });
            break;
        }
        // case 'expression': {
        //     this.setState({
        //         expressionSearchVisible: true,
        //     });
        //     break;
        // }
        default:
        }
    }
    handleCodeEditorClose = () => {
        this.setState({
            codeInputVisible: false,
        });
    }
    // closeExpressionSearch = () => {
    //     this.setState({
    //         expressionSearchVisible: false,
    //     });
    // }
    handleSendCode = () => {
        if (!this.props.connect) {
            return Message.error('Failed to send message, you are currently offline.');
        }

        const language = this.codeEditor.getLanguage();
        const rawCode = this.codeEditor.getValue();
        if (rawCode === '') {
            return Message.warning('Please enter the message');
        }

        const code = `@language=${language}@${rawCode}`;
        const id = this.addSelfMessage('code', code);
        this.sendMessage(id, 'code', code);
        this.codeEditor.clear();
        // Can't clear the content without delay
        setTimeout(() => {
            this.handleCodeEditorClose();
        }, 0);
    }
    handleInputKeyDown = async (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
        } else if (e.key === 'Enter' && !this.ime) {
            this.sendTextMessage();
        } else if (e.altKey && (e.key === 's' || e.key === 'ß')) {
            this.sendHuaji();
            e.preventDefault();
        } else if (e.altKey && (e.key === 'd' || e.key === '∂')) {
            // this.setState({
            //     expressionSearchVisible: true,
            // });
        } else if (e.key === '@') { // If you press @build, you enter @calculation mode
            if (!/@/.test(this.message.value)) {
                this.setState({
                    at: true,
                    atContent: '',
                });
                const { focus } = this.props;
                const [err, result] = await fetch('getGroupOnlineMembers', { groupId: focus });
                if (!err) {
                    action.setGroupMembers(focus, result);
                }
            }
        } else if (this.state.at) { // If in calculation mode
            const { key } = e;
            // Delay, in order to get the new value and time state
            setTimeout(() => {
                // If @ has been deleted, exit the calculation mod
                if (!/@/.test(this.message.value)) {
                    this.setState({
                        at: false,
                        atContent: '',
                    });
                    return;
                }
                // If you typein your language and are not spacebar, ignore the input
                if (this.ime && key !== ' ') {
                    return;
                }
                // If the your language is entered, and it is a space bar, the @calculation mode ends.
                if (!this.ime && key === ' ') {
                    this.at = false;
                    this.setState({ at: false });
                    return;
                }

                // If you are typing Chinese, return directly, avoiding letters
                if (this.ime) {
                    return;
                }
                const regexResult = /@([^ ]*)/.exec(this.message.value);
                if (regexResult) {
                    this.setState({ atContent: regexResult[1] });
                }
            }, 100);
        }
    }
    sendTextMessage = () => {
        if (!this.props.connect) {
            return Message.error('Failed to send message, you are currently offline');
        }

        const message = this.message.value.trim();
        if (message.length === 0) {
            return;
        }

        if (/^invite::/.test(message)) {
            const groupName = message.replace('invite::', '');
            const id = this.addSelfMessage('invite', JSON.stringify({
                inviter: this.props.userName,
                groupId: '',
                groupName,
            }));
            this.sendMessage(id, 'invite', groupName);
        } else {
            const id = this.addSelfMessage('text', xss(message));
            this.sendMessage(id, 'text', message);
        }
        this.message.value = '';
    }
    addSelfMessage = (type, content) => {
        const { userId, userName, userAvatar, focus } = this.props;
        const _id = focus + Date.now();
        const message = {
            _id,
            type,
            content,
            createTime: Date.now(),
            from: {
                _id: userId,
                username: userName,
                avatar: userAvatar,
            },
            loading: true,
        };

        if (type === 'image') {
            message.percent = 0;
        }
        action.addLinkmanMessage(focus, message);

        return _id;
    }
    sendMessage = async (localId, type, content, focus = this.props.focus) => {
        const [err, res] = await fetch('sendMessage', {
            to: focus,
            type,
            content,
        });
        if (err) {
            action.deleteSelfMessage(focus, localId);
        } else {
            res.loading = false;
            action.updateSelfMessage(focus, localId, res);
        }
    }
    handleSelectExpression = (expression) => {
        this.handleVisibleChange(false);
        ChatInput.insertAtCursor(this.message, `#(${expression})`);
    }
    sendImageMessage = (image) => {
        if (image.length > config.maxImageSize) {
            return Message.warning('The image size is too large', 3);
        }

        const ext = image.type.split('/').pop().toLowerCase();
        const url = URL.createObjectURL(image.result);

        const img = new Image();
        img.onload = async () => {
            const id = this.addSelfMessage('image', `${url}?width=${img.width}&height=${img.height}`);
            try {
                const { userId, focus } = this.props;
                const imageUrl = await uploadFile(
                    image.result,
                    `ImageMessage/${userId}_${Date.now()}.${ext}`,
                    `ImageMessage_${userId}_${Date.now()}.${ext}`,
                    (info) => {
                        action.updateSelfMessage(focus, id, { percent: info.total.percent });
                    },
                );
                this.sendMessage(id, 'image', `${imageUrl}?width=${img.width}&height=${img.height}`, focus);
            } catch (err) {
                console.error(err);
                Message.error('Failed to upload image');
            }
        };
        img.src = url;
    }
    handleSelectFile = async () => {
        if (!this.props.connect) {
            return Message.error('Failed to send message, you are currently offline');
        }
        const image = await readDiskFile('blob', 'image/png,image/jpeg,image/gif');
        if (!image) {
            return;
        }
        this.sendImageMessage(image);
    }
    sendHuaji = async () => {
        const huaji = getRandomHuaji();
        const id = this.addSelfMessage('image', huaji);
        this.sendMessage(id, 'image', huaji);
    }
    handlePaste = (e) => {
        if (!this.props.connect) {
            e.preventDefault();
            return Message.error('Failed to send message, you are currently offline');
        }
        const { items, types } = (e.clipboardData || e.originalEvent.clipboardData);

        // If the file content is included
        if (types.indexOf('Files') > -1) {
            for (let index = 0; index < items.length; index++) {
                const item = items[index];
                if (item.kind === 'file') {
                    const file = item.getAsFile();
                    if (file) {
                        const that = this;
                        const reader = new FileReader();
                        reader.onloadend = function () {
                            const image = new Image();
                            image.onload = async () => {
                                const imageBlob = await ChatInput.compressImage(image, file.type, 0.8);
                                that.sendImageMessage({
                                    filename: file.name,
                                    ext: imageBlob.type.split('/').pop(),
                                    length: imageBlob.size,
                                    type: imageBlob.type,
                                    result: imageBlob,
                                });
                            };
                            image.src = this.result;
                        };
                        reader.readAsDataURL(file);
                    }
                }
            }
            e.preventDefault();
        }
    }
    handleIMEStart = () => {
        this.ime = true;
    }
    handleIMEEnd = () => {
        this.ime = false;
    }
    // searchExpression = async (keywords) => {
    //     if (keywords) {
    //         this.setState({
    //             expressionSearchLoading: true,
    //         });
    //         const [err, result] = await fetch('searchExpression', { keywords });
    //         if (!err) {
    //             if (result.length !== 0) {
    //                 this.setState({
    //                     expressionSearchResults: result,
    //                 });
    //             } else {
    //                 Message.info('No relevant expressions, try another keyword.');
    //             }
    //         }
    //         this.setState({
    //             expressionSearchLoading: false,
    //         });
    //     }
    // }
    handleSearchExpressionButtonClick = () => {
        const keywords = this.expressionSearchKeyword.getValue();
        this.searchExpression(keywords);
    }
    handleSearchExpressionInputEnter = (keywords) => {
        this.searchExpression(keywords);
    }
    // handleClickExpression = (e) => {
    //     const $target = e.target;
    //     if ($target.tagName === 'IMG') {
    //         const url = Url.addParam($target.src, {
    //             width: $target.naturalWidth,
    //             height: $target.naturalHeight,
    //         });
    //         const id = this.addSelfMessage('image', url);
    //         this.sendMessage(id, 'image', url);
    //         this.setState({
    //             expressionSearchVisible: false,
    //         });
    //     }
    // }
    replaceAt = (username) => {
        this.message.value = this.message.value.replace(`@${this.state.atContent}`, `@${username} `);
        this.setState({
            at: false,
            atContent: '',
        });
        this.message.focus();
    }
    expressionDropdown = (
        <div className="expression-dropdown">
            <Expression onSelect={this.handleSelectExpression} />
        </div>
    )
    featureDropdown = (
        <div className="feature-dropdown">
            <Menu onClick={this.handleFeatureMenuClick}>
                {/* <MenuItem key="expression">Send emoji package</MenuItem> */}
                <MenuItem key="huaji">Send Funny GIF</MenuItem>
                <MenuItem key="image">Send Picture</MenuItem>
            </Menu>
        </div>
    )
    render() {
        const { expressionVisible, codeInputVisible, /* expressionSearchVisible, expressionSearchResults, expressionSearchLoading, */ at } = this.state;
        const { isLogin } = this.props;

        if (isLogin) {
            return (
                <div className="chat-chatInput">
                    <Dropdown
                        trigger={['click']}
                        visible={expressionVisible}
                        onVisibleChange={this.handleVisibleChange}
                        overlay={this.expressionDropdown}
                        animation="slide-up"
                        placement="topLeft"
                    >
                        <IconButton className="expression" width={44} height={44} icon="expression" iconSize={32} />
                    </Dropdown>
                    <Dropdown
                        trigger={['click']}
                        overlay={this.featureDropdown}
                        animation="slide-up"
                        placement="topLeft"
                    >
                        <IconButton className="feature" width={44} height={44} icon="feature" iconSize={32} />
                    </Dropdown>
                    <form autoComplete="off" action="javascript:void(0);">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            maxLength="2048"
                            autofoucus="true"
                            ref={i => this.message = i}
                            onKeyDown={this.handleInputKeyDown}
                            onPaste={this.handlePaste}
                            onCompositionStart={this.handleIMEStart}
                            onCompositionEnd={this.handleIMEEnd}
                        />
                    </form>

                    <IconButton className="send" width={44} height={44} icon="send" iconSize={32} onClick={this.sendTextMessage} />
                    <Dialog
                        className="codeEditor-dialog"
                        title="Please enter the code to send"
                        visible={codeInputVisible}
                        onClose={this.handleCodeEditorClose}
                    >
                        <div className="container">
                            <CodeEditor ref={i => this.codeEditor = i} />
                            <button className="codeEditor-button" onClick={this.handleSendCode}>Send</button>
                        </div>
                    </Dialog>
                    {/* <Dialog
                        className="expressionSearch-dialog"
                        title="Select Emojis"
                        visible={expressionSearchVisible}
                        onClose={this.closeExpressionSearch}
                    >
                        <div className="container">
                            <div className="input-container">
                                <Input ref={i => this.expressionSearchKeyword = i} onEnter={this.handleSearchExpressionInputEnter} />
                                <Button onClick={this.handleSearchExpressionButtonClick}>Search</Button>
                            </div>
                            <div className={`loading ${expressionSearchLoading ? 'show' : 'hide'}`}>
                                <Loading type="spinningBubbles" color="#4A90E2" height={100} width={100} />
                            </div>
                            <div className="expression-list" onClick={this.handleClickExpression}>
                                {
                                    expressionSearchResults.map((image, i) => (
                                        <img src={image} key={i + image} referrerPolicy="no-referrer" />
                                    ))
                                }
                            </div>
                        </div>
                    </Dialog> */}
                    <div className="aite-panel">
                        {
                            at ?
                                this.getSuggestion().map((member) => {
                                    const username = member.getIn(['user', 'username']);
                                    return (
                                        <div key={member.getIn(['user', '_id'])} onClick={this.replaceAt.bind(this, username)}>
                                            <Avatar size={24} src={member.getIn(['user', 'avatar'])} />
                                            <p>{username}</p>
                                        </div>
                                    );
                                })
                                :
                                null
                        }
                    </div>
                </div>
            );
        }
        return (
            <div className="chat-chatInput guest">
                <p>Hello Friends, <b onClick={ChatInput.handleLogin}>Login</b> Now and Start Chatting!</p>
            </div>
        );
    }
}

export default connect(state => ({
    isLogin: !!state.getIn(['user', '_id']),
    connect: state.get('connect'),
    focus: state.get('focus'),
    userId: state.getIn(['user', '_id']),
    userName: state.getIn(['user', 'username']),
    userAvatar: state.getIn(['user', 'avatar']),
}))(ChatInput);

