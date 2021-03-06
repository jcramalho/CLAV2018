var express = require("express");
var router = express.Router();

var RADA = require("../../controllers/api/rada.js");
var PGD = require('../../controllers/api/pgd.js');
var Auth = require("../../controllers/auth.js");

const { validationResult } = require('express-validator');
const { existe, verificaPGDRADAId } = require('../validation')

// Revoga um RADA que está na BD
router.put("/revogar/:rada", Auth.isLoggedInUser, Auth.checkLevel(5), [existe('body', 'dataRevogacao')
], (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(422).jsonp(errors.array())
    }
    RADA.revogar(req.params.rada, req.body.dataRevogacao)
        .then(dados => {
            res.status(200).jsonp(dados);
        })
        .catch(err => res.status(500).send(`Erro na revogação do RADA: ${err}`));
});

// Insere um RADA na BD
router.post("/", Auth.isLoggedInUser, Auth.checkLevel(5), [
    existe('body', 'triplos')
], (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(422).jsonp(errors.array())
    }

    RADA.criar(req.body.triplos)
        .then(dados => {
            res.status(200).jsonp(dados);
        })
        .catch(err => res.status(500).send(`Erro na inserção de um RADA: ${err}`));
});


router.get('/old/:idRADA', /*Auth.isLoggedInKey,*/ [
    verificaPGDRADAId('param', 'idRADA')
], (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(422).jsonp(errors.array())
    }

    PGD.consultarRADA(req.params.idRADA)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(404).jsonp("Erro na listagem das RADAs: " + erro))
})

router.get('/old', /*Auth.isLoggedInKey,*/ (req, res) => {
    PGD.listarRADA()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(404).jsonp("Erro na listagem das RADAs: " + erro))
})

router.get("/:id", /* Auth.isLoggedInUser, Auth.checkLevel([0, 1, 2, 3, 3.5, 4, 5, 6, 7]),*/ (req, res) => {
    RADA.consulta(req.params.id)
        .then(dados => {
            res.status(200).jsonp(dados);
        })
        .catch(err => res.status(500).send(`Erro na consulta do RADA: ${err}`));
});

router.get("/", /* Auth.isLoggedInUser, Auth.checkLevel([0, 1, 2, 3, 3.5, 4, 5, 6, 7]), */ (req, res) => {
    RADA.listar()
        .then(dados => {
            res.status(200).jsonp(dados);
        })
        .catch(err => res.status(500).send(`Erro na listagem dos RADA: ${err}`));
});
module.exports = router;
