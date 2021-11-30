const MaxCallPerMinutes = 20;
/**
 * Limiting the frequency of interface calls
 */
module.exports = function () {
    let callTimes = {};
    setInterval(() => callTimes = {}, 60000); // Emptying every 60 seconds

    return async (ctx, next) => {
        const { user } = ctx.socket;
        // robot10
        if (user && user.toString() === '5adad39555703565e7903f79') {
            return next();
        }

        const newUserList = global.mdb.get('newUserList');
        const socketId = ctx.socket.id;
        const count = callTimes[socketId] || 0;

        // New restrictions
        if (user && newUserList.has(user.toString()) && count > 20) {
            return ctx.res = 'You have exceeded the number of messages you can send at this time, Please try again later.';
        }
        // General user limit
        if (count > MaxCallPerMinutes) {
            return ctx.res = 'Interface calls are frequent, please try again later';
        }
        callTimes[socketId] = count + 1;
        await next();
    };
};
