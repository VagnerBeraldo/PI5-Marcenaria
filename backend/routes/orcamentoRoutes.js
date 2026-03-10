const express = require('express');
const router = express.Router();

// 1. Adicionamos a nova função aqui na importação
const { 
  postOrcamento, 
  getOrcamentos, 
  putOrcamento, 
  deleteOrcamento, 
  getOrcamentosPorCliente 
} = require('../controllers/orcamentoController');

router.post('/', postOrcamento);
router.get('/', getOrcamentos);
router.put('/:id', putOrcamento);
router.delete('/:id', deleteOrcamento);

// 2. Chamamos a função diretamente, sem o "orcamentoController." na frente
router.get('/cliente/:id_cliente', getOrcamentosPorCliente);

module.exports = router;