const express = require('express');
const { getAttributes, getAttribute, createAttribute, updateAttribute, deleteAttribute } = require('../controllers/attributeController');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();

router.get('/', adminAuth, getAttributes);
router.get('/:attribute_name', adminAuth, getAttribute);
router.post('/', adminAuth, createAttribute);
router.put('/:attribute_name', adminAuth, updateAttribute);
router.delete('/:attribute_name', adminAuth, deleteAttribute);

module.exports = router;