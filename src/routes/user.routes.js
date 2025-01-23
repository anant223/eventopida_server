import { Router } from "express";
import {
    registerUser,
    login,
    logout,
    currentUser,
    forgetPassword,
    updateUserProfile,
    changePassword,
    updateAvatar,
    refreshAccessToken, 
    resetPassword
} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import JWTverify from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(upload.none(),registerUser);
router.route("/login").post(upload.none(), login);
router.route("/logout").post(JWTverify, logout);
router.route("/forget_password").post(upload.none(),forgetPassword);
router.route("/reset_password").post(upload.none(), resetPassword); 
router.route("/current_user").get(JWTverify, currentUser);
router.route("/update_profile").put(JWTverify,updateUserProfile);
router.route("/change_password").put(JWTverify, changePassword);
router.route("/update_avatar").put(JWTverify, upload.single("avatar"), updateAvatar);
router.route("/referesh_access_token").put(refreshAccessToken);

export default router;
