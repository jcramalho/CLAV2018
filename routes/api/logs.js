var Auth = require('../../controllers/auth.js');
var Logs = require('../../controllers/api/logs.js');

var express = require('express');
var router = express.Router();


router.get('/', Auth.isLoggedInUser, Auth.checkLevel(6), async (req, res) => {

    if (req.query.tipo && req.query.id) {
        Logs.getUserLogs(req.query.id, req.query.tipo)
            .then(data => res.jsonp(data))
            .catch(error => res.status(500).send(`Erro ao obter os logs de ${req.query.tipo} com o id ${req.query.id}: ${error}`))
    } else {
        var page = req.query.pagina ? req.query.pagina : 0
        Logs.getAllLogs(page)
            .then(data => res.jsonp(data))
            .catch(error => res.status(500).send(`Erro ao obter os logs: ${error}`))
    }
})

router.get('/:verbo', Auth.isLoggedInUser, Auth.checkLevel(6), async (req, res) => {
    if(req.query.rota){
        Logs.getRouteLogs(decodeURIComponent(req.query.rota), req.params.verbo)
            .then(data => res.jsonp(data))
            .catch(error => res.status(500).send(`Erro ao obter os logs da rota ${decodeURIComponent(req.query.rota)} com o método ${req.params.verbo}: ${error}`))
    }else{
        res.status(500).send(`Erro ao obter os logs: precisa de indicar a rota na query string 'rota'.`)
    }   
})

module.exports = router;
