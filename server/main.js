const checkVersion = require('../build/check-versions');

checkVersion(); // check the node.js and npm versions


const mongoose = require('mongoose');

const app = require('./app');
const config = require('../config/server');

const Socket = require('./models/socket');
const Group = require('./models/group');
const getRandomAvatar = require('../utils/getRandomAvatar');

global.mdb = new Map(); // Use as in-memory database
global.mdb.set('sealList', new Set()); // Blocked users list
global.mdb.set('newUserList', new Set()); // Registered user list

mongoose.Promise = Promise;


mongoose.connect(config.database, async (err) => {
    if (err) {
        console.error('connect database error!');
        console.error(err);
        return process.exit(1);
    }

    // Determine if the default group exists, create one if it does not exist
    const group = await Group.findOne({ isDefault: true });
    if (!group) {
        const defaultGroup = await Group.create({
            name: config.defaultGroupName,
            avatar: getRandomAvatar(),
            isDefault: true,
        });
        if (!defaultGroup) {
            console.error('create default group fail');
            return process.exit(1);
        }
    } else if (group.name !== config.defaultGroupName) {
        group.name = config.defaultGroupName;
        await group.save();
    }

    app.listen(config.port, async () => {
        await Socket.remove({}); // Delete all history on the Socket table
        console.log(` >>> server listen on http://localhost:${config.port}`);
    });
});
