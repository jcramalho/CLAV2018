var TermosIndice = require("../../controllers/api/termosIndice.js");
var State = require("../../controllers/state.js");

var express = require("express");
var router = express.Router();

const { validationResult } = require("express-validator");
const { existe } = require("../validation");

// Devolve a lista dos termos de índice ou processa uma query
router.get('/', function(req, res) {
    TermosIndice.listar()
        .then((dados) => res.jsonp(dados))
        .catch((erro) => res.status(500).send(`Erro na listagem dos termos de índice: ${erro}`))
})

// Devolve o número de termos na BD
router.get('/quantos', function(req, res) {
	TermosIndice.contar()
		.then((dados) => res.jsonp(dados[0].num))
		.catch((erro) => res.status(500).send(`Erro na contagem dos termos de índice: ${erro}`))
})

// Verifica se termo indice existe
router.get('/termoIndice', [
    existe("query", "valor")
], function(req, res) {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }
    if (req.query.classe) {
      State.verificaTITS(req.query.valor, req.query.classe)
        .then((dados) => res.jsonp(dados))
        .catch((erro) =>
          res.status(500).send(`Erro ao verificar se um TI existe: ${erro}`)
        );
    } else {
      State.verificaTI(req.query.valor)
        .then((dados) => res.jsonp(dados))
        .catch((erro) =>
          res.status(500).send(`Erro ao verificar se um TI existe: ${erro}`)
        );
    }
  }
);

module.exports = router;
