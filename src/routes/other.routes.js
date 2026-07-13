import { Router } from "express";
import { liveEventsPreview } from "../controllers/ticketmaster.controller.js";
import JWTverify from "../middlewares/auth.middleware.js";

const router = Router()
router.route("/ticketmaster").get(JWTverify,liveEventsPreview);

export default router