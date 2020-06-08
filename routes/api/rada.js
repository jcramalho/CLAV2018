var express = require("express");
var router = express.Router();

var RADA = require("../../controllers/api/rada.js");
var Auth = require("../../controllers/auth.js");

// Insere um RADA na BD
router.post("/", Auth.isLoggedInUser, Auth.checkLevel(4), (req, res) => {
  RADA.criar(req.body.triplos)
    .then(dados => {
        res.status(200).jsonp(dados);
    })
    .catch(err => res.status(500).send(`Erro na inserção de um RADA: ${err}`));
}); 

router.get("/", Auth.isLoggedInUser, Auth.checkLevel(4), (req, res) => {
  RADA.listar()
    .then(dados => {
        res.status(200).jsonp(dados);
    })
    .catch(err => res.status(500).send(`Erro na listagem dos RADA: ${err}`));
}); 

router.get("/:id", Auth.isLoggedInUser, Auth.checkLevel(4), (req, res) => {
  RADA.consulta(req.params.id)
    .then(dados => {
        res.status(200).jsonp(dados);
    })
    .catch(err => res.status(500).send(`Erro na consulta do RADA: ${err}`));
}); 

module.exports = router;