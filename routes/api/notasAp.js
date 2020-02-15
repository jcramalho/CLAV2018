var Auth = require('../../controllers/auth.js');
var NotasAp = require('../../controllers/api/notasAp.js');
var State = require('../../controllers/state.js')

var express = require('express');
var router = express.Router();

// Verifica se uma determinada notaAplicação já existe
router.get('/:notaAp', Auth.isLoggedInKey, (req, res) => {
    State.verificaNA(req.params.notaAp)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na verificação de uma nota de aplicação: ${erro}`))
})

// Devolve a lista de todas as notas de aplicação: idNota, nota, codigoProc, tituloProc
router.get('/', Auth.isLoggedInKey, (req, res) => {
    NotasAp.todasNotasAp()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na recuperação total das notas de aplicação: ${erro}`))
})

module.exports = router;
