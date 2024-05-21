import { Router } from "express";
import { logginUser, logoutUser, registerUser, refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,UpdateUserAvatar,UpdateUserCoverImage,addBlog,getBlogs } from "../controller/user.controller.js";

import {upload} from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router =Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount:1
        },
        { 
            name:"coverImage",
            maxCount:1
        }
    ]),       
    registerUser
)

    router.route("/login").post(logginUser)

    // secure routes
    router.route("/logout").post(verifyJWT,logoutUser)
    router.route("/refresh-token").post(refreshAccessToken)

    router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), UpdateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), UpdateUserCoverImage)

// add blog
router.route("/add-blog").post(
    upload.fields([
        { name: "coverImage", maxCount: 1 }
    ]),       
    addBlog
);
// get all blogs
router.route("/get-blogs").get(getBlogs)

export default router