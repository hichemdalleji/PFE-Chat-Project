const bluebird = require('bluebird');
const fs = bluebird.promisifyAll(require('fs'), { suffix: '$' });
const path = require('path');
const axios = require('axios');
const assert = require('assert');
const ip = require('ip');
const User = require('../models/user');
const Group = require('../models/group');
const config = require('../../config/server');

let baiduToken = '';
let lastBaiduTokenTime = Date.now();

module.exports = {
    async search(ctx) {
        const { keywords } = ctx.data;
        if (keywords === '') {
            return {
                users: [],
                groups: [],
            };
        }

        const users = await User.find(
            { username: { $regex: keywords } },
            { avatar: 1, username: 1 },
        );
        const groups = await Group.find(
            { name: { $regex: keywords } },
            { avatar: 1, name: 1, members: 1 },
        );

        return {
            users,
            groups: groups.map(group => ({
                _id: group._id,
                avatar: group.avatar,
                name: group.name,
                members: group.members.length,
            })),
        };
    },
    async searchExpression(ctx) {
        const { keywords } = ctx.data;
        if (keywords === '') {
            return [];
        }

        const res = await axios.get(``);
        assert(res.status === 200, 'Could not find Emoji, please try again');

        const images = res.data.match(/data-original="[^ "]+"/g) || [];
        return images.map(i => i.substring(15, i.length - 1));
    },
    async getBaiduToken() {
        if (baiduToken && Date.now() < lastBaiduTokenTime) {
            return { token: baiduToken };
        }

        const res = await axios.get('');
        assert(res.status === 200, 'Requesting token failed');

        baiduToken = res.data.access_token;
        lastBaiduTokenTime = Date.now() + (res.data.expires_in - 60 * 60 * 24) * 1000;
        return { token: baiduToken };
    },
    async sealUser(ctx) {
        const { username } = ctx.data;
        assert(username !== '', 'Username Cannot be empty');

        const user = await User.findOne({ username });
        assert(user, 'User does not exist');

        const userId = user._id.toString();
        const sealList = global.mdb.get('sealList');
        assert(!sealList.has(userId), 'User is on the ban list');

        sealList.add(userId);
        setTimeout(() => {
            sealList.delete(userId);
        }, 1000 * 60 * 10);

        return {
            msg: 'ok',
        };
    },
    async getSealList() {
        const sealList = global.mdb.get('sealList');
        const userIds = [...sealList.keys()];
        const users = await User.find({ _id: { $in: userIds } });
        const result = users.map(user => user.username);
        return result;
    },
    async uploadFile(ctx) {
        assert(
            config.qiniuAccessKey === ''
            || config.qiniuBucket === ''
            || config.qiniuBucket === ''
            || config.qiniuUrlPrefix === '',
            'Server have been configured, please use server file upload',
        );

        try {
            await fs.writeFile$(path.resolve(__dirname, `../../public/${ctx.data.fileName}`), ctx.data.file);
            return {
                url: `${process.env.NODE_ENV === 'production' ? '' : `http://${ip.address()}:${config.port}`}/${ctx.data.fileName}`,
            };
        } catch (err) {
            console.error(err);
            return `Upload file failed:${err.message}`;
        }
    },
};
