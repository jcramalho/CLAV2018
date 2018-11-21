var express = require('express');
var router = express.Router();

var Auth = require('../controllers/auth.js');

router.get('/', function(req, res, next) {
	res.render('tipologias/listagem', {title: "Tipologias"});
});

router.get('/adicionar', Auth.isLoggedIn, function(req, res) {
    res.render('tipologias/adicao', {title: "Nova tipologia"});
});

router.get('/:id', function(req, res) {
    res.render('tipologias/consulta',{orgID: req.params.id, title: "Dados de tipologia"});
});

router.get('/editar/:id', Auth.isLoggedIn, function(req, res) {
    res.render('tipologias/edicao',{orgID: req.params.id, title: "Editar tipologia"});
});

module.exports = router;
