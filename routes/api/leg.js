var Auth = require("../../controllers/auth.js");
var Leg = require("../../controllers/api/leg.js");
var url = require("url");
var State = require("../../controllers/state.js");

var express = require("express");
var router = express.Router();

const { validationResult } = require('express-validator');
const { existe, estaEm, eFS, dataValida, verificaNumeroLeg, verificaLegId, existeEnt, verificaLista, existeClasse } = require('../validation')
var tipoLegislacao = ["Decreto", "DL", "Lei", "Diretiva", "Circular", "Despacho", "Decreto Regulamentar", "Portaria", "Decreto do Governo", "Decreto Legislativo Regional", "Resolução do Conselho de Ministros", "Despacho Normativo", "Resolução da Assembleia da República", "Decisão", "Regulamento", "Decreto do Presidente da República", "Aviso", "Despacho Conjunto", "Lei Orgânica", "Decisão-Quadro", "Circular Normativa", "Recomendação", "Deliberação", "Circular Informativa", "Lei Constitucional", "CSN EN", "Declaração de Retificação", "ISO", "NP", "Diretiva Técnica", "Comunicação", "Resolução", "Tratado", "Regulamento de Execução", "NP EN ISO/IEC", "NOP", "ILAC", "Regulamento Delegado", "NP EN ISO", "Ordem de Serviço", "Estatuto", "Instrução", "ISO/IEC"]

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

async function existeEverificaEnts(ents) {
    var valid = true

    for(var i = 0; i < ents.length && valid; i++){
        if(ents[i].id.match(/^ent_.+$/)){
            try{
                await existeEnt(ents[i].id)
            }catch(e){
                valid = false
            }
        }else{
            valid = false
        }
    }

    if(valid){
        return Promise.resolve()
    }else{
        return Promise.reject()
    }
}

async function existeEverificaClasses(classes) {
    var valid = true

    for(var i = 0; i < classes.length && valid; i++){
        if(classes[i].codigo.match(/^\d{3}(\.\d{2}(\.\d{3}(\.\d{2})?)?)?$/)){
            try{
                await existeClasse(classes[i].codigo)
            }catch(e){
                valid = false
            }
        }else{
            valid = false
        }
    }

    if(valid){
        return Promise.resolve()
    }else{
        return Promise.reject()
    }
}

// Lista todos os documentos legislativos: id, data, numero, tipo, sumario, entidades
router.get("/", Auth.isLoggedInKey, [
    eFS(),
    estaEm("query", "estado", ["Ativo", "Revogado"]).optional(),
    estaEm("query", "fonte", ["PGD", "PGD/LC", "RADA"]).optional(),
    estaEm("query", "processos", ["com", "sem"]).optional(),
    estaEm("query", "info", ["completa"]).optional()
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
      res.locals.dados = await Leg.listar();

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
router.get("/numero", Auth.isLoggedInKey, [
    verificaNumeroLeg("query", "valor")
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
router.get("/portarias", Auth.isLoggedInKey, (req, res) => {
  return Leg.portarias()
    .then(dados => res.jsonp(dados))
    .catch(erro => res.status(500).send(`Erro na consulta da leg de portarias: ${erro}`));
});

// Devolve a informação associada a um documento legislativo: tipo data numero sumario link entidades
router.get("/:id", Auth.isLoggedInKey, [
    verificaLegId("param", "id"),
    eFS(),
    estaEm("query", "info", ["completa"]).optional()
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
router.get("/:id/processos", Auth.isLoggedInKey, [
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
router.post("/", Auth.isLoggedInUser, Auth.checkLevel(4), [
    verificaNumeroLeg("body", "numero")
        .custom(naoExisteNumero)
        .withMessage("Número já em uso"),
    estaEm("body", "tipo", tipoLegislacao),
    dataValida("body", "data"),
    existe("body", "sumario"),
    estaEm("body", "estado", ["Ativo", "Revogado"]),
    estaEm("body", "diplomaFonte", ["PGD", "PGD/LC", "RADA"]).optional(),
    existe("body", "link").optional().isURL().withMessage("URL inválido"),
    verificaLista("body", "entidadesSel", existeEverificaEnts, '^ent_.+$').optional(),
    verificaLista("body", "processosSel", existeEverificaClasses, "^\\d{3}(\\.\\d{2}(\\.\\d{3}(\\.\\d{2})?)?)?$").optional()
], (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
      return res.status(422).jsonp(errors.array())
  }

  Leg.criar(req.body)
    .then(dados => res.jsonp(dados))
    .catch(err => res.status(500).send(`Erro na inserção de uma legislação: ${err}`));
});

module.exports = router;
