var express = require('express');
var router = express.Router();

var Auth = require('../controllers/auth.js');

router.get('/', Auth.isLoggedIn, Auth.checkLevel1, function(req, res, next) {
	res.render('entidades/listagem', {title: "Entidades"});
});

router.get('/adicionar', Auth.isLoggedIn, function(req, res) {
    res.render('entidades/adicao', {title: "Nova entidade"});
});

router.get('/:id', Auth.isLoggedIn, Auth.checkLevel1, function(req, res) {
    res.render('entidades/consulta',{orgID: req.params.id, title: "Dados de entidade"});
});

router.get('/editar/:id', Auth.isLoggedIn, function(req, res) {
    res.render('entidades/edicao',{orgID: req.params.id, title: "Editar entidade"});
});

module.exports = router;
