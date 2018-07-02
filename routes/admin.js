var express = require('express');
var router = express.Router();

var Auth = require('../controllers/auth.js');

router.get('/pedidos', function(req, res, next) {
	res.render('admin/gestao_pedidos', {title: "Gestão de Pedidos"});
});
module.exports = router;
