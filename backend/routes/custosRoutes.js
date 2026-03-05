const express = require('express');
const router = express.Router();
const { getCusto, postCusto, putCusto, deleteCusto } = require('../controllers/custoMaterialController');

router.get('/', getCusto);
router.post('/', postCusto);
router.put('/:id', putCusto);
router.delete('/:id', deleteCusto);

module.exports = router;