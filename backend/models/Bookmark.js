const mongoose = require('mongoose');

const BookmarkSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        schemeId: {
            type: String,
            required: [true, 'Scheme ID is required'],
        },
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
        },
        description: {
            type: String,
            default: '',
            trim: true,
        },
        link: {
            type: String,
            default: '',
        },
        category: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

// Prevent duplicate bookmarks per user
BookmarkSchema.index({ userId: 1, schemeId: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', BookmarkSchema);
