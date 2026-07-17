import { Router } from "express";
import { getCategories } from "../controllers/category.controller.js";
const router = Router();

router.route("/").get(getCategories);

export default router;