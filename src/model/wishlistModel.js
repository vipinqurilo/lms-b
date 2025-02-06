const mongoose = require('mongoose');


const wishlistSchema = new mongoose.Schema({
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const WishlistModel = mongoose.model('Wishlist', wishlistSchema);
module.exports = WishlistModel;