var express = require('express');
var router = express.Router();
const exportRDF = require('../../controllers/api/utils').exportRDF

router.get('/export', (req, res) => {
    var format = req.query.format || req.headers.accept 
    exportRDF(req.query.infer, format, 7)
        .then(dados => {
            res.setHeader('content-type', dados[1])
            res.send(dados[0])
        })
        .catch(erro => res.status(500).send(`Erro: ${erro}`))
})

module.exports = router;
