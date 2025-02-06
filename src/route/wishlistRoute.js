const express = require("express");
const { addToWishlist, getWishlist, removeFromWishlist } = require("../controller/wishlistController");
const { authMiddleware } = require("../middleware/authMiddleware");

const WhishlistModel = express.Router();

WhishlistModel.post("/", authMiddleware,addToWishlist)
WhishlistModel.get('/student/get',authMiddleware,getWishlist)
WhishlistModel.delete('/student/delete/:id',authMiddleware,removeFromWishlist)

// admin 


module.exports = WhishlistModel;