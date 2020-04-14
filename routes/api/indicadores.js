var Auth = require('../../controllers/auth.js')
var Indicadores = require('../../controllers/api/indicadores.js');
var express = require('express');
var router = express.Router();

var dfs = ["C", "CP", "E"] 
var crits = ["legal", "gestionario", "utilidadeAdministrativa", "densidadeInfo", "complementaridadeInfo"]
var rels = ["temRelProc", "eAntecessorDe", "eSucessorDe", "eComplementarDe", "eCruzadoCom", "eSinteseDe", "eSintetizadoPor", "eSuplementoDe", "eSuplementoPara", "dono", "participante", "temLeg"]

const { query, body, validationResult } = require('express-validator');
const { existe, estaEm, verificaEntId, eFS, verificaEnts, dataValida, existeEverificaTips } = require('../validation')

function capitalizeFL(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

var relacaoSanitizer = value => {
    if (value == "temLeg")
        value = "temLegislacao"
    else if(["dono", "participante"].includes(value))
        value = "tem" + capitalizeFL(value)

    return value
}

//Classes

router.get('/classesN4', Auth.isLoggedInKey, (req, res) => {
    Indicadores.totalClassesN(4)
        .then(dados => {
            var result = {
                indicador: `Número de Classes de nivel 4`,
                valor: dados
            }
            res.jsonp(result)
        })
        .catch(err => res.status(500).send(`Erro ao obter o número total de classes de nível 4: ${err}`))
})

router.get('/classesN3', Auth.isLoggedInKey, (req, res) => {
    Indicadores.totalClassesN(3)
        .then(dados => {
            var result = {
                indicador: `Número de Classes de nivel 3`,
                valor: dados
            }
            res.jsonp(result)
        })
        .catch(err => res.status(500).send(`Erro ao obter o número total de classes de nível 3: ${err}`))
})

router.get('/classesN2', Auth.isLoggedInKey, (req, res) => {
    Indicadores.totalClassesN(2)
        .then(dados => {
            var result = {
                indicador: `Número de Classes de nivel 2`,
                valor: dados
            }
            res.jsonp(result)
        })
        .catch(err => res.status(500).send(`Erro ao obter o número total de classes de nível 2: ${err}`))
})

router.get('/classesN1', Auth.isLoggedInKey, (req, res) => {
    Indicadores.totalClassesN(1)
        .then(dados => {
            var result = {
                indicador: `Número de Classes de nivel 1`,
                valor: dados
            }
            res.jsonp(result)
        })
        .catch(err => res.status(500).send(`Erro ao obter o número total de classes de nível 1: ${err}`))
})

router.get('/classes', Auth.isLoggedInKey, (req, res) => {
    Indicadores.totalClasses()
        .then(dados => res.jsonp(dados))
        .catch(err => res.status(500).send(`Erro ao obter o número total de classes: ${err}`))
})

//Entidades

router.get('/entidadesAtivas', Auth.isLoggedInKey, (req, res) => {
    Indicadores.totalEntidadesAtivas()
        .then(dados => res.jsonp(dados))
        .catch(err => res.status(500).send(`Erro ao obter o número total de entidades ativas: ${err}`))
})

router.get('/entidades', Auth.isLoggedInKey, (req, res) => {
    Indicadores.totalEntidades()
        .then(dados => {
            var result = {
                indicador: `Número de Entidades`,
                valor: dados
            }
            res.jsonp(result)
        })
        .catch(err => res.status(500).send(`Erro ao obter o número total de entidades: ${err}`))
})

//Tipologias

router.get('/tipologias', Auth.isLoggedInKey, (req, res) => {
    Indicadores.totalTipologias()
        .then(dados => {
            var result = {
                indicador: `Número de tipologias`,
                valor: dados
            }
            res.jsonp(result)
        })
        .catch(err => res.status(500).send(`Erro ao obter o número total de tipologias: ${err}`))
})

//Legislacao

router.get('/legVigor', Auth.isLoggedInKey, (req, res) => {
    Indicadores.totalLegislacaoAtivos()
        .then(dados => res.jsonp(dados))
        .catch(err => res.status(500).send(`Erro ao obter o número total de diplomas legislativos em vigor: ${err}`))
})

router.get('/leg', Auth.isLoggedInKey, (req, res) => {
    Indicadores.totalLegislacao()
        .then(dados => {
            var result = {
                indicador: `Número de Diplomas Legislativos`,
                valor: dados
            }
            res.jsonp(result)
        })
        .catch(err => res.status(500).send(`Erro ao obter o número total de diplomas legislativos: ${err}`))
})

//Relacoes

// Devolve as estatísticas relacionais dos Processos
router.get('/relstats', Auth.isLoggedInKey, (req, res) => {
    Indicadores.relStats()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta das estatísticas associadas aos Processos de Negócios : ${erro}`))
})

// Devolve as estatísticas relativas aos Critérios de Justificação
router.get('/critstats', Auth.isLoggedInKey, (req, res) => {
    Indicadores.critStats()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta das estatísticas associadas aos Critérios de Justificação : ${erro}`))
})

// Devolve as estatísticas relativas aos Destinos finais
router.get('/dfstats', Auth.isLoggedInKey, (req, res) => {
    Indicadores.dfStats()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta das estatísticas associadas aos Destinos finais : ${erro}`))
})

router.get('/relacoes/:relacao', Auth.isLoggedInKey, [
    estaEm('param', 'relacao', rels).customSanitizer(relacaoSanitizer)
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Indicadores.totalRelacoes(req.params.relacao)
        .then(dados => res.jsonp(dados))
        .catch(err => res.status(500).send(`Erro ao obter o número total de relações "${req.params.relacao}": ${err}`))
})

router.get('/df/:df', Auth.isLoggedInKey, [
    estaEm('param', 'df', dfs)
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Indicadores.totalDF(req.params.df)
        .then(dados => res.jsonp(dados))
        .catch(err => res.status(500).send(`Erro ao obter o número total de PN's com DF igual a ${req.params.df}: ${err}`))
})

router.get('/critJust/:critJust', Auth.isLoggedInKey, [
    estaEm('param', 'critJust', crits).customSanitizer(capitalizeFL)
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Indicadores.totalCritJust(req.params.critJust)
        .then(dados => res.jsonp(dados))
        .catch(err => res.status(500).send(`Erro ao obter o número total de Critérios de Justificação do tipo "CriterioJustificacao${req.params.critJust}": ${err}`))
})

router.get('/critJust', Auth.isLoggedInKey, (req, res) => {
    Indicadores.totalCritJust("")
        .then(dados => res.jsonp(dados))
        .catch(err => res.status(500).send(`Erro ao obter o número total de Critérios de Justificação: ${err}`))
})

//Tabelas

//Devolve lista de todos os indicadores apresentados abaixo
router.get('/tabela', Auth.isLoggedInKey, async (req, res) => {
    try{
        var nClasses1 = await Indicadores.totalClassesN(1);
        var nClasses2 = await Indicadores.totalClassesN(2);
        var nClasses3 = await Indicadores.totalClassesN(3);
        var nClasses4 = await Indicadores.totalClassesN(4);


        var classes1 = {
            indicador: `Número de Classes de nivel 1`,
            valor: nClasses1
        }
        var classes2 = {
            indicador: `Número de Classes de nivel 2`,
            valor: nClasses2
        }
        var classes3 = {
            indicador: `Número de Classes de nivel 3`,
            valor: nClasses3
        }
        var classes4 = {
            indicador: `Número de Classes de nivel 4`,
            valor: nClasses4
        }

        var nEntidades = await Indicadores.totalEntidades();
        var nDiplomas = await Indicadores.totalLegislacao();
        var nTipologias = await Indicadores.totalTipologias();

        var entidades = {
            indicador: `Número de Entidades`,
            valor: nEntidades
        }
        var diplomas = {
            indicador: `Número de Diplomas Legislativos`,
            valor: nDiplomas
        }
        var tipologias = {
            indicador: `Número de tipologias`,
            valor: nTipologias
        }

        var relStats = await Indicadores.relStats();
        var critStats = await Indicadores.critStats();
        var dfStats = await Indicadores.dfStats();
        var entAtivas = await Indicadores.totalEntidadesAtivas();
        var legAtivas = await Indicadores.totalLegislacaoAtivos();

        var dados = [].concat(classes1, classes2, classes3, classes4, 
                                relStats, critStats, dfStats,
                                entidades, entAtivas, 
                                diplomas, legAtivas, 
                                tipologias);

        res.jsonp(dados);
    }catch(error) {
        return error;
    }
})

module.exports = router;
