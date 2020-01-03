var Auth = require('../../controllers/auth.js');
var Calls = require('../../controllers/api/logs.js');

var express = require('express');
var router = express.Router();


router.get('/', Auth.isLoggedInUser, Auth.checkLevel(6), async (req, res) => {

    if (req.query.tipo && req.query.id) {
        Calls.getUserCalls(req.query.id, req.query.tipo)
            .then(data => res.jsonp(data))
            .catch(error => res.status(500).send(`Erro ao obter os logs de ${req.query.tipo} com o id ${req.query.id}: ${error}`))
    } else {
        Calls.getAllCalls()
            .then(data => res.jsonp(data))
            .catch(error => res.status(500).send(`Erro ao obter os logs: ${error}`))
    }
})

router.get('/:rota', Auth.isLoggedInUser, Auth.checkLevel(6), async (req, res) => {

    Calls.getRouteCalls(decodeURIComponent(req.params.rota), req.query.verbo)
        .then(data => res.jsonp(data))
        .catch(error => res.status(500).send(`Erro ao obter os logs da rota ${decodeURIComponent(req.params.rota)} com o método ${req.query.verbo}: ${error}`))

})

module.exports = router;
