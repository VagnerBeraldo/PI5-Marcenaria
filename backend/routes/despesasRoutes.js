const express = require('express');
const router = express.Router();
const { getDespesas, postDespesas } = require('../controllers/despesasController');

router.get('/', getDespesas);
router.post('/', postDespesas);

module.exports = router;