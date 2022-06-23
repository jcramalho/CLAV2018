var Leg = require("../../controllers/api/leg.js");
var url = require("url");
var State = require("../../controllers/state.js");

var express = require("express");
var router = express.Router();

const { validationResult } = require('express-validator');
const { existe, estaEm, eFS, dataValida, verificaLegId, verificaLista, estaAtiva, verificaExisteEnt, verificaExisteClasse, vcLegTipo, vcFonte, vcLegEstado, vcLegProcs, vcLegInfo } = require('../validation')

async function naoExisteNumero(valor) {
    if(await Leg.existe(valor))
        return Promise.reject()
    else
        return Promise.resolve()
}

async function naoExisteNumeroSelf(valor, {req}) {
    const id = await Leg.existeId(valor)
    if(id && id != req.params.id)
        return Promise.reject()
    else
        return Promise.resolve()
}

// Lista todos os documentos legislativos: id, data, numero, tipo, sumario, entidades
router.get("/", [
    eFS(),
    estaEm("query", "estado", vcLegEstado).optional(),
    estaEm("query", "fonte", vcFonte).optional(),
    estaEm("query", "processos", vcLegProcs).optional(),
    estaEm("query", "info", vcLegInfo).optional()
], async (req, res, next) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  var queryData = url.parse(req.url, true).query;

  // api/legislacao?estado=
  if (queryData.estado) {
    try {
      res.locals.dados = await Leg.listarPorEstado(queryData.estado);

      if (req.query.info == "completa") {
        await Leg.moreInfoList(res.locals.dados);
      }

      res.locals.tipo = "legislacoes";
      next();
    } catch (erro) {
      res.status(500).send(`Erro na listagem dos diplomas ${queryData.estado}: ${erro}`);
    }
  }
  // api/legislacao?processos=
  else if (queryData.processos) {
    try {
      if(queryData.processos == "com"){
          res.locals.dados = await Leg.listarComPNs();
      }else{
          res.locals.dados = await Leg.listarSemPNs();
      }

      if (req.query.info == "completa") {
        await Leg.moreInfoList(res.locals.dados);
      }

      res.locals.tipo = "legislacoes";
      next();
    } catch (erro) {
      res.status(500).send(`Erro na listagem dos diplomas ${queryData.processos} PNs associados: ${erro}`);
    }
  }
  // api/legislacao?fonte=
  else if (queryData.fonte) {
    try {
      res.locals.dados = await Leg.listarFonte(queryData.fonte);

      if (req.query.info == "completa") {
        await Leg.moreInfoList(res.locals.dados);
      }

      res.locals.tipo = "legislacoes";
      next();
    } catch (erro) {
      res.status(500).send(`Erro na listagem de legislações com fonte ${queryData.fonte}: ${erro}`);
    }
  } else {
    try {
      res.locals.dados = State.getLegislacoes();

      if (req.query.info == "completa") {
        await Leg.moreInfoList(res.locals.dados);
      }

      res.locals.tipo = "legislacoes";
      next();
    } catch (erro) {
      res.status(500).send(`Erro na listagem dos diplomas legislativos: ${erro}`);
    }
  }
});

// Verifica a existência do número de um diploma/legislacao
router.get("/numero", [
    existe("query", "valor")
], (req, res, next) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  Leg.existe(req.query.valor)
    .then(dados => res.jsonp(dados))
    .catch(err => res.status(500).send(`Erro na verificação do número do diploma: ${err}`));
});

// Devolve a lista de legislações do tipo Portaria
router.get("/portarias", (req, res) => {
  return Leg.portarias()
    .then(dados => res.jsonp(dados))
    .catch(erro => res.status(500).send(`Erro na consulta da leg de portarias: ${erro}`));
});

// Devolve a informação associada a um documento legislativo: tipo data numero sumario link entidades
router.get("/:id", [
    verificaLegId("param", "id"),
    eFS(),
    estaEm("query", "info", vcLegInfo).optional()
], async (req, res, next) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  try {
    //res.locals.dados = await Leg.consultar(req.params.id)
    res.locals.dados = State.getLegislacao(req.params.id);

    if (req.query.info == "completa") {
      await Leg.moreInfo(res.locals.dados);
    }

    res.locals.tipo = "legislacao";
    res.locals.dados ? next() : res.status(404).send(`Erro. A legislação '${req.params.id}' não existe`);
  } catch (erro) {
    res.status(500).send(`Erro na consulta da leg ${req.params.id}: ${erro}`);
  }
});

