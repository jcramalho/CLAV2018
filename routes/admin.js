var express = require('express');
var router = express.Router();
var Auth = require('../controllers/auth.js');

router.get('/pedidos', Auth.isLoggedIn, function(req, res) {
	res.render('admin/gestao_pedidos', {title: "Gestão de Pedidos"});
});

router.get('/nova_chave', Auth.isLoggedIn, function(req, res) {
	res.render('admin/chave_api', {title: "Registo nova chave API"});
});

router.get('/listagem_chaves', Auth.isLoggedIn, function(req, res) {
	res.render('admin/listagem_chaves', {title: "Listagem chaves API"});
});

module.exports = router;
