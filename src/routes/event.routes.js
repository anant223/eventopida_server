    import { Router } from "express";
    import {
        createEvent,
        deleteEvent,
        updateEvent,
        allPublicEvent,
        allPrivateEvent,
        findEventById,
    } from "../controllers/event.controller.js";
    import { upload } from "../middlewares/multer.middleware.js";
    import JWTverify from "../middlewares/auth.middleware.js";

    const router = Router();

    router.route("/create-event").post(JWTverify, upload.single("thumbnail"), createEvent);
    router.route("/delete-event").get(JWTverify, deleteEvent);
    router.route("/update-event").put(JWTverify, updateEvent);
    router.route("/all-public-event").get(JWTverify, allPublicEvent);
    router.route("/all-private-event").get(JWTverify, allPrivateEvent);
    router.route("/find-event-by-id").get(JWTverify, findEventById);

export default router;