var express = require('express');
var router = express.Router();

var Auth = require('../controllers/auth.js');

router.get('/', function(req, res, next) {
	res.render('tabsSel/listagem');
});

router.get('/escolha_processos', function(req, res) {
    res.render('tabsSel/escolha_processos');
});

router.get('/escolha', function(req, res) {
    res.render('tabsSel/escolha');
});

router.get('/passos', function(req, res) {
    res.render('tabsSel/passos');
});

router.get('/alteracao', function(req, res) {
    res.render('tabsSel/alteracao');
});

router.get('/adicionar', Auth.isLoggedIn, function(req, res) {
    res.render('tabsSel/adicao');
});

router.get('/consultar/:id', function(req, res) {
    res.render('tabsSel/consulta',{tabID: req.params.id});
});

module.exports = router;
