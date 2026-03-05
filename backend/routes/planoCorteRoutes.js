const express = require('express');
const router = express.Router();
const {postPlanoDeCorte, getPlanos, putPlanoDeCorte, deletePlanoDeCorte} = require('../controllers/planoCorteController');

router.post('/', postPlanoDeCorte);
router.get('/', getPlanos);
router.put('/:id', putPlanoDeCorte);
router.delete('/:id', deletePlanoDeCorte);

module.exports = router;