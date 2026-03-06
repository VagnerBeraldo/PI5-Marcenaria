const express = require('express');
const router = express.Router();
const { postOrcamento, getOrcamentos, putOrcamento, deleteOrcamento } = require('../controllers/orcamentoController');

router.post('/', postOrcamento);
router.get('/', getOrcamentos);
router.put('/:id', putOrcamento);
router.delete('/:id', deleteOrcamento);

module.exports = router;