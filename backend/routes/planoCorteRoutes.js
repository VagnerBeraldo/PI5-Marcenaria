const express = require('express');
const router = express.Router();
const {
  postPlanoDeCorte, 
  getPlanos, 
  putPlanoDeCorte, 
  deletePlanoDeCorte,
  getPlanoPorOrcamento
} = require('../controllers/planoCorteController');

router.post('/', postPlanoDeCorte);
router.get('/', getPlanos);
router.get('/orcamentos/:id_orcamento', getPlanoPorOrcamento);
router.put('/:id', putPlanoDeCorte);
router.delete('/:id', deletePlanoDeCorte);

module.exports = router;