var express = require('express');
var router = express.Router();
var Auth = require('../../controllers/auth.js');
var ApiStats = require('../../controllers/api/stats');
var Classes = require('../../controllers/api/classes.js');
var Entidades = require("../../controllers/api/entidades.js");
var Leg = require("../../controllers/api/leg.js");
var Tipologias = require("../../controllers/api/tipologias.js");

router.get('/', Auth.isLoggedInUser, Auth.checkLevel(6), (req, res) => {
    ApiStats.getStats(function(err, result){
        if(err){
            return res.status(500).send(`Erro: ${err}`);
        }else{
            return res.json(result);
        }
    });
});

router.get('/total', Auth.isLoggedInUser, Auth.checkLevel(6), (req, res) => {
    ApiStats.getCallCount(function(err, result){
        if(err){
            return res.status(500).send(`Erro: ${err}`);
        }else{
            return res.json(result);
        }
    });
});

//=====================Tabela de indicadores=====================//
/*
router.get('/tabela', Auth.isLoggedInKey, async (req, res) => {
    try{
        var relStats = await Classes.relStats();
        var critStats = await Classes.critStats();
        var dfStats = await Classes.dfStats();
        var entAtivas = await Entidades.getAtivas();
        var legAtivas = await Leg.getAtivas();
        res.jsonp(dados);
    }catch(error) {
        return error;
    }
})*/

//=====================Classes=====================//

// Devolve as estatísticas relacionais dos Processos
router.get('/relstats', Auth.isLoggedInKey, (req, res) => {
    Classes.relStats()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta das estatísticas associadas aos Processos de Negócios : ${erro}`))
})

// Devolve as estatísticas relativas aos Critérios de Justificação
router.get('/critstats', Auth.isLoggedInKey, (req, res) => {
    Classes.critStats()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta das estatísticas associadas aos Critérios de Justificação : ${erro}`))
})

// Devolve as estatísticas relativas aos Destinos finais
router.get('/dfstats', Auth.isLoggedInKey, (req, res) => {
    Classes.dfStats()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta das estatísticas associadas aos Destinos finais : ${erro}`))
})

//=====================Entidades=====================//

// Devolve o numero de entidades ativas no sistema
router.get('/entativas', Auth.isLoggedInKey, (req, res) => {
    Entidades.getAtivas()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta do numero de entidades ativas : ${erro}`))
})

//=====================Legislação=====================//

// Devolve o numero de diplomas legislativos ativos no sistema
router.get('/legativos', Auth.isLoggedInKey, (req, res) => {
    Leg.getAtivas()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta do numero de Documentos Legislativos ativos : ${erro}`))
})

//=====================Tipologias=====================//

// Devolve o numero de Tipologias
router.get('/tipologias', Auth.isLoggedInKey, async (req, res) => {
    var filtro = [
        `?estado = "${req.query.estado ? req.query.estado : "Ativa"}"`,
        req.query.designacao
          ? `?designacao = "${req.query.designacao}"`
          : undefined,
        req.query.tips
          ? `?uri IN (${req.query.tips
              .split(",")
              .map(t => `clav:${t}`)
              .join(",")})`
          : undefined
      ]
        .filter(v => v !== undefined)
        .join(" && ");
    
    try {
    var lista = await Tipologias.listar(filtro);
    var result = {
        indicador: "Número de tipologias",
        valor: Object.keys(lista).length
    }
    res.jsonp(result);
    }catch(erro) {
        res.status(500).send(`Erro na contagem das tipologias: ${erro}`);
    }
    
})

module.exports = router;
