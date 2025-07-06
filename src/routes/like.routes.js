import { Router } from "express";
import {
    getUserLikedEvents,
    getEventLikes,
    getEventLikedUsers,
} from "../controllers/like.controller.js";
import  JWTverify  from "../middlewares/auth.middleware.js";

const router = Router();

router.use(JWTverify);

// Get all events liked by the authenticated user
router.route("/user/liked-events").get(getUserLikedEvents);

// Get likes count and basic info for a specific event
router.route("/event/:eventId").get(getEventLikes);

// Get detailed user info of people who liked a specific event
router.route("/event/:eventId/users").get(getEventLikedUsers);

export default router;
