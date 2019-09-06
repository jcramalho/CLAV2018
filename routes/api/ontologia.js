var Auth = require('../../controllers/auth.js');
var Ontologia = require('../../controllers/api/ontologia.js');

var express = require('express');
var router = express.Router();

router.get('/data', (req, res) => {
    Ontologia.data()
        .then(dados => res.json(dados))
        .catch(erro => res.status(500).send(`Erro ao obter data da ontologia: ${erro}`))
})

router.get('/descricao', (req, res) => {
    Ontologia.descricao()
        .then(dados => res.json(dados))
        .catch(erro => res.status(500).send(`Erro ao obter data da ontologia: ${erro}`))
})

router.get('/exportar', (req, res) => {
    var format = req.query.format || req.headers.accept
    Ontologia.exportar(req.query.infer, format, 7)
        .then(dados => {
            res.setHeader("content-disposition","attachment; filename=clav." + dados[2])
            res.setHeader('content-type', dados[1])
            res.send(dados[0])
        })
        .catch(erro => res.status(500).send(`Erro: ${erro}`))
})

module.exports = router;
