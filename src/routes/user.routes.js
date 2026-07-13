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
    resetPassword,
    userHistory,
    onboardingUser,
    togglePreferredCategory,
    changeEmail,
    emailUpdateConfirmation,
    updateLocation
} from "../controllers/user.controller.js";
import {googleAuth, callbackAuth, discordCallbackAuth, discordAuth} from "../controllers/auth.controller.js"
import {upload} from "../middlewares/multer.middleware.js";
import JWTverify from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(upload.none(),registerUser);
router.route("/login").post(upload.none(), login);
router.route("/logout").post(JWTverify, logout);
router.route("/google/auth").get(googleAuth);
router.route("/google/auth/callback").get(callbackAuth);
router.route("/discord/auth").get(discordAuth);
router.route("/discord/auth/callback").get(discordCallbackAuth);
router.route("/current_user").get(JWTverify, currentUser);
router.route("/forget_password").post(forgetPassword);
router.route("/reset_password").post(resetPassword); 
router.route("/current_user").get(JWTverify, currentUser);
router.route("/update_profile").put(JWTverify, upload.single('avatar'),updateUserProfile);
router.route("/change_password").put(JWTverify, changePassword);
router.route("/history").get(JWTverify, userHistory);
router.route("/onboarding").put(JWTverify, onboardingUser);
router.route("/category/toggle/:categoryId").patch(JWTverify, togglePreferredCategory);
router.route("/change_email").post(JWTverify, changeEmail);
router.route("/update-location").put(JWTverify, updateLocation);
router.route("/referesh_access_token").put(refreshAccessToken);
router.route("/verifying-request").get(emailUpdateConfirmation);



export default router;
