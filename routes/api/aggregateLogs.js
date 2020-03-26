var Auth = require('../../controllers/auth.js');
var AggregateLogs = require('../../controllers/api/aggregateLogs.js');
const { validationResult } = require('express-validator');
const { existe, estaEm } = require('../validation')

var express = require('express');
var router = express.Router();

router.get('/', Auth.isLoggedInUser, Auth.checkLevel(6), [
    estaEm('query', 'tipo', ['User', 'Chave']),
    existe('query', 'id')
], (req, res) => {
    
    try {
        validationResult(req).throw() //throw error if parameters isn't valid

        AggregateLogs.getAggregateLog(req.query.id, req.query.tipo)
            .then(data => res.jsonp(data))
            .catch(error => res.status(500).send(`Erro ao obter os logs agregados de ${req.query.tipo} com o id ${req.query.id}: ${error}`))
    }catch(err){
        AggregateLogs.getAllAggregateLogs()
            .then(data => res.jsonp(data))
            .catch(error => res.status(500).send(`Erro ao obter os logs agregados: ${error}`))
    }
})

module.exports = router;
