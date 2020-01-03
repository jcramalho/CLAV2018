var Auth = require('../../controllers/auth.js');
var Ontologia = require('../../controllers/api/ontologia.js');

var express = require('express');
var router = express.Router();

router.get('/', Auth.isLoggedInKey, (req, res) => {
    var format = req.query.fs || req.headers.accept
    Ontologia.exportar(req.query.inferencia, format, 7)
        .then(dados => res.download(dados[0], "clav." + dados[1]))
        .catch(erro => res.status(500).send(`Erro: ${erro}`))
})

router.get('/data', Auth.isLoggedInKey, (req, res) => {
    Ontologia.data()
        .then(dados => res.json(dados))
        .catch(erro => res.status(500).send(`Erro ao obter data da ontologia: ${erro}`))
})

router.get('/descricao', Auth.isLoggedInKey, (req, res) => {
    Ontologia.descricao()
        .then(dados => res.json(dados))
        .catch(erro => res.status(500).send(`Erro ao obter data da ontologia: ${erro}`))
})

module.exports = router;
