var express = require("express");
var router = express.Router();

var Contadores = require("../../controllers/api/contador.js");
var Auth = require("../../controllers/auth.js");

// Recupera um contador
router.get("/:codigo", Auth.isLoggedInUser, Auth.checkLevel(5), (req, res) => {
    Contadores.get(req.params.codigo)
        .then(dados => {

            if (!!dados) {
                res.status(200).jsonp({ valor: dados.valor });
            } else {
                res.status(404).send(`Contador ${req.params.codigo} não existe`)
            }
        })
        .catch(err => res.status(500).send(`Contador ${req.params.codigo} não existe: ${err}`));
});

// Incrementa um contador
router.put("/:codigo", Auth.isLoggedInUser, Auth.checkLevel(5), (req, res) => {
    Contadores.incrementar(req.params.codigo)
        .then(dados => {
            res.status(200).jsonp(dados);
        })
        .catch(err => res.status(500).send(`Contador ${req.params.codigo} não existe: ${err}`));
});

// Cria ou inicializa um contador
router.post("/", Auth.isLoggedInUser, Auth.checkLevel(5), (req, res) => {
    Contadores.criar(req.body)
        .then(dados => {
            res.status(200).jsonp(dados);
        })
        .catch(err => res.status(500).send(`Contador ${req.params.codigo} não foi inicializado: ${err}`));
});


module.exports = router;
