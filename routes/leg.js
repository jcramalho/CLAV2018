var express = require('express');
var router = express.Router();

var Auth = require('../controllers/auth.js');

router.get('/', function(req, res, next) {
	res.render('leg/listagem');
});

router.get('/criacao', Auth.isLoggedIn, function(req, res) {
    res.render('leg/adicao');
});

router.get('/:id', function(req, res) {
    res.render('leg/consulta',{legID: req.params.id});
});


module.exports = router;
