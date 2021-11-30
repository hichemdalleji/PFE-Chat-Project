/**
 * Refusing to seal user requests
 */
module.exports = function () {
    return async (ctx, next) => {
        const sealList = global.mdb.get('sealList');
        if (ctx.socket.user && sealList.has(ctx.socket.user.toString())) {
            return ctx.res = 'You are currently banned.';
        }

        await next();
    };
};
