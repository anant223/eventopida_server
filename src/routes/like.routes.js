import { Router } from "express";
import {
    toggleEventLike,
    getAllLikesOnAEvent,
    getLikedEvents,
} from "../controllers/like.controller.js";
import JWTverify from "../middlewares/auth.middleware.js";

const router = Router();
router.route("/events/all").get(JWTverify, getLikedEvents);
router.route("/events/:eventId/toggle").post(JWTverify,toggleEventLike);
router.route("/events/:eventId").get(getAllLikesOnAEvent);

export default router;