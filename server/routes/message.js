const assert = require('assert');
const { isValid } = require('mongoose').Types.ObjectId;

const User = require('../models/user');
const Group = require('../models/group');
const Message = require('../models/message');
const Socket = require('../models/socket');
const xss = require('../../utils/xss');

const FirstTimeMessagesCount = 15;
const EachFetchMessagesCount = 30;

module.exports = {
    async sendMessage(ctx) {
        const { to, type, content } = ctx.data;
        assert(to, 'Cannot be empty');

        let groupId = '';
        let userId = '';
        if (isValid(to)) {
            groupId = to;
            const group = await Group.findOne({ _id: to });
            assert(group, 'Group does not exist');
        } else {
            userId = to.replace(ctx.socket.user, '');
            assert(isValid(userId), 'Invalid user ID');
            const user = await User.findOne({ _id: userId });
            assert(user, 'User does not exist');
        }

        let messageContent = content;
        if (type === 'text') {
            assert(messageContent.length <= 2048, 'Message is too long');
            messageContent = xss(content);
        } else if (type === 'invite') {
            const group = await Group.findOne({ name: content });
            assert(group, 'Group does not exist');

            const user = await User.findOne({ _id: ctx.socket.user });
            messageContent = JSON.stringify({
                inviter: user.username,
                groupId: group._id,
                groupName: group.name,
            });
        }

        let message;
        try {
            message = await Message.create({
                from: ctx.socket.user,
                to,
                type,
                content: messageContent,
            });
        } catch (err) {
            throw err;
        }

        const user = await User.findOne({ _id: ctx.socket.user }, { username: 1, avatar: 1 });
        const messageData = {
            _id: message._id,
            createTime: message.createTime,
            from: user.toObject(),
            to,
            type,
            content: messageContent,
        };

        if (groupId) {
            ctx.socket.socket.to(groupId).emit('message', messageData);
        } else {
            const sockets = await Socket.find({ user: userId });
            sockets.forEach((socket) => {
                ctx._io.to(socket.id).emit('message', messageData);
            });
            const selfSockets = await Socket.find({ user: ctx.socket.user });
            selfSockets.forEach((socket) => {
                if (socket.id !== ctx.socket.id) {
                    ctx._io.to(socket.id).emit('message', messageData);
                }
            });
        }

        return messageData;
    },
    async getLinkmansLastMessages(ctx) {
        const { linkmans } = ctx.data;
        assert(Array.isArray(linkmans), 'The parameter linkmans should be array');

        const promises = linkmans.map(linkmanId =>
            Message
                .find(
                    { to: linkmanId },
                    { type: 1, content: 1, from: 1, createTime: 1 },
                    { sort: { createTime: -1 }, limit: FirstTimeMessagesCount },
                )
                .populate('from', { username: 1, avatar: 1 }));
        const results = await Promise.all(promises);
        const messages = linkmans.reduce((result, linkmanId, index) => {
            result[linkmanId] = (results[index] || []).reverse();
            return result;
        }, {});

        return messages;
    },
    async getLinkmanHistoryMessages(ctx) {
        const { linkmanId, existCount } = ctx.data;

        const messages = await Message
            .find(
                { to: linkmanId },
                { type: 1, content: 1, from: 1, createTime: 1 },
                { sort: { createTime: -1 }, limit: EachFetchMessagesCount + existCount },
            )
            .populate('from', { username: 1, avatar: 1 });
        const result = messages.slice(existCount).reverse();
        return result;
    },
    async getDefalutGroupHistoryMessages(ctx) {
        const { existCount } = ctx.data;

        const group = await Group.findOne({ isDefault: true });
        const messages = await Message
            .find(
                { to: group._id },
                { type: 1, content: 1, from: 1, createTime: 1 },
                { sort: { createTime: -1 }, limit: EachFetchMessagesCount + existCount },
            )
            .populate('from', { username: 1, avatar: 1 });
        const result = messages.slice(existCount).reverse();
        return result;
    },
};
