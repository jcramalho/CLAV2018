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
        Logs.getAllLogs()
            .then(data => res.jsonp(data))
            .catch(error => res.status(500).send(`Erro ao obter os logs: ${error}`))
    }
})

router.get('/:rota', Auth.isLoggedInUser, Auth.checkLevel(6), async (req, res) => {
    if(req.query.verbo){
        Logs.getRouteLogs(decodeURIComponent(req.params.rota), req.query.verbo)
            .then(data => res.jsonp(data))
            .catch(error => res.status(500).send(`Erro ao obter os logs da rota ${decodeURIComponent(req.params.rota)} com o método ${req.query.verbo}: ${error}`))
    }else{
        res.status(500).send(`Erro ao obter os logs: precisa de indicar o verbo da rota (GET, POST, PUT ou DELETE) na query string 'verbo'.`)
    }   
})

module.exports = router;
