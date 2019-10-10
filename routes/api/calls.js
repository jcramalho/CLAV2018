var Auth = require('../../controllers/auth.js');
var Calls = require('../../controllers/api/calls.js');

var express = require('express');
var router = express.Router();

router.get('/', Auth.isLoggedInUser, Auth.checkLevel(6), async (req, res) => {
    Calls.getAllCalls()
        .then(data => res.jsonp(data))
        .catch (error => res.status(500).send(`Erro ao obter os logs: ${error}`))
})

router.get('/:type/:id', Auth.isLoggedInUser, Auth.checkLevel(6), async function(req,res){
    Calls.getUserCalls(req.params.id, req.params.type)
        .then(data => res.jsonp(data))
        .catch (error => res.status(500).send(`Erro ao obter os logs de ${req.params.type} com o id ${req.params.id}: ${error}`))
})

router.get('/route/:method/:route', Auth.isLoggedInUser, Auth.checkLevel(6), async function(req,res){
    console.log(decodeURIComponent(req.params.route))
    Calls.getRouteCalls(decodeURIComponent(req.params.route), req.params.method)
        .then(data => res.jsonp(data))
        .catch (error => res.status(500).send(`Erro ao obter os logs da rota ${decodeURIComponent(req.params.route)} com o método ${req.params.method}: ${error}`))
})

module.exports = router;
