import { Router } from "express"
import {placeAutocomplete} from "../controllers/places.controller.js"


const router = Router();

router.route("/place").get(placeAutocomplete);

export default router;