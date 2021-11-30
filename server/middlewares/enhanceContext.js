/**
 * Enhance object context
 */
module.exports = function () {
    return async (ctx, next) => {
        await next();
        if (ctx.acknowledge) {
            ctx.acknowledge(ctx.res);
        }
    };
};
