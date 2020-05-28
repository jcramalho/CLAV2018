var Auth = require('../../controllers/auth.js');
var PGD = require('../../controllers/api/pgd.js');
var User = require('../../controllers/api/users.js')
var xml2Json = require('../../controllers/conversor/aeXml2Json')
var xml = require("libxmljs");
var xml2js = require('xml2js')
var fs = require("fs")

const { validationResult } = require('express-validator');
const { existe, estaEm, verificaAEId, vcTipoAE } = require('../validation')

var express = require('express');
var router = express.Router();
var formidable = require("formidable")

router.get('/', Auth.isLoggedInKey, (req, res) => {
  PGD.listar()
      .then(dados => res.jsonp(dados))
      .catch(erro => res.status(404).jsonp("Erro na listagem das PGDs: " + erro))
})

router.get('/:idPGD', Auth.isLoggedInKey, (req, res) => {
  PGD.consultar(req.params.idPGD)
      .then(dados => res.jsonp(dados))
      .catch(erro => res.status(404).jsonp("Erro na listagem das PGDs: " + erro))
})

//Criar uma PGD
router.post('/', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 3.5, 4, 5, 6, 7]), (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  PGD.adicionar(req.body)
      .then(dados => res.jsonp(dados))
      .catch(err => res.status(500).send(`Erro na criação de portaria de gestão de documentos: ${err}`))
      
})

module.exports = router;