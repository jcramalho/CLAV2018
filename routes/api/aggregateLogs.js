var Auth = require('../../controllers/auth.js');
var AggregateLogs = require('../../controllers/api/aggregateLogs.js');
const { validationResult } = require('express-validator');
const { existe, estaEm, existeDep } = require('../validation')

var express = require('express');
var router = express.Router();

router.get('/', Auth.isLoggedInUser, Auth.checkLevel(6), [
    estaEm('query', 'tipo', ['User', 'Chave'])
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

module.exports = router;
