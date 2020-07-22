var Auth = require('../../controllers/auth.js');
var Logs = require('../../controllers/api/logs.js');

var express = require('express');
var router = express.Router();

const { query, oneOf, validationResult } = require('express-validator');
const { existe, estaEm, vcTipoUser, vcVerbo } = require('../validation')

router.get('/', Auth.isLoggedInUser, Auth.checkLevel(6), oneOf([
    [
        estaEm('query', 'tipo', vcTipoUser),
        existe('query', 'id')
    ],
    query("pagina")
        .customSanitizer(v => {
            if(!v) v = 0
            return v
        })
        .isInt({min: 0})
        .withMessage("Não é um número inteiro")
        .toInt()
]), async (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    if (req.query.tipo && req.query.id) {
        Logs.getUserLogs(req.query.id, req.query.tipo)
            .then(data => res.jsonp(data))
            .catch(error => res.status(500).send(`Erro ao obter os logs de ${req.query.tipo} com o id ${req.query.id}: ${error}`))
    } else {
        Logs.getAllLogs(req.query.pagina)
            .then(data => res.jsonp(data))
            .catch(error => res.status(500).send(`Erro ao obter os logs: ${error}`))
    }
})

router.get('/:verbo', Auth.isLoggedInUser, Auth.checkLevel(6), [
    estaEm('param', 'verbo', vcVerbo),
    existe('query', 'rota')
        .bail()
        .isURL({
            require_tld: false,
            require_host: false,
            require_valid_protocol: false
        })
        .withMessage("Não é uma rota válida")
        .customSanitizer(decodeURIComponent)
], async (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Logs.getRouteLogs(req.query.rota, req.params.verbo)
        .then(data => res.jsonp(data))
        .catch(error => res.status(500).send(`Erro ao obter os logs da rota ${req.query.rota} com o método ${req.params.verbo}: ${error}`))
})

// Apaga todos os logs
router.delete('/', Auth.isLoggedInUser, Auth.checkLevel(7), (req, res) => {
    Logs.deleteAllLogs()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na remoção de todos os logs: ${erro}`));
})

module.exports = router;
