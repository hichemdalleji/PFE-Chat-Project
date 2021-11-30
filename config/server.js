const options = require('../utils/commandOptions');

const { env } = process;

module.exports = {
    // service port
    port: options.port || env.Port || 9200,

    // mongodb address
    database: options.database || env.Database || 'mongodb://localhost:27017/chatproject',

    // jwt encryption secret
    jwtSecret: options.jwtSecret || env.JwtSecret || 'jwtSecret',

    // Maximize the number of groups
    maxGroupsCount: 3,


    allowOrigin: options.allowOrigin || env.AllowOrigin,

    // token expires time
    tokenExpiresTime: 1000 * 60 * 60 * 24 * 7,

    // administrator user id
    administrator: options.administrator || env.Administrator || '5ce33e81f2cce23104ab1804',

    // default group name
    defaultGroupName: 'Lobby',
};
