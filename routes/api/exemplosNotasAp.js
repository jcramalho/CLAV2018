var Auth = require('../../controllers/auth.js');
var ExemplosNotasAp = require('../../controllers/api/exemplosNotasAp.js');
var url = require('url');

var express = require('express');
var router = express.Router();

// Devolve a lista de todas as notas de aplicação: idNota, nota, codigoProc, tituloProc
router.get('/', (req, res) => {
    ExemplosNotasAp.todosExemplosNotasAp()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na recuperação total dos exemplos das notas de aplicação: ${erro}`))
})

module.exports = router;
