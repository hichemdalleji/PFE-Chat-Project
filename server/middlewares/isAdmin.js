const config = require('../../config/server');
/**
 * Administrator function controller
 */
module.exports = function isAdmin() {
    /**
     * Interface that requires administrator privileges
     */
    const adminEvent = {
        sealUser: true,
        getSealList: true,
        resetUserPassword: true,
    };
    return async (ctx, next) => {
        if (
            adminEvent[ctx.event]
                && ctx.socket.user.toString() !== config.administrator
        ) {
            ctx.res = 'You are not an administrator';
            return;
        }
        await next();
    };
};
