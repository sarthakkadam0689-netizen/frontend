const Bookmark = require('../models/Bookmark');

// ── POST /api/bookmark/add ─────────────────────────────────────────────────────
const addBookmark = async (req, res) => {
    const { schemeId, title, description, link, category } = req.body;

    if (!schemeId || !title) {
        return res.status(400).json({ success: false, message: 'schemeId and title are required' });
    }

    try {
        // Check for duplicate bookmark
        const existing = await Bookmark.findOne({ userId: req.user._id, schemeId });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Scheme already bookmarked' });
        }

        const bookmark = await Bookmark.create({
            userId: req.user._id,
            schemeId,
            title,
            description: description || '',
            link: link || '',
            category: category || '',
        });

        return res.status(201).json({
            success: true,
            message: 'Scheme bookmarked successfully',
            bookmark,
        });
    } catch (error) {
        console.error('Add bookmark error:', error.message);
        return res.status(500).json({ success: false, message: 'Server error while adding bookmark' });
    }
};

// ── GET /api/bookmark/all ──────────────────────────────────────────────────────
const getAllBookmarks = async (req, res) => {
    try {
        const bookmarks = await Bookmark.find({ userId: req.user._id }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: bookmarks.length,
            bookmarks,
        });
    } catch (error) {
        console.error('Get bookmarks error:', error.message);
        return res.status(500).json({ success: false, message: 'Server error while fetching bookmarks' });
    }
};

// ── DELETE /api/bookmark/remove/:id ───────────────────────────────────────────
const removeBookmark = async (req, res) => {
    try {
        const bookmark = await Bookmark.findById(req.params.id);

        if (!bookmark) {
            return res.status(404).json({ success: false, message: 'Bookmark not found' });
        }

        // Ensure user owns this bookmark
        if (bookmark.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to remove this bookmark' });
        }

        await bookmark.deleteOne();

        return res.status(200).json({ success: true, message: 'Bookmark removed successfully' });
    } catch (error) {
        console.error('Remove bookmark error:', error.message);
        return res.status(500).json({ success: false, message: 'Server error while removing bookmark' });
    }
};

module.exports = { addBookmark, getAllBookmarks, removeBookmark };
