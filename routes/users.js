const express = require('express');
const { getUsers, getUser, createUser, updateUser, deleteUser, login } = require('../controllers/userController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();

router.get('/', adminAuth, getUsers);
router.get('/:id', auth, getUser);
router.post('/', createUser);
router.put('/:id', auth, updateUser);
router.delete('/:id', adminAuth, deleteUser);
router.post('/login', login);

module.exports = router;
