var express = require('express');
var router = express.Router();

var Auth = require('../controllers/auth.js');

router.get('/', function(req, res, next) {
	res.render('entidades/listagem', {title: "Entidades"});
});

router.get('/adicionar', Auth.isLoggedIn, function(req, res) {
    res.render('entidades/adicao', {title: "Nova entidade"});
});

router.get('/consultar/:id', function(req, res) {
    res.render('enidades/consulta',{orgID: req.params.id, title: "Dados de entidade"});
});

router.get('/editar/:id', function(req, res) {
    res.render('enidades/edicao',{orgID: req.params.id, title: "Editar entidade"});
});

module.exports = router;
