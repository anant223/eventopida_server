import { Router } from "express";
import {createWaitList} from "../controllers/waitlist.controller.js";

const router = Router()

router.route("/create").post(createWaitList);

export default router;