import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { TwitterPicker } from 'react-color';
import { RadioGroup, RadioButton } from 'react-radio-buttons';
import Switch from 'react-switch';
import ReactLoading from 'react-loading';

import action from '@/state/action';
import socket from '@/socket';
import Avatar from '@/components/Avatar';
import IconButton from '@/components/IconButton';
import Dialog from '@/components/Dialog';
import Button from '@/components/Button';
import Message from '@/components/Message';
import Tooltip from '@/components/Tooltip';
import setCssVariable from 'utils/setCssVariable';
import readDiskFile from 'utils/readDiskFile';
import playSound from 'utils/sound';
import booleanStateDecorator from 'utils/booleanStateDecorator';
import uploadFile from 'utils/uploadFile';
import OnlineStatus from './OnlineStatus';
import AppDownload from './AppDownload';
import AdminDialog from './AdminDialog';
import SelfInfo from './SelfInfo';
import config from '../../../../config/client';

import './Sidebar.less';


/**
 * Left sidebar of the page
 */
@booleanStateDecorator({
    settingDialog: false, // settings
    userDialog: false, // Personal informations settings
    rewardDialog: false, // reward
    infoDialog: false, // about
    appDownloadDialog: false, // DOWNLOADAPP
    adminDialog: false, // administrator
})
class Sidebar extends Component {
    static logout() {
        action.logout();
        window.localStorage.removeItem('token');
        Message.success('You have successfully logged out');
        socket.disconnect();
        socket.connect();
    }
    static resetThume() {
        action.setPrimaryColor(config.primaryColor);
        action.setPrimaryTextColor(config.primaryTextColor);
        action.setBackgroundImage(config.backgroundImage);
        setCssVariable(config.primaryColor, config.primaryTextColor);
        window.localStorage.removeItem('primaryColor');
        window.localStorage.removeItem('primaryTextColor');
        window.localStorage.removeItem('backgroundImage');
        Message.success('Default theme has been restored');
    }
    static resetSound() {
        action.setSound(config.sound);
        window.localStorage.removeItem('sound');
        Message.success('Default tone has been restored');
    }
    static handleSelectSound(sound) {
        playSound(sound);
        action.setSound(sound);
    }
    static propTypes = {
        isLogin: PropTypes.bool.isRequired,
        isConnect: PropTypes.bool.isRequired,
        avatar: PropTypes.string,
        primaryColor: PropTypes.string,
        primaryTextColor: PropTypes.string,
        backgroundImage: PropTypes.string,
        sound: PropTypes.string,
        soundSwitch: PropTypes.bool,
        notificationSwitch: PropTypes.bool,
        voiceSwitch: PropTypes.bool,
        isAdmin: PropTypes.bool,
        userId: PropTypes.string,
    }
    constructor(...args) {
        super(...args);
        this.state = {
            backgroundLoading: false,
        };
    }
    handlePrimaryColorChange = (color) => {
        const primaryColor = `${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}`;
        const { primaryTextColor } = this.props;
        action.setPrimaryColor(`${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}`);
        setCssVariable(primaryColor, primaryTextColor);
    }
    handlePrimaryTextColorChange = (color) => {
        const primaryTextColor = `${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}`;
        const { primaryColor } = this.props;
        action.setPrimaryTextColor(`${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}`);
        setCssVariable(primaryColor, primaryTextColor);
    }
    toggleBackgroundLoading = () => {
        this.setState({
            backgroundLoading: !this.state.backgroundLoading,
        });
    }
    selectBackgroundImage = async () => {
        this.toggleBackgroundLoading();
        try {
            const image = await readDiskFile('blob', 'image/png,image/jpeg,image/gif');
            if (!image) {
                return;
            }
            if (image.length > config.maxBackgroundImageSize) {
                return Message.error('Setting background image failed, Please select a picture smaller than 3MB');
            }
            const { userId } = this.props;
            const imageUrl = await uploadFile(
                image.result,
                `BackgroundImage/${userId}_${Date.now()}`,
                `BackgroundImage_${userId}_${Date.now()}.${image.ext}`,
            );
            action.setBackgroundImage(imageUrl);
        } finally {
            this.toggleBackgroundLoading();
        }
    }
    static renderTooltip(text, component) {
        return (
            <Tooltip placement="right" mouseEnterDelay={0.3} overlay={<span>{text}</span>}>
                <div>
                    {component}
                </div>
            </Tooltip>
        );
    }
    render() {
        const { isLogin, isConnect, avatar, primaryColor, primaryTextColor, backgroundImage, sound, soundSwitch, notificationSwitch, voiceSwitch, isAdmin } = this.props;
        const { settingDialog, userDialog, rewardDialog, infoDialog, appDownloadDialog, backgroundLoading, adminDialog } = this.state;
        if (isLogin) {
            return (
                <div className="module-main-sidebar">
                    <Avatar className="avatar" src={avatar} onClick={this.toggleUserDialog} />
                    <OnlineStatus className="status" status={isConnect ? 'online' : 'offline'} />
                    <div className="buttons">
                        {
                            isAdmin ?
                                Sidebar.renderTooltip('Administrator', <IconButton width={40} height={40} icon="administrator" iconSize={28} onClick={this.toggleAdminDialog} />)
                                :
                                null
                        }
                   
                        {Sidebar.renderTooltip('Settings', <IconButton width={40} height={40} icon="setting" iconSize={26} onClick={this.toggleSettingDialog} />)}
                        {Sidebar.renderTooltip('Sign out', <IconButton width={40} height={40} icon="logout" iconSize={26} onClick={Sidebar.logout} />)}
                    </div>
                    <Dialog className="dialog system-setting" visible={settingDialog} title="System settings" onClose={this.toggleSettingDialog}>
                        <div className="content">
			<div>
                                <p>Change Background<span className="background-tip"> Click below to change the Background image</span></p>
                                <div className="image-preview">
                                    <img className={backgroundLoading ? 'blur' : ''} src={backgroundImage} onClick={this.selectBackgroundImage} />
                                    <ReactLoading className={`loading ${backgroundLoading ? 'show' : 'hide'}`} type="spinningBubbles" color={`rgb(${primaryColor}`} height={100} width={100} />
                                </div>
                            </div>                            

				<div>
                                <p>Chat Theme</p>
                                <div className="buttons">
                                    <Button onClick={Sidebar.resetThume}>Restore default theme</Button>
                                    
                                </div>
  
                            </div>
                            
                            <div>
                                <p>Theme color</p>
                                <div className="color-info">
                                    <div style={{ backgroundColor: `rgb(${primaryColor})` }} />
                                    <span>{`rgb(${primaryColor})`}</span>
                                </div>
                                <TwitterPicker className="color-picker" color={`rgb(${primaryColor})`} onChange={this.handlePrimaryColorChange} />
                            </div>
                            <div>
                                <p>Text color</p>
                                <div className="color-info">
                                    <div style={{ backgroundColor: `rgb(${primaryTextColor})` }} />
                                    <span>{`rgb(${primaryTextColor})`}</span>
                                </div>
                                <TwitterPicker className="color-picker" color={`rgb(${primaryTextColor})`} onChange={this.handlePrimaryTextColorChange} />
                            </div>
                        </div>
                    </Dialog>
                    <SelfInfo visible={userDialog} onClose={this.toggleUserDialog} />
                    
                    
                    <AppDownload visible={appDownloadDialog} onClose={this.toggleAppDownloadDialog} />
                    <AdminDialog visible={adminDialog} onClose={this.toggleAdminDialog} />
                </div>
            );
        }
        return (
            <div className="module-main-sidebar" />
        );
    }
}

export default connect(state => ({
    isLogin: !!state.getIn(['user', '_id']),
    isConnect: state.get('connect'),
    avatar: state.getIn(['user', 'avatar']),
    isAdmin: state.getIn(['user', 'isAdmin']),
    primaryColor: state.getIn(['ui', 'primaryColor']),
    primaryTextColor: state.getIn(['ui', 'primaryTextColor']),
    backgroundImage: state.getIn(['ui', 'backgroundImage']),
    sound: state.getIn(['ui', 'sound']),
    soundSwitch: state.getIn(['ui', 'soundSwitch']),
    notificationSwitch: state.getIn(['ui', 'notificationSwitch']),
    voiceSwitch: state.getIn(['ui', 'voiceSwitch']),
    userId: state.getIn(['user', '_id']),
}))(Sidebar);
