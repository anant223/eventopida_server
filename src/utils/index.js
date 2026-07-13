export const safeNotify = (fn, context="") => {
    Promise.resolve(fn()).catch((err) => {
        console.error(`Notification error ${context}:`, err);
    });
};
