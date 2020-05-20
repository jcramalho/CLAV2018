var NotasAp = require('../../controllers/api/notasAp.js');
var State = require('../../controllers/state.js')

var express = require('express');
var router = express.Router();

const { validationResult } = require('express-validator');
const { existe } = require('../validation')

// Verifica se uma determinada notaAplicação já existe
router.get('/notaAp', [
    existe("query", "valor")
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    State.verificaNA(req.query.valor)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na verificação de uma nota de aplicação: ${erro}`))
})

// Devolve a lista de todas as notas de aplicação: idNota, nota, codigoProc, tituloProc
router.get('/', (req, res) => {
    NotasAp.todasNotasAp()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na recuperação total das notas de aplicação: ${erro}`))
})

module.exports = router;
