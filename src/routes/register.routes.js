import { Router } from "express";
import JWTverify from "../middlewares/auth.middleware.js";
import { getRegisteredEvents, registerEvent } from "../controllers/register.controller.js";

const router = Router();

router.use(JWTverify)

router.route("/events/all-registred").get(getRegisteredEvents)
router.route("/events/:eventId").post(registerEvent)

export default router