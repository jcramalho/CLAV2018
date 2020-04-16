var Auth = require('../../controllers/auth.js');
var AggregateLogs = require('../../controllers/api/aggregateLogs.js');
const { validationResult } = require('express-validator');
const { existe, estaEm, existeDep, vcTipoUser } = require('../validation')

var express = require('express');
var router = express.Router();

router.get('/', Auth.isLoggedInUser, Auth.checkLevel(6), [
    estaEm('query', 'tipo', vcTipoUser)
        .custom(existeDep("query", "id"))
        .withMessage("'id' é undefined, null ou vazio")
        .optional(),
    existe('query', 'id')
        .custom(existeDep("query", "tipo"))
        .withMessage("'tipo' é undefined, null ou vazio")
        .optional()
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }
    
    if(req.query.id && req.query.tipo){
        AggregateLogs.getAggregateLog(req.query.id, req.query.tipo)
            .then(data => res.jsonp(data))
            .catch(error => res.status(500).send(`Erro ao obter os logs agregados de ${req.query.tipo} com o id ${req.query.id}: ${error}`))
    }else{
        AggregateLogs.getAllAggregateLogs()
            .then(data => res.jsonp(data))
            .catch(error => res.status(500).send(`Erro ao obter os logs agregados: ${error}`))
    }
})

router.get('/rotas', Auth.isLoggedInUser, Auth.checkLevel(6), [
    existe('query', 'rota')
        .bail()
        .isURL({
            require_tld: false,
            require_host: false,
            require_valid_protocol: false
        })
        .withMessage("Não é uma rota válida")
        .customSanitizer(decodeURIComponent)
        .optional()
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    if(req.query.rota){
        AggregateLogs.getAggregateLogRoute(req.query.rota)
            .then(data => res.jsonp(data))
            .catch(error => res.status(500).send(`Erro ao obter os logs agregados para a rota ${req.query.rota}: ${error}`))
    }else{
        AggregateLogs.getAggregateLogRoutes()
            .then(data => res.jsonp(data))
            .catch(error => res.status(500).send(`Erro ao obter os logs agregados das rotas: ${error}`))
    }
})

router.get('/total', Auth.isLoggedInUser, Auth.checkLevel(6), (req, res) => {
    AggregateLogs.totalAggregateLogs()
        .then(data => res.jsonp(data))
        .catch(error => res.status(500).send(`Erro ao obter o total de chamadas à API: ${error}`))
})

module.exports = router;
