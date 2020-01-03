var Auth = require('../../controllers/auth.js');
var Calls = require('../../controllers/api/logs.js');
const url = require('url');

var express = require('express');
var router = express.Router();


router.get('/', Auth.isLoggedInUser, Auth.checkLevel(6), async (req, res) => {
    let query = url.parse(req.url, true).query

    if (query.tipo && query.id) {
        Calls.getUserCalls(query.id, query.tipo)
            .then(data => res.jsonp(data))
            .catch(error => res.status(500).send(`Erro ao obter os logs de ${query.tipo} com o id ${query.id}: ${error}`))
    } else {
        Calls.getAllCalls()
            .then(data => res.jsonp(data))
            .catch(error => res.status(500).send(`Erro ao obter os logs: ${error}`))
    }
})

router.get('/:rota', Auth.isLoggedInUser, Auth.checkLevel(6), async (req, res) => {
    let verbo = url.parse(req.url, true).query.verbo

    Calls.getRouteCalls(decodeURIComponent(req.params.rota), verbo)
        .then(data => res.jsonp(data))
        .catch(error => res.status(500).send(`Erro ao obter os logs da rota ${decodeURIComponent(req.params.rota)} com o método ${verbo}: ${error}`))
})

module.exports = router;
