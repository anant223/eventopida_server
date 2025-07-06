const socketRateLimiter = new Map();

const checkRateLimit = (socket, next) => {
    const userId = socket.user?._id?.toString() || socket.id;

    const now = Date.now();
    const windowTime = 10000;
    const maxReq = 5;

    if (!socketRateLimiter.has(userId)) {
        socketRateLimiter.set(userId, {
            count: 0,
            resetTime: now + windowTime,
        });
    }

    const userLimit = socketRateLimiter.get(userId);

    if (now >= userLimit.resetTime) {
        userLimit.count = 0;
        userLimit.resetTime = now + windowTime;
        console.log(`Time expired for ${userId}, count reset to 0`);
    }

    if (userLimit.count >= maxReq) {
        const timeLeft = Math.ceil((userLimit.resetTime - now) / 1000);
        socket.emit("not_human_behavior", {
            message: `You can only make ${maxReq} requests in 10 seconds. Wait ${timeLeft} seconds.`,
            retryAfter: timeLeft,
            currentCount: userLimit.count,
            timeWindow: "10 seconds",
        });
        return;
    }

    userLimit.count++;
    socketRateLimiter.set(userId, userLimit);
    next();
};

const cleanupInterval = setInterval(
    () => {
        const now = Date.now();
        const deleteCount = 0;
        for (const [userId, userLimit] of socketRateLimiter.entries()) {
            if (now >= userLimit.resetTime) {
                socketRateLimiter.delete(userId);
                deleteCount+=1;
            }
        }

        if (deleteCount > 0) {
            console.log(
                `Cleanup: Removed ${deleteCount} expired entries. Current size: ${socketRateLimiter.size}`
            );
        }
    },
    3 * 60 * 1000
);

const stopCleanup = () => {
    clearInterval(cleanupInterval);
    console.log("Rate limiter cleanup stopped");
};

process.on("SIGTERM", stopCleanup);
process.on("SIGINT", stopCleanup);

export {
    checkRateLimit,
    stopCleanup,
    socketRateLimiter,
};