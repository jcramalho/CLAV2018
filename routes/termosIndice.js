var express = require('express');
var router = express.Router();

var Auth = require('../controllers/auth.js');

router.get('/', function(req, res, next) {
	res.render('termosIndice/listagem', {title: "Termos de Índice"});
});

router.get('/adicionar', Auth.isLoggedIn, function(req, res) {
    res.render('termosIndice/adicao', {title: "Novo termo de indice"});
});
/*
router.get('/consultar/:id', function(req, res) {
    res.render('termosIndice/consulta',{tiID: req.params.id});
});
*/
module.exports = router;
