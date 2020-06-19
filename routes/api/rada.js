var express = require("express");
var router = express.Router();

var RADA = require("../../controllers/api/rada.js");

const { validationResult } = require('express-validator');
const { existe } = require('../validation')

// Insere um RADA na BD
router.post("/", [
    existe('body', 'triplos')
], (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  RADA.criar(req.body.triplos)
    .then(dados => {
        res.status(200).jsonp(dados);
    })
    .catch(err => res.status(500).send(`Erro na inserção de um RADA: ${err}`));
}); 

router.get("/", (req, res) => {
  RADA.listar()
    .then(dados => {
        res.status(200).jsonp(dados);
    })
    .catch(err => res.status(500).send(`Erro na listagem dos RADA: ${err}`));
}); 

router.get("/:id", (req, res) => {
  RADA.consulta(req.params.id)
    .then(dados => {
        res.status(200).jsonp(dados);
    })
    .catch(err => res.status(500).send(`Erro na consulta do RADA: ${err}`));
}); 

module.exports = router;
