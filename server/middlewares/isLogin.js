/**
 * Blocking log-in requests
 */
module.exports = function () {
    const noUseLoginEvent = {
        register: true,
        login: true,
        loginByToken: true,
        guest: true,
        getDefalutGroupHistoryMessages: true,
        getDefaultGroupOnlineMembers: true,
    };
    return async (ctx, next) => {
        if (!noUseLoginEvent[ctx.event] && !ctx.socket.user) {
            ctx.res = 'Login failed, Please try again.';
            return;
        }
        await next();
    };
};
