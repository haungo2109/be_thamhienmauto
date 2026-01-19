const express = require('express');
const { getSocialLinks, getSocialLink, createSocialLink, updateSocialLink, deleteSocialLink } = require('../controllers/socialLinkController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();

router.get('/', auth, getSocialLinks);
router.get('/:id', auth, getSocialLink);
router.post('/', adminAuth, createSocialLink);
router.put('/:id', adminAuth, updateSocialLink);
router.delete('/:id', adminAuth, deleteSocialLink);

module.exports = router;
