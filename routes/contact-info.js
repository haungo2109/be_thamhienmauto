const express = require('express');
const { getContactInfos, getContactInfo, createContactInfo, updateContactInfo, deleteContactInfo } = require('../controllers/contactInfoController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();

router.get('/', auth, getContactInfos);
router.get('/:id', auth, getContactInfo);
router.post('/', adminAuth, createContactInfo);
router.put('/:id', adminAuth, updateContactInfo);
router.delete('/:id', adminAuth, deleteContactInfo);

module.exports = router;
