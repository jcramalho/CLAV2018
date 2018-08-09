var express = require('express');
var router = express.Router();

var Auth = require('../controllers/auth.js');

router.get('/', function(req, res, next) {
	res.render('leg/listagem', {title: "Legislação"});
});

router.get('/adicionar', Auth.isLoggedIn, function(req, res) {
    res.render('leg/adicao', {title: "Novo diploma"});
});

router.get('/consultar/:id', function(req, res) {
    res.render('leg/consulta',{legID: req.params.id, title: "Dados de diploma"});
});

router.get('/editar/:id', function(req, res) {
    res.render('leg/edicao',{legID: req.params.id, title: "Editar diploma"});
});


module.exports = router;
