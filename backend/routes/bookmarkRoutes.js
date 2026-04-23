const express = require('express');
const router = express.Router();

const { addBookmark, getAllBookmarks, removeBookmark } = require('../controllers/bookmarkController');
const { protect } = require('../middleware/authMiddleware');

// All bookmark routes require authentication
router.use(protect);

router.post('/add', addBookmark);
router.get('/all', getAllBookmarks);
router.delete('/remove/:id', removeBookmark);

module.exports = router;
