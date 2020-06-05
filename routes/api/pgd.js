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

router.get('/', (req, res) => {
  PGD.listar()
      .then(dados => res.jsonp(dados))
      .catch(erro => res.status(404).jsonp("Erro na listagem das PGDs: " + erro))
})


router.get('/lc', (req, res) => {
  PGD.listarLC()
      .then(dados => res.jsonp(dados))
      .catch(erro => res.status(404).jsonp("Erro na listagem das PGDs: " + erro))
})


router.get('/:idPGD', (req, res) => {
  PGD.consultar(req.params.idPGD)
      .then(dados => res.jsonp(dados))
      .catch(erro => res.status(404).jsonp("Erro na listagem das PGDs: " + erro))
})


module.exports = router;
