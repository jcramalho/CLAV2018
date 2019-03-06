var express = require('express');
var router = express.Router();

var Auth = require('../controllers/auth.js');

router.get('/', function(req, res, next) {
	res.render('classes/classesTree', {title: "Lista Consolidada"});
});

router.get('/adicionar', Auth.isLoggedIn, function(req, res) {
    res.render('classes/classe-create-2', {title: "Nova classe", sidebar: true});
});

router.get('/:id', function(req, res) {
    res.render('classes/classe-get');
});

router.get('/consultar/:id', function(req, res) {
    res.render('classes/classe-get');
});

router.get('/editar/:id', Auth.isLoggedIn, function(req, res) {
    res.render('classes/edicao',{title: "Editar classe", classID: req.params.id});
});


module.exports = router;
