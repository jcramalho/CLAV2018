var Logging = require('../../controllers/logging');
var Auth = require('../../controllers/auth.js');
var AutosEliminacao = require('../../controllers/api/autosEliminacao.js');

var express = require('express');
var router = express.Router();

router.get('/', (req, res) => {
    AutosEliminacao.listar()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(404).jsonp("Erro na listagem dos AE: " + erro))
})

// Devolve a lista de termos de um VC: idtermo, termo
router.get('/:id', function (req, res) {
    AutosEliminacao.consultar(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(404).jsonp("Erro na consulta do AE "+req.params.id+": " + erro))
})

//Importar um AE
router.post('/:tipo', (req, res) => {
    var tipo = req.params.tipo
    if(tipo==="PGD") tipo = "AE PGD"
    else if(tipo === "RADA") tipo = "AE RADA"
    else tipo = "AE PGD/LC"
    AutosEliminacao.importarTS(req.body, tipo, req.body.token)
            .then(dados => {
                if(dados) res.jsonp("AE PGD adicionado com sucesso")
                else res.status(404).jsonp("Erro na adição do AE "+req.body.codigo)
            })
            .catch(erro => res.status(404).jsonp("Erro na adição do AE "+req.body.codigo+": " + erro))
})


module.exports = router;
