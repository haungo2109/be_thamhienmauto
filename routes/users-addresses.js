const express = require('express');
const { getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } = require('../controllers/addressController');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

router.get('/', getAddresses);
router.post('/', createAddress);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);
router.patch('/:id/set-default', setDefaultAddress);

module.exports = router;
