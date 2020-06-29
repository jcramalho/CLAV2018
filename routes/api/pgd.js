var Auth = require('../../controllers/auth.js');
var PGD = require('../../controllers/api/pgd.js');

const { validationResult } = require('express-validator');
const { verificaPGDId } = require('../validation')

var express = require('express');
var router = express.Router();

router.get('/', Auth.isLoggedInKey, (req, res) => {
  PGD.listar()
      .then(dados => res.jsonp(dados))
      .catch(erro => res.status(404).jsonp("Erro na listagem das PGDs: " + erro))
})

router.get('/lc', Auth.isLoggedInKey, (req, res) => {
  PGD.listarLC()
      .then(dados => res.jsonp(dados))
      .catch(erro => res.status(404).jsonp("Erro na listagem das PGDs: " + erro))
})


router.get('/rada', Auth.isLoggedInKey, (req, res) => {
    PGD.listarRADA()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(404).jsonp("Erro na listagem das RADAs: " + erro))
})

router.get('/rada/:idRADA', Auth.isLoggedInKey, (req, res) => {
  PGD.consultarRADA(req.params.idRADA)
      .then(dados => res.jsonp(dados))
      .catch(erro => res.status(404).jsonp("Erro na listagem das RADAs: " + erro))
})

router.get('/:idPGD', Auth.isLoggedInKey, [
    verificaPGDId('param', 'idPGD')
], (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  PGD.consultar(req.params.idPGD)
      .then(dados => res.jsonp(dados))
      .catch(erro => res.status(404).jsonp("Erro na listagem das PGDs: " + erro))
})

module.exports = router;
