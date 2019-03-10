var express = require('express');
var router = express.Router();

var Auth = require('../controllers/auth.js');

router.get('/', Auth.isLoggedIn, function(req, res, next){
    res.render('pedidos/pedidos', {title: "Pedidos"});
})

router.get('/submissao', Auth.isLoggedIn, function(req, res){
    res.render('pedidos/submissao', {title: "Submissao de pedido"});
})

router.get('/:codigo', Auth.isLoggedIn, function(req,res){
    res.render('pedidos/consulta', {pedID: req.params.codigo, title: "Consulta de pedido"});
})

module.exports = router;