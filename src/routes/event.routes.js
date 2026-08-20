import { Router } from "express";
import {
    createEvent,
    deleteEvent,
    updateEvent,
    getLivesEventsPreview,
    getPrivateEvent,
    findEventById,
    coHosts,
    privateUserInvitations,
    acceptOrDeclineInvitation,
    activeEvent,
    cancelEvent,
} from "../controllers/event.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import JWTverify from "../middlewares/auth.middleware.js";

    const router = Router();
    
    router.route("/public").get(JWTverify, getLivesEventsPreview);
    router.route("/private/:eventId/:token").get(getPrivateEvent);

    router.route("/create").post(JWTverify, upload.single("image"), createEvent);
    router.route("/:eventId").delete(JWTverify, deleteEvent);
    router.route("/:eventId").put(JWTverify, updateEvent);
    router.route("/:eventId").get(JWTverify, findEventById);
    router.route("/:eventId/co-hosts").put(JWTverify, coHosts);    
    router.route("/:eventId/invitations").put(JWTverify, privateUserInvitations);   
    router.route("/:eventId/invitations/respond").post(JWTverify, acceptOrDeclineInvitation);
    router.route("/:eventId/activate").put(JWTverify, activeEvent);
    router.route("/:eventId/cancel").post(JWTverify, cancelEvent);
    


export default router;