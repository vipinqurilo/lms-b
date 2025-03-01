const CourseModel = require("../model/CourseModel");
const WishlistModel = require("../model/wishlistModel");

exports.addToWishlist = async (req, res) => {
    try {
        const user = req.user.id;
        const { course } = req.body;
        const findUser = await WishlistModel.findOne({ user, course });
        if(findUser) {
            const wishlist = await WishlistModel.findByIdAndDelete(findUser._id);
            return res.json({
                status: "success",
                message: "removed from wishlist",
                data: await wishlist.populate("course"),    
            });
        }
        const wishlist = await WishlistModel.create({ course, user });
        if(!wishlist) return res.json({ status: "failed", message: "not added to wishlist" })
        res.json({
            status: "success",  
            message: "added to wishlist",
            data: await wishlist.populate("course"),
        });
    } catch (error) {
        res.json({
            status: "failed",
            message: "something went wrong",
            error: error.message,
        });
    }
};

exports.getWishlist = async (req, res) => {
    try {
        const user = req.user.id;
        const wishlist = await WishlistModel.find({ user }).populate({
            path:"course",
            model:CourseModel,
            populate:[{
                path:"courseInstructor"
            }]
        })
        res.json({ 
            status: "success",
            message: "wishlist fetched successfully",
            data: wishlist,
        });
    } catch (error) {
        res.json({
            status: "failed",
            message: "something went wrong",
            error: error.message,
        });
    }
};

exports.removeFromWishlist = async (req, res) => {
    try {
        const { id } = req.params;
        const wishlist = await WishlistModel.findByIdAndDelete(id);
        if(!wishlist) return res.json({ status: "failed", message: "not removed from wishlist" })
        res.json({
            status: "success",
            message: "removed from wishlist",
            data: await wishlist.populate("course"),
        });
    } catch (error) {
        res.json({
            status: "failed",
            message: "something went wrong",
            error: error.message,
        });
    }
}