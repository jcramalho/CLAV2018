var Auth = require('../../controllers/auth.js');
var NotasAp = require('../../controllers/api/notasAp.js');
var url = require('url');

var express = require('express');
var router = express.Router();

// Devolve a lista de todas as notas de aplicação: idNota, nota, codigoProc, tituloProc
router.get('/', (req, res) => {
    NotasAp.todasNotasAp()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na recuperação total das notas de aplicação: ${erro}`))
})

module.exports = router;
