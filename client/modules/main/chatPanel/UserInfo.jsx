import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { immutableRenderDecorator } from 'react-immutable-render-mixin';
import ImmutablePropTypes from 'react-immutable-proptypes';

import Dialog from '@/components/Dialog';
import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import Message from '@/components/Message';
import action from '@/state/action';
import fetch from 'utils/fetch';
import getFriendId from 'utils/getFriendId';

@immutableRenderDecorator
class UserInfo extends Component {
    static propTypes = {
        visible: PropTypes.bool,
        userInfo: PropTypes.object,
        onClose: PropTypes.func,
        linkman: ImmutablePropTypes.map,
        userId: PropTypes.string,
        isAdmin: PropTypes.bool.isRequired,
    }
    state = {
        showLargeAvatar: false,
    }
    handleFocusUser = () => {
        const { userInfo, userId, onClose } = this.props;
        onClose();
        action.setFocus(getFriendId(userInfo._id, userId));
    }
    handleAddFriend = async () => {
        const { userInfo, userId, linkman, onClose } = this.props;
        const [err, res] = await fetch('addFriend', { userId: userInfo._id });
        if (!err) {
            onClose();
            const _id = getFriendId(userId, res._id);
            let existCount = 0;
            if (linkman) {
                existCount = linkman.get('messages').size;
                action.setFriend(_id, userId, userInfo._id);
            } else {
                const newLinkman = {
                    _id,
                    type: 'friend',
                    createTime: Date.now(),
                    avatar: res.avatar,
                    name: res.username,
                    messages: [],
                    unread: 0,
                    from: res.from,
                    to: res.to,
                };
                action.addLinkman(newLinkman, true);
            }
            const [err2, messages] = await fetch('getLinkmanHistoryMessages', { linkmanId: _id, existCount });
            if (!err2) {
                action.addLinkmanMessages(_id, messages);
            }
        }
    }
    handleDeleteFriend = async () => {
        const { userInfo, userId, onClose } = this.props;
        const [err] = await fetch('deleteFriend', { userId: userInfo._id });
        if (!err) {
            onClose();
            action.removeLinkman(getFriendId(userId, userInfo._id));
            Message.success('Friend has been deleted');
        }
    }
    handleSeal = async () => {
        const [err] = await fetch('sealUser', { username: this.props.userInfo.username });
        if (!err) {
            Message.success('User has been blocked');
        }
    }
    mouseEnterAvatar = () => {
        this.setState({
            showLargeAvatar: true,
        });
    }
    mouseLeaveAvatar = () => {
        this.setState({
            showLargeAvatar: false,
        });
    }
    render() {
        const { visible, userInfo, onClose, linkman, isAdmin } = this.props;
        const isFriend = linkman && linkman.get('type') === 'friend';
        return (
            <Dialog className="info-dialog" visible={visible} onClose={onClose}>
                <div>
                    {
                        visible && userInfo ?
                            <div className="content">
                                <div className="header">
                                    <Avatar
                                        size={60}
                                        src={userInfo.avatar}
                                        onMouseEnter={this.mouseEnterAvatar}
                                        onMouseLeave={this.mouseLeaveAvatar}
                                    />
                                    <img
                                        className={`large-avatar ${this.state.showLargeAvatar ? 'show' : 'hide'}`}
                                        src={userInfo.avatar}
                                    />
                                    <p>{userInfo.username}</p>
                                </div>
                                {
                                    userInfo._id === '5adad39555703565e7903f79' && userInfo.username !== 'robot10' ?
                                        <div className="info">
                                            <p>this is an Alien</p>
                                        </div>
                                        :
                                        <div className="info">
                                            {
                                                isFriend ? <Button onClick={this.handleFocusUser}>Send a message</Button> : null
                                            }
                                            {
                                                isFriend ?
                                                    <Button type="danger" onClick={this.handleDeleteFriend}>Delete friend</Button>
                                                    :
                                                    <Button onClick={this.handleAddFriend}>Add friend</Button>
                                            }
                                            {
                                                isAdmin ? <Button type="danger" onClick={this.handleSeal}>Ban User</Button> : null
                                            }
                                        </div>
                                }
                            </div>
                            :
                            null
                    }
                </div>
            </Dialog>
        );
    }
}

export default connect((state, props) => {
    const userId = state.getIn(['user', '_id']);
    const isAdmin = state.getIn(['user', 'isAdmin']);
    if (!props.visible) {
        return {
            linkman: null,
            userId,
            isAdmin,
        };
    }

    const friendId = getFriendId(props.userInfo._id, userId);
    const linkman = state
        .getIn(['user', 'linkmans'])
        .find(l => l.get('_id') === friendId);
    return {
        linkman,
        userId: state.getIn(['user', '_id']),
        isAdmin: state.getIn(['user', 'isAdmin']),
    };
})(UserInfo);
