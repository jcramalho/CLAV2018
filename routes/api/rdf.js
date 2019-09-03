var express = require('express');
var router = express.Router();
const exportRDF = require('../../controllers/api/utils').exportRDF

router.get('/export', (req, res) => {
    exportRDF("false")
        .then(dados => {
            res.setHeader('content-type', 'text/turle')
            res.send(dados)
        })
        .catch(erro => res.status(500).send(`Erro: ${erro}`))
})

module.exports = router;
