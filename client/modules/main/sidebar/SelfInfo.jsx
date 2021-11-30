import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';

import Input from '@/components/Input';
import Dialog from '@/components/Dialog';
import Button from '@/components/Button';
import Message from '@/components/Message';
import action from '@/state/action';
import socket from '@/socket';

import fetch from 'utils/fetch';
import readDiskFile from 'utils/readDiskFile';
import uploadFile from 'utils/uploadFile';
import config from '../../../../config/client';


class SelfInfo extends Component {
    /**
     * Let the user log in again
     * @param {string} Prompt message
     */
    static reLogin(message) {
        action.logout();
        window.localStorage.removeItem('token');
        Message.success(message);
        socket.disconnect();
        socket.connect();
    }
    static propTypes = {
        visible: PropTypes.bool.isRequired,
        onClose: PropTypes.func.isRequired,
        userId: PropTypes.string,
        avatar: PropTypes.string,
        primaryColor: PropTypes.string.isRequired,
    }
    state = {
        loading: false,
        cropper: false,
        cropperSrc: '',
        cropperExt: 'png',
    }
    toggleAvatarLoading = () => {
        this.setState({
            loading: !this.state.loading,
        });
    }
    /**
     * Modify avatar
     */
    selectAvatar = async () => {
        const file = await readDiskFile('blob', 'image/png,image/jpeg,image/gif');
        if (!file) {
            return;
        }
        if (file.length > config.maxAvatarSize) {
            return Message.error('failed to set avatar, Please select an image smaller than 1MB');
        }

        // Avatar does not need to be cropped
        if (file.ext === 'gif') {
            this.uploadAvatar(file.result, file.ext);
        } else {
            // Display avatar cropping
            const reader = new FileReader();
            reader.readAsDataURL(file.result);
            reader.onloadend = () => {
                this.setState({
                    cropper: true,
                    cropperSrc: reader.result,
                    cropperExt: file.ext,
                });
            };
        }
    }
    uploadAvatar = async (blob, ext = 'png') => {
        this.toggleAvatarLoading();

        try {
            const avatarUrl = await uploadFile(blob, `Avatar/${this.props.userId}_${Date.now()}`, `Avatar_${this.props.userId}_${Date.now()}.${ext}`);
            const [changeAvatarErr] = await fetch('changeAvatar', { avatar: avatarUrl });
            if (changeAvatarErr) {
                Message.error(changeAvatarErr);
            } else {
                action.setAvatar(URL.createObjectURL(blob));
                Message.success('Avatar has changed');
                this.setState({ cropper: false });
            }
        } catch (err) {
            console.error(err);
            Message.error('Uploading avatar failed');
        } finally {
            this.toggleAvatarLoading();
        }
    }
    changeAvatar = () => {
        this.cropper.getCroppedCanvas().toBlob(async (blob) => {
            this.uploadAvatar(blob, this.state.cropperExt);
        });
    }
    /**
     * Change Password
     */
    changePassword = async () => {
        const [err] = await fetch('changePassword', {
            oldPassword: this.oldPassword.getValue(),
            newPassword: this.newPassword.getValue(),
        });
        if (!err) {
            this.props.onClose();
            SelfInfo.reLogin('Password has been updated, Please log in again with your new password.');
        }
    }
    /**
     * Modify username
     */
    changeUsername = async () => {
        const [err] = await fetch('changeUsername', {
            username: this.username.getValue(),
        });
        if (!err) {
            this.props.onClose();
            SelfInfo.reLogin('Username has been changed, Please log in again with your new username');
        }
    }
    render() {
        const { visible, onClose, avatar, primaryColor } = this.props;
        const { loading, cropper, cropperSrc } = this.state;
        return (
            <Dialog className="dialog selfInfo" visible={visible} title="Personal informations settings" onClose={onClose}>
                <div className="content">
                    <div>
                        <p>Change avatar</p>
                        <div className="avatar-preview">
                            {
                                cropper ?
                                    <div className="cropper">
                                        <Cropper
                                            className={loading ? 'blur' : ''}
                                            ref={i => this.cropper = i}
                                            src={cropperSrc}
                                            style={{ height: 460, width: 460 }}
                                            aspectRatio={1}
                                        />
                                        <Button onClick={this.changeAvatar}>Change avatar</Button>
                                        <ReactLoading className={`loading ${loading ? 'show' : 'hide'}`} type="spinningBubbles" color={`rgb(${primaryColor}`} height={120} width={120} />
                                    </div>
                                    :
                                    <div className="preview">
                                        <img className={loading ? 'blur' : ''} src={avatar} onClick={this.selectAvatar} />
                                        <ReactLoading className={`loading ${loading ? 'show' : 'hide'}`} type="spinningBubbles" color={`rgb(${primaryColor}`} height={80} width={80} />
                                    </div>
                            }
                        </div>
                    </div>
                    <div>
                        <p>Change password</p>
                        <div className="change-password">
                            <Input ref={i => this.oldPassword = i} type="password" placeholder="old password" />
                            <Input ref={i => this.newPassword = i} type="password" placeholder="New password" />
                            <Button onClick={this.changePassword}>Change password</Button>
                        </div>
                    </div>
                    <div>
                        <p>Change username</p>
                        <div className="change-username">
                            <Input ref={i => this.username = i} type="text" placeholder="Username" />
                            <Button onClick={this.changeUsername}>Change username</Button>
                        </div>
                    </div>
                </div>
            </Dialog>
        );
    }
}

export default connect(state => ({
    avatar: state.getIn(['user', 'avatar']),
    primaryColor: state.getIn(['ui', 'primaryColor']),
    userId: state.getIn(['user', '_id']),
}))(SelfInfo);
