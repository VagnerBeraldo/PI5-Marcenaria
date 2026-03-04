const express = require('express');
const router = express.Router();
const { getDespesas, postDespesas, putDespesas, deleteDespesas } = require('../controllers/despesasController');

router.get('/', getDespesas);
router.post('/', postDespesas);
router.put('/:id', putDespesas);
router.delete('/:id', deleteDespesas);

module.exports = router;