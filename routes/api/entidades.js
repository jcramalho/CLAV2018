var Entidades = require("../../controllers/api/entidades.js");
var url = require("url");

var express = require("express");
var router = express.Router();

var validKeys = ["sigla", "designacao", "internacional", "sioe", "estado"];
const { query, body, validationResult } = require('express-validator');
const { existe, estaEm, verificaEntId, eFS, verificaEnts, dataValida, verificaLista, estaAtiva, verificaExisteTip, vcBoolean, vcEstado, vcEntsProcs, vcEntsInfo } = require('../validation')

async function naoExisteSigla(valor) {
    if(await Entidades.existeSigla(valor))
        return Promise.reject()
    else
        return Promise.resolve()
}

async function naoExisteSiglaSelf(valor, {req}) {
    const id = await Entidades.existeSiglaId(valor)
    if(id && id != req.params.id)
        return Promise.reject()
    else
        return Promise.resolve()
}

async function naoExisteDesignacao(valor) {
    if(await Entidades.existeDesignacao(valor))
        return Promise.reject()
    else
        return Promise.resolve()
}

async function naoExisteDesignacaoSelf(valor, {req}) {
    const id = await Entidades.existeDesignacaoId(valor)
    if(id && id != req.params.id)
        return Promise.reject()
    else
        return Promise.resolve()
}

// Lista todas as entidades: id, sigla, designacao, internacional
router.get("/", [
    eFS(),
    existe("query", "sigla").optional(),
    existe("query", "designacao").optional(),
    estaEm("query", "internacional", vcBoolean).optional(),
    query("sioe", "Valor inválido, SIOE é um número").optional().matches(/^\d+$/),
    estaEm("query", "estado", vcEstado).optional(),
    verificaEnts("query", "ents").optional(),
    estaEm("query", "processos", vcEntsProcs).optional(),
    estaEm("query", "info", vcEntsInfo).optional()
], async (req, res, next) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  var queryData = url.parse(req.url, true).query;
  var ents = queryData.ents
    ? `?uri IN (${queryData.ents.split(",").map(t => `clav:${t}`).join(",")})`
    : "True";

  var filtro = Object.entries(queryData)
    .filter(([k, v]) => validKeys.includes(k))
    .map(([k, v]) => k == "internacional" && v == "Não"
                        ? `?${k} != "Sim"`
                        : `?${k} = "${v}"`)
    .concat([ents])
    .join(" && ");

  // api/entidades?processos=com
  if (queryData.processos && queryData.processos == "com") {
    try {
      res.locals.dados = await Entidades.listarComPNs(filtro);

      if (req.query.info == "completa") {
        await Entidades.moreInfoList(res.locals.dados);
      }

      res.locals.tipo = "entidades";
      next();
    } catch (erro) {
      res.status(500).send(`Erro na listagem das entidades com PNs associados: ${erro}`);
    }
  }
  // api/entidades?processos=sem
  else if (queryData.processos && queryData.processos == "sem") {
    try {
      res.locals.dados = await Entidades.listarSemPNs(filtro);

      if (req.query.info == "completa") {
        await Entidades.moreInfoList(res.locals.dados);
      }

      res.locals.tipo = "entidades";
      next();
    } catch (erro) {
      res.status(500).send(`Erro na listagem das entidades sem PNs associados: ${erro}`);
    }
  } else {
    try {
      res.locals.dados = await Entidades.listar(filtro);

      if (req.query.info == "completa") {
        await Entidades.moreInfoList(res.locals.dados);
      }

      res.locals.tipo = "entidades";
      next();
    } catch (erro) {
      res.status(500).send(`Erro na listagem das entidades: ${erro}`);
    }
  }
});

// Verifica se a sigla já existe numa entidade
router.get("/sigla", [
    existe("query", "valor")
], (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  Entidades.existeSigla(req.query.valor)
    .then(dados => res.jsonp(dados))
    .catch(err => res.status(500).send(`Erro na verificação da sigla: ${err}`));
});

// Verifica se a designação já existe numa entidade
router.get("/designacao", [
    existe("query", "valor")
], (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  Entidades.existeDesignacao(req.query.valor)
    .then(dados => res.jsonp(dados))
    .catch(err =>
      res.status(500).send(`Erro na verificação da designação: ${err}`)
    );
});

// Consulta de uma entidade: sigla, designacao, estado, internacional
router.get("/:id", [
    eFS(),
    verificaEntId('param', 'id'),
    estaEm("query", "info", vcEntsInfo).optional()
], async (req, res, next) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  try {
    res.locals.dados = await Entidades.consultar(req.params.id);

    if (req.query.info == "completa") {
      await Entidades.moreInfo(res.locals.dados);
    }

    res.locals.tipo = "entidade";
    res.locals.dados ? next() : res.status(404).send(`Erro. A entidade '${req.params.id}' não existe`);
  } catch (erro) {
    res.status(500).send(`Erro na consulta da entidade '${req.params.id}': ${erro}`);
  }
});

// Lista as tipologias a que uma entidade pertence: id, sigla, designacao
router.get("/:id/tipologias", [
    verificaEntId('param', 'id')
], (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  return Entidades.tipologias(req.params.id)
    .then(dados => res.jsonp(dados))
    .catch(erro => res.status(500).send(`Erro na consulta das tipologias a que '${req.params.id}' pertence: ${erro}`));
});

// Lista os processos em que uma entidade intervem como dono
router.get("/:id/intervencao/dono", [
    verificaEntId('param', 'id')
], (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  return Entidades.dono(req.params.id)
    .then(dados => res.jsonp(dados))
    .catch(erro => res.status(500).send(`Erro na consulta dos PNs em que '${req.params.id}' é dono: ${erro}`));
});

// Lista os processos em que uma entidade intervem como participante
router.get("/:id/intervencao/participante", [
    verificaEntId('param', 'id')
], (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  return Entidades.participante(req.params.id)
    .then(dados => res.jsonp(dados))
    .catch(erro => res.status(500).send(`Erro na query sobre as participações da entidade '${req.params.id}': ${erro}`));
});

// Insere uma entidade na BD
router.post("/", [
    existe('body', 'sigla')
        .custom(naoExisteSigla)
        .withMessage("Sigla já existe"),
    estaEm('body', "estado", vcEstado),
    existe('body', 'designacao')
        .custom(naoExisteDesignacao)
        .withMessage("Designação já existe"),
    estaEm("body", "internacional", vcBoolean).optional(),
    body("sioe", "Valor inválido, SIOE é um número")
        .optional()
        .matches(/^\d+$/),
    dataValida('body', 'dataCriacao').optional(),
    verificaLista("body", "tipologiasSel").optional(),
    verificaExisteTip("body", "tipologiasSel.*.id")
], (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  Entidades.criar(req.body)
    .then(dados => res.jsonp(dados))
    .catch(err => res.status(500).send(`Erro na inserção de uma entidade: ${err}`));
});

// Atualiza uma entidade na BD
router.put("/:id", [
    verificaEntId('param', 'id')
        .custom(estaAtiva)
        .withMessage("Só é possível editar entidades ativas"),
    existe('body', 'sigla')
        .custom(naoExisteSiglaSelf)
        .withMessage("Sigla já existe"),
    estaEm('body', "estado", vcEstado),
    existe('body', 'designacao')
        .custom(naoExisteDesignacaoSelf)
        .withMessage("Designação já existe"),
    estaEm("body", "internacional", vcBoolean).optional(),
    body("sioe", "Valor inválido, SIOE é um número")
        .optional()
        .matches(/^\d+$/),
    dataValida('body', 'dataCriacao').optional(),
    dataValida('body', 'dataExtincao').optional(),
    verificaLista("body", "tipologiasSel"),
    verificaExisteTip("body", "tipologiasSel.*.id")
], (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  Entidades.atualizar(req.params.id, req.body)
    .then(dados => res.jsonp(dados))
    .catch(err => res.status(500).send(`Erro na atualização de uma entidade: ${err}`));
});

// Extinguir uma entidade na BD
router.put("/:id/extinguir", [
    verificaEntId('param', 'id'),
    dataValida('body', 'dataExtincao')
], (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  Entidades.extinguir(req.params.id, req.body.dataExtincao)
    .then(dados => res.jsonp(dados))
    .catch(err => res.status(500).send(`Erro na inserção de uma entidade: ${err}`));
});

module.exports = router;