// Devolve a lista de processos regulados pelo documento: id, codigo, titulo
router.get("/:id/processos", [
    verificaLegId("param", "id")
], function(req, res) {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  return Leg.regula(req.params.id)
    .then(dados => res.jsonp(dados))
    .catch(erro => res.status(500).send(`Erro na consulta dos processos regulados por ${req.params.id}: ${erro}`));
});

// Insere uma legislação na BD
router.post("/", [
    verificaLegId("body", "id").optional(),
    existe("body", "numero")
        .custom(naoExisteNumero)
        .withMessage("Número já em uso"),
    estaEm("body", "tipo", vcLegTipo),
    dataValida("body", "data"),
    existe("body", "sumario"),
    estaEm("body", "estado", vcLegEstado),
    estaEm("body", "diplomaFonte", vcFonte).optional(),
    existe("body", "link").optional(),
    verificaLista("body", "entidadesSel").optional(),
    verificaExisteEnt("body", "entidadesSel.*.id"),
    verificaLista("body", "processosSel").optional(),
    verificaExisteClasse("body", "processosSel.*.codigo")
], (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  Leg.criar(req.body)
    .then(dados => {
        State.reloadLegislacao()
            .then(d => res.jsonp(dados))
            .catch(err => res.status(500).send(`Erro no reload da cache da legislação. A legislação foi criada com sucesso.`))
    })
    .catch(err => res.status(500).send(`Erro na inserção de uma legislação: ${err}`));
});

//Repõe entidades ja existentes
router.post("/repor", function(req, res){
  Leg.repor(req.body.query)
    .then(dados => {
      res.jsonp(dados)
    })
    .catch(err => res.status(500).send(`Erro na inserção das legislacoes: ${err}`));
})

//Elimina uma legislacao
router.delete("/:id", function(req, res){
  Leg.remover(req.params.id)
    .then(dados => {
      res.jsonp(dados)
    })
    .catch(err => res.status(500).send(`Erro na eliminação da legislacao: ${err}`));
})

// Atualiza uma legislação na BD
router.put("/:id", [
    existe("body", "numero")
        .custom(naoExisteNumeroSelf)
        .withMessage("Número já em uso"),
    estaEm("body", "tipo", vcLegTipo),
    dataValida("body", "data")
        .custom((v, { req }) => !req.body.dataRevogacao || v < req.body.dataRevogacao)
        .withMessage("data tem de ser anterior a dataRevogacao"),
    dataValida("body", "dataRevogacao")
        .custom((v, { req }) => !req.body.data || v > req.body.data)
        .withMessage("dataRevogacao tem de ser posterior a data")
        .optional(),
    existe("body", "sumario"),
    estaEm("body", "estado", vcLegEstado)
        .custom((v, { req }) => !req.body.dataRevogacao || v == "Revogado")
        .withMessage("Se tem uma dataRevogacao então o estado deve ser Revogado"),
    estaEm("body", "diplomaFonte", vcFonte).optional(),
    existe("body", "link").optional(),
    verificaLista("body", "entidadesSel"),
    verificaExisteEnt("body", "entidadesSel.*.id"),
    verificaLista("body", "processosSel"),
    verificaExisteClasse("body", "processosSel.*.codigo")
], (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  Leg.atualizar(req.params.id, req.body)
    .then(dados => {
        State.reloadLegislacao()
            .then(d => res.jsonp(dados))
            .catch(err => res.status(500).send(`Erro no reload da cache da legislação. A legislação foi atualizada com sucesso.`))
    })
    .catch(err => res.status(500).send(`Erro na atualização de uma legislação: ${err}`));
});

// Revogar uma legislação na BD
router.put("/:id/revogar", [
    verificaLegId('param', 'id'),
    dataValida('body', 'dataRevogacao')
        .custom((d, {req}) => {
            let leg = State.getLegislacao(req.params.id)
            if(!leg.data || leg.data < d){
                return Promise.resolve()
            }else{
                return Promise.reject()
            }
        })
        .withMessage("dataRevogacao tem de ser posterior a data")
], (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  Leg.revogar(req.params.id, req.body.dataRevogacao)
    .then(dados => {
        State.reloadLegislacao()
            .then(d => res.jsonp(dados))
            .catch(err => res.status(500).send(`Erro no reload da cache da legislação. A legislação foi revogada com sucesso.`))
    })
    .catch(err => res.status(500).send(`Erro na revogação da legislação: ${err}`));
});

module.exports = router;
