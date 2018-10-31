var express = require('express');
var router = express.Router();

var Logging = require('../../controllers/logging');
var Auth = require('../../controllers/auth.js');
var Pedidos = require('../../controllers/api/pedidos.js');

router.get('/', Pedidos.listar);
router.post('/', Pedidos.criar);

router.get('/:numero', Pedidos.detalhar);
// router.put('/:numero', Pedidos.alterar);
// router.delete('/:numero', Pedidos.apagar);

module.exports = router;