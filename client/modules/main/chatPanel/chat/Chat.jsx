import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import immutable from 'immutable';

import fetch from 'utils/fetch';
import readDiskFile from 'utils/readDiskFile';
import uploadFile from 'utils/uploadFile';
import config from 'root/config/client';
import action from '@/state/action';
import Avatar from '@/components/Avatar';
import Tooltip from '@/components/Tooltip';
import Message from '@/components/Message';
import Button from '@/components/Button';
import HeaderBar from './HeaderBar';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import UserInfo from '../UserInfo';
import './Chat.less';

class Chat extends Component {
    static propTypes = {
        focus: PropTypes.string,
        members: ImmutablePropTypes.list,
        userId: PropTypes.string,
        creator: PropTypes.string,
        avatar: PropTypes.string,
        name: PropTypes.string,
        type: PropTypes.string,
    }
    constructor(...args) {
        super(...args);
        this.state = {
            groupInfoDialog: false,
            userInfoDialog: false,
            userInfo: {},
        };
    }
    componentDidMount() {
        document.body.addEventListener('click', this.handleBodyClick, false);
    }
    componentWillUnmount() {
        document.body.removeEventListener('click', this.handleBodyClick, false);
    }
    handleBodyClick = (e) => {
        if (!this.state.groupInfoDialog) {
            return;
        }

        const { currentTarget } = e;
        let { target } = e;
        do {
            if (/float-panel/.test(target.className)) {
                return;
            }
            target = target.parentElement;
        } while (target && target !== currentTarget);
        this.closeGroupInfo();
    }
    groupInfoDialog = async (e) => {
        const { focus, userId } = this.props;
        this.setState({
            groupInfoDialog: true,
        });
        e.stopPropagation();
        e.preventDefault();

        let err = null;
        let result = null;
        if (userId) {
            [err, result] = await fetch('getGroupOnlineMembers', { groupId: focus });
        } else {
            [err, result] = await fetch('getDefaultGroupOnlineMembers', { });
        }
        if (!err) {
            action.setGroupMembers(focus, result);
        }
    }
    closeGroupInfo = () => {
        this.setState({
            groupInfoDialog: false,
        });
    }
    showUserInfoDialog = (userInfo) => {
        this.setState({
            userInfoDialog: true,
            userInfo,
        });
    }
    closeUserInfoDialog = () => {
        this.setState({
            userInfoDialog: false,
        });
    }
    changeGroupAvatar = async () => {
        const { userId, focus } = this.props;
        const image = await readDiskFile('blob', 'image/png,image/jpeg,image/gif');
        if (!image) {
            return;
        }
        if (image.length > config.maxImageSize) {
            return Message.error('Failed to set group avatar, make sure the image size is less than 1MB');
        }

        try {
            const imageUrl = await uploadFile(image.result, `GroupAvatar/${userId}_${Date.now()}`, `GroupAvatar_${userId}_${Date.now()}.${image.ext}`);
            const [changeGroupAvatarError] = await fetch('changeGroupAvatar', { groupId: focus, avatar: imageUrl });
            if (!changeGroupAvatarError) {
                action.setGroupAvatar(focus, URL.createObjectURL(image.result));
                Message.success('Group avatar has been updated');
            }
        } catch (err) {
            console.error(err);
            Message.error('Failed to upload group avatar');
        }
    }
    leaveGroup = async () => {
        const { focus } = this.props;
        const [err] = await fetch('leaveGroup', { groupId: focus });
        if (!err) {
            this.closeGroupInfo();
            action.removeLinkman(focus);
            Message.success('You have left the group');
        }
    }
    /**
     * Click on the user event of the group 
     * @param {ImmutableMap} groupmember
     */
    handleClickGroupInfoUser(member) {
        // If it is yourself, it will not show
        if (member.getIn(['user', '_id']) === this.props.userId) {
            return;
        }
        this.showUserInfoDialog(member.get('user').toJS());
    }
    /**
     * Render a list of online users in a group
     */
    renderMembers() {
        return this.props.members.map(member => (
            <div key={member.get('_id')}>
                <div onClick={this.handleClickGroupInfoUser.bind(this, member)}>
                    <Avatar size={24} src={member.getIn(['user', 'avatar'])} />
                    <p>{member.getIn(['user', 'username'])}</p>
                </div>
                <Tooltip placement="top" trigger={['hover']} overlay={<span>{member.get('environment')}</span>}>
                    <p>
                        {member.get('browser')}
                        &nbsp;&nbsp;
                        {member.get('os') === 'Windows Server 2008 R2 / 7' ? 'Windows 7' : member.get('os')}
                    </p>
                </Tooltip>
            </div>
        ));
    }
    render() {
        const { groupInfoDialog, userInfoDialog, userInfo } = this.state;
        const { userId, creator, avatar, type, focus = '', name, members } = this.props;
        return (
            <div className="module-main-chat">
                <HeaderBar onShowInfo={type === 'group' ? this.groupInfoDialog : this.showUserInfoDialog.bind(this, { _id: focus.replace(userId, ''), username: name, avatar })} />
                <MessageList showUserInfoDialog={this.showUserInfoDialog} />
                <ChatInput members={members} />
                <div className={`float-panel group-info ${groupInfoDialog ? 'show' : 'hide'}`}>
                    <p>About the group</p>
                    <div>
                        {
                            !!userId && userId === creator ?
                                <div className="avatar">
                                    <p>Group avatar (Click to change avatar)</p>
                                    <img src={avatar} onClick={this.changeGroupAvatar} />
                                </div>
                                :
                                null
                        }
			<div className="online-members">
                            <p>Online members: <span>{this.props.members.size}</span></p>
			   
                            <div>{this.renderMembers()}</div>
                        </div>
                        <div className="feature" style={{ display: !!userId && userId === creator ? 'none' : 'block' }}>
                            <Button type="danger" onClick={this.leaveGroup}>Exit group</Button>
                        </div>
                        
                    </div>
                </div>
                { userInfoDialog ? <UserInfo visible={userInfoDialog} userInfo={userInfo} onClose={this.closeUserInfoDialog} /> : ''}
            </div>
        );
    }
}

export default connect((state) => {
    const isLogin = !!state.getIn(['user', '_id']);
    if (!isLogin) {
        return {
            userId: '',
            focus: state.getIn(['user', 'linkmans', 0, '_id']),
            creator: '',
            avatar: state.getIn(['user', 'linkmans', 0, 'avatar']),
            members: state.getIn(['user', 'linkmans', 0, 'members']) || immutable.List(),
        };
    }

    const focus = state.get('focus');
    const linkman = state.getIn(['user', 'linkmans']).find(g => g.get('_id') === focus);

    return {
        userId: state.getIn(['user', '_id']),
        focus,
        type: linkman.get('type'),
        creator: linkman.get('creator'),
        name: linkman.get('name'),
        avatar: linkman.get('avatar'),
        members: linkman.get('members') || immutable.fromJS([]),
    };
})(Chat);
