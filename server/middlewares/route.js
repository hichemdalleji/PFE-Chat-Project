function noop() {}

/**
 * Route processing
 * @param {IO} io koa socket io Instance
 * @param {Object} routes
 */
module.exports = function (io, _io, routes) {
    Object.keys(routes).forEach((route) => {
        io.on(route, noop); // Registration issue
    });

    return async (ctx) => {
        // Determine if the route exists
        if (routes[ctx.event]) {
            const { event, data, socket } = ctx;
            // Execute routing and get return data
            ctx.res = await routes[ctx.event]({
                event, // Event name
                data, // Request Data
                socket, // socket 
                io, // koa-socket
                _io, // socket.io
            });
        }
    };
};
