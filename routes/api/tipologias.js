var Auth = require("../../controllers/auth.js");
var Tipologias = require("../../controllers/api/tipologias.js");

var express = require("express");
var router = express.Router();

var validKeys = ["designacao", "estado"];
const { query, validationResult } = require('express-validator');
const { existe, estaEm, verificaTipId, eFS, dataValida, verificaTips, verificaLista, estaAtiva, verificaExisteEnt } = require('../validation')

async function naoExisteSigla(valor) {
    if(await Tipologias.existeSigla(valor))
        return Promise.reject()
    else
        return Promise.resolve()
}

async function naoExisteSiglaSelf(valor, {req}) {
    const id = await Tipologias.existeSiglaId(valor)
    if(id && id != req.params.id)
        return Promise.reject()
    else
        return Promise.resolve()
}

async function naoExisteDesignacao(valor) {
    if(await Tipologias.existeDesignacao(valor))
        return Promise.reject()
    else
        return Promise.resolve()
}

async function naoExisteDesignacaoSelf(valor, {req}) {
    const id = await Tipologias.existeDesignacaoId(valor)
    if(id && id != req.params.id)
        return Promise.reject()
    else
        return Promise.resolve()
}

// Lista todas as tipologias: id, sigla, designacao
router.get("/", Auth.isLoggedInKey, [
    eFS(),
    query("estado")
        .customSanitizer(v => {
            if(!v) v = "Ativa"
            return v
        })
        .isIn(["Ativa", "Inativa", "Harmonização"])
        .withMessage("Valor diferente de 'Ativa', 'Inativa' e 'Harmonização'"),
    existe("query", "designacao").optional(),
    verificaTips("query", "tips").optional(),
    estaEm("query", "info", ["completa"]).optional()
], async (req, res, next) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  var tips = req.query.tips
    ? `?uri IN (${req.query.tips.split(",").map(t => `clav:${t}`).join(",")})`
    : "True";

  var filtro = Object.entries(req.query)
    .filter(([k,v]) => validKeys.includes(k))
    .map(([k, v]) => `?${k} = "${v}"`)
    .concat([tips])
    .join(" && ");

  try {
    res.locals.dados = await Tipologias.listar(filtro);

    if (req.query.info == "completa") {
      await Tipologias.moreInfoList(res.locals.dados);
    }

    res.locals.tipo = "tipologias";
    next();
  } catch (erro) {
    res.status(500).send(`Erro na listagem das tipologias: ${erro}`);
  }
});

// Verifica se a sigla já existe numa entidade
router.get("/sigla", Auth.isLoggedInKey, [
    existe("query", "valor")
], (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  Tipologias.existeSigla(req.query.valor)
    .then(dados => res.jsonp(dados))
    .catch(err => res.status(500).send(`Erro na verificação da sigla: ${err}`));
});

// Verifica se a designação já existe numa entidade
router.get("/designacao", Auth.isLoggedInKey, [
    existe("query", "valor")
], (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  Tipologias.existeDesignacao(req.query.valor)
    .then(dados => res.jsonp(dados))
    .catch(err =>
      res.status(500).send(`Erro na verificação da designação: ${err}`)
    );
});

// Consulta de uma tipologia: sigla, designacao, estado
router.get("/:id", Auth.isLoggedInKey, [
    eFS(),
    verificaTipId('param', 'id'),
    estaEm("query", "info", ["completa"]).optional()
], async (req, res, next) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  try {
    res.locals.dados = await Tipologias.consultar(req.params.id);

    if (req.query.info == "completa") {
      await Tipologias.moreInfo(res.locals.dados);
    }

    res.locals.tipo = "tipologia";
    res.locals.dados ? next() : res.status(404).send(`Erro. A tipologia '${req.params.id}' não existe`);
  } catch (erro) {
    res.status(500).send(`Erro na consulta da tipologia '${req.params.id}': ${erro}`);
  }
});

// Lista as entidades que pertencem à tipologia: sigla, designacao, id
router.get("/:id/elementos", Auth.isLoggedInKey, [
    verificaTipId('param', 'id')
], (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  return Tipologias.elementos(req.params.id)
    .then(dados => res.jsonp(dados))
    .catch(erro => res.status(500).send(`Erro na consulta dos elementos da tipologia '${req.params.id}': ${erro}`));
});

// Lista os processos em que uma tipologia intervem como dono
router.get("/:id/intervencao/dono", Auth.isLoggedInKey, [
    verificaTipId('param', 'id')
], (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  return Tipologias.dono(req.params.id)
    .then(dados => res.jsonp(dados))
    .catch(erro => res.status(500).send(`Erro na consulta dos PNs em que '${req.params.id}' é dono: ${erro}`));
});

// Lista os processos em que uma tipologia intervem como participante
router.get("/:id/intervencao/participante", Auth.isLoggedInKey, [
    verificaTipId('param', 'id')
], (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  return Tipologias.participante(req.params.id)
    .then(dados => res.jsonp(dados))
    .catch(erro => res.status(500).send(`Erro na query sobre as participações da entidade '${req.params.id}': ${erro}`));
});

// Insere uma tipologia na BD
router.post("/", Auth.isLoggedInUser, Auth.checkLevel(4), [
    existe("body", "sigla")
        .custom(naoExisteSigla)
        .withMessage("Sigla já existe"),
    estaEm("body", "estado", ["Ativa", "Harmonização", "Inativa"]),
    existe("body", "designacao")
        .custom(naoExisteDesignacao)
        .withMessage("Designação já existe"),
    verificaLista("body", "entidadesSel").optional(),
    verificaExisteEnt("body", "entidadesSel.*.id")
], (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  Tipologias.criar(req.body)
    .then(dados => res.jsonp(dados))
    .catch(err => res.status(500).send(`Erro na inserção de uma tipologia de entidade: ${err}`));
});

// Atualiza uma tipologia na BD
router.put("/:id", Auth.isLoggedInUser, Auth.checkLevel(4), [
    verificaTipId('param', 'id')
        .custom(estaAtiva)
        .withMessage("Só é possível editar tipologias ativas"),
    existe("body", "sigla")
        .custom(naoExisteSiglaSelf)
        .withMessage("Sigla já existe"),
    estaEm("body", "estado", ["Ativa", "Harmonização", "Inativa"]),
    existe("body", "designacao")
        .custom(naoExisteDesignacaoSelf)
        .withMessage("Designação já existe"),
    verificaLista("body", "entidadesSel"),
    verificaExisteEnt("body", "entidadesSel.*.id")
], (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  Tipologias.atualizar(req.params.id, req.body)
    .then(dados => res.jsonp(dados))
    .catch(err => res.status(500).send(`Erro na inserção de uma tipologia de entidade: ${err}`));
});

module.exports = router;
