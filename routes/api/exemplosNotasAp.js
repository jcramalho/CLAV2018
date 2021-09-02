var ExemplosNotasAp = require('../../controllers/api/exemplosNotasAp.js');
var State = require('../../controllers/state.js')
const { validationResult } = require('express-validator');
const { existe } = require('../validation')

var express = require("express");
var router = express.Router();

// Verifica se umo determinado exemplo de notaAplicação já existe
router.get('/exemploNotaAp', [
    existe('query', 'valor')
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }
    if (req.query.classe) {
      State.verificaExemploNATS(req.query.valor, req.query.classe)
        .then((dados) => res.jsonp(dados))
        .catch((erro) =>
          res
            .status(500)
            .send(
              `Erro na verificação de um exemplo de nota de aplicação: ${erro}`
            )
        );
    } else {
      State.verificaExemploNA(req.query.valor)
        .then((dados) => res.jsonp(dados))
        .catch((erro) =>
          res
            .status(500)
            .send(
              `Erro na verificação de um exemplo de nota de aplicação: ${erro}`
            )
        );
    }
  }
);

// Devolve a lista de todas as notas de aplicação: idNota, nota, codigoProc, tituloProc
router.get('/', (req, res) => {
    ExemplosNotasAp.todosExemplosNotasAp()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na recuperação total dos exemplos das notas de aplicação: ${erro}`))
})

module.exports = router;
