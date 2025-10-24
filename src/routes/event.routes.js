import { Router } from "express";
import {
    createEvent,
    deleteEvent,
    updateEvent,
    allPublicEvent,
    getPrivateEvent,
    findEventById,
} from "../controllers/event.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import JWTverify from "../middlewares/auth.middleware.js";

    const router = Router();
    
    router.route("/public").get(allPublicEvent);
    router.route("/private/:eventId/:token").get(getPrivateEvent);

    router.route("/create").post(JWTverify, upload.single("image"), createEvent);
    router.route("/:eventId").delete(JWTverify, deleteEvent);
    router.route("/:eventId").put(JWTverify, updateEvent);
    router.route("/:eventId").get(JWTverify, findEventById);


export default router;