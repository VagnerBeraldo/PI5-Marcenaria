const express = require('express');
const router = express.Router();
const { 
  getCusto, 
  postCusto, 
  putCusto, 
  deleteCusto, 
  getCustoPorId
} = require('../controllers/custoMaterialController');

router.get('/', getCusto);
router.get('/:id', getCustoPorId);
router.post('/', postCusto);
router.put('/:id', putCusto);
router.delete('/:id', deleteCusto);

module.exports = router;