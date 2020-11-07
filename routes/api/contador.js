var express = require("express");
var router = express.Router();

var Contadores = require("../../controllers/api/contador.js");
var Auth = require("../../controllers/auth.js");

// Insere um RADA na BD
router.get("/:codigo", Auth.isLoggedInUser, Auth.checkLevel(5), (req, res) => {
    Contadores.listar(req.params.codigo)
        .then(dados => {

            if (!!dados) {
                res.status(200).jsonp({ valor: dados.valor });
            } else {
                res.status(404).send(`Contador ${req.params.codigo} não existe`)
            }
        })
        .catch(err => res.status(500).send(`Contador ${req.params.codigo} não existe: ${err}`));
});

router.put("/:codigo", Auth.isLoggedInUser, Auth.checkLevel(5), (req, res) => {
    Contadores.incrementar(req.params.codigo)
        .then(dados => {
            res.status(200).jsonp(dados);
        })
        .catch(err => res.status(500).send(`Contador ${req.params.codigo} não existe: ${err}`));
});

module.exports = router;
