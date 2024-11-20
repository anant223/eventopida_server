import { Router } from "express";
import {
    toggleEventLike,
    getAllLikesOnAEvent,
} from "../controllers/Like.controller";

const router = Router();

router.route("/toggle/e/:eventId").post(toggleEventLike)
router.route("/toggle/event").post(getAllLikesOnAEvent)

export default router;