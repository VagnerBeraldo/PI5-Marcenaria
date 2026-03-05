const express = require('express');
const router = express.Router();
const planoCorteController = require('./planoCorteController');

router.post('/', planoCorteController.criarPlano);

module.exports = router;