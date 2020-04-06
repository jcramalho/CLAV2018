var Auth = require('../../controllers/auth.js');
var Classes = require('../../controllers/api/classes.js');
var State = require('../../controllers/state.js')

var express = require('express');
var router = express.Router();

// Devolve as classes em vários formatos podendo ser filtradas por nível 
router.get('/', Auth.isLoggedInKey, async (req, res, next) => { 
    try {
        if(req.query.info == "esqueleto"){
            res.locals.dados = await State.getEsqueleto()
            res.locals.tipo = "classes"
            next()
        }
        else if(req.query.info == "pesquisa"){
            res.locals.dados = await State.getClassesParaPesquisa()
            res.locals.tipo = "pesquisaClasses"
            next()
        }
        // Devolve a lista dos processos comuns
        else if(req.query.tipo == "comum"){
            if(req.query.info == "completa"){
                res.locals.dados = await State.getProcessosComunsInfo()
            }else{
                res.locals.dados = await State.getProcessosComuns()
            }

            res.locals.tipo = "classes"
            next()
        }
        // Devolve a lista dos processos especificos
        else if(req.query.tipo == "especifico" || req.query.ents || req.query.tips){
            if(req.query.ents){
                var ents = req.query.ents.split(',');
            }
            if(req.query.tips){
                var tips = req.query.tips.split(',');
            }

            var allInfo = req.query.info == "completa"
            if(req.query.tipo == "especifico"){
                if(allInfo){
                    res.locals.dados = await State.getProcessosEspecificosInfo(ents, tips)
                }else{
                    res.locals.dados = await State.getProcessosEspecificos(ents, tips)
                }
            }else{
                res.locals.dados = State.getProcEntsTips(ents, tips, allInfo)
            }

            res.locals.tipo = "classes"
            next()
        } else if(req.query.nivel){
            switch(req.query.nivel){
                case '1':
                case '2':
                case '3':
                case '4':
                    try {
                        if(req.query.info == "completa"){
                            res.locals.dados = await State.getLevelClassesInfo(req.query.nivel)
                        }else{
                            res.locals.dados = await State.getLevelClasses(req.query.nivel)
                        }
                        res.locals.tipo = "classes"
                        next()
                        break
                    } catch(err) {
                        res.status(500).send(`Erro na listagem geral das classes de nível ${req.query.nivel}: ${err}`)
                        break
                    }
                default:
                    res.status(500).send(`O nível '${req.query.nivel}' não existe! Os níveis possíveis são o '1', '2', '3' e '4'.`)
                    break
            }
        }
        else if(req.query.estrutura == "arvore"){
            if(req.query.info == "completa"){
                res.locals.dados = await State.getAllClassesInfo()
            }else{
                res.locals.dados = await State.getAllClasses()
            }
            res.locals.tipo = "classes"
            next()
        }
        else if(req.query.estrutura == "lista"){
            if(req.query.info == "completa"){
                res.locals.dados = await State.getClassesInfoFlatList()
            }else{
                res.locals.dados = await State.getClassesFlatList()
            }
            res.locals.tipo = "classes"
            next()
        }
        else{
            if(req.query.info == "completa"){
                res.locals.dados = await State.getAllClassesInfo()
            }else{
                res.locals.dados = await State.getAllClasses()
            }
            res.locals.tipo = "classes"
            next()
        }
    } catch(err) {
        res.status(500).send(`Erro na listagem geral das classes: ${err}`)
    }
})

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

// Verifica se um determinado título de classe já existe
router.get('/titulo', Auth.isLoggedInKey, function (req, res) {
    State.verificaTitulo(req.query.valor)
        .then(data => res.jsonp(data))
        .catch(err => res.status(500).send(`Erro na verificação do título: ${err}`))
})

// Verifica se um determinado código de classe já existe
router.get('/codigo', Auth.isLoggedInKey, function (req, res) {
    State.verificaCodigo(req.query.valor)
        .then(data => res.jsonp(data))
        .catch(err => res.status(500).send(`Erro na verificação de um código: ${err}`))
})

// Devolve a informação de uma classe
router.get('/:id', Auth.isLoggedInKey, async function (req, res, next) {
    try {
        if(req.query.tipo == "subarvore"){
            res.locals.dados = await State.subarvore(req.params.id)
            res.locals.tipo = "classe"
            next()
        }else{
            res.locals.dados = await Classes.retrieve(req.params.id)
            res.locals.tipo = "classe"
            next()
        }
    } catch(err) {
        res.status(500).send(`Erro na recuperação da classe ` + req.params.id + `: ${err}`)
    }
})

// Devolve a metainformação de uma classe: codigo, titulo, status, desc, codigoPai?, tituloPai?, procTrans?, procTipo?
router.get('/:id/meta', Auth.isLoggedInKey, function (req, res) {
    Classes.consultar(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta da classe ${req.params.id}: ${erro}`))
})

// Devolve a lista de filhos de uma classe: id, codigo, titulo, nFilhos
router.get('/:id/descendencia', Auth.isLoggedInKey, function (req, res) {
    Classes.descendencia(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta da descendência da classe ${req.params.id}: ${erro}`))
})

// Devolve a lista de notas de aplicação de uma classe: idNota, nota
router.get('/:id/notasAp', Auth.isLoggedInKey, (req, res) => {
    Classes.notasAp(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta das notas de aplicação da classe ${req.params.id}: ${erro}`))
})

// Devolve a lista de exemplos das notas de aplicação de uma classe: [exemplo]
router.get('/:id/exemplosNotasAp', Auth.isLoggedInKey, (req, res) => {
    Classes.exemplosNotasAp(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta dos exemplos das notas de aplicação da classe ${req.params.id}: ${erro}`))
})

// Devolve a lista de notas de exclusão de uma classe: idNota, nota
router.get('/:id/notasEx', Auth.isLoggedInKey, (req, res) => {
    Classes.notasEx(req.params.id)
    .then(dados => res.jsonp(dados))
    .catch(erro => res.status(500).send(`Erro na consulta das notas de exclusão da classe ${req.params.id}: ${erro}`))
})

// Devolve os termos de índice de uma classe: idTI, termo
router.get('/:id/ti', Auth.isLoggedInKey, (req, res) => {
    Classes.ti(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta dos termos de índice da classe ${req.params.id}: ${erro}`))
})

// Devolve a(s) entidade(s) dona(s) do processo: id, tipo, sigla, designacao
router.get('/:id/dono', Auth.isLoggedInKey, (req, res) => {
    Classes.dono(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta dos donos da classe ${req.params.id}: ${erro}`))
})

// Devolve a(s) entidade(s) participante(s) do processo: id, sigla, designacao, tipoParticip
router.get('/:id/participante', Auth.isLoggedInKey, (req, res) => {
    Classes.participante(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta dos participantes da classe ${req.params.id}: ${erro}`))
})

// Devolve o(s) processo(s) relacionado(s): id, codigo, titulo, tipoRel
router.get('/:id/procRel', Auth.isLoggedInKey, (req, res) => {
    Classes.procRel(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta dos processos relacionados com a classe ${req.params.id}: ${erro}`))
})

// Devolve o(s) processo(s) relacionado(s) por uma relação específica: id, codigo, titulo
router.get('/:id/procRel/:idRel', Auth.isLoggedInKey, (req, res) => {
    Classes.procRelEspecifico(req.params.id, req.params.idRel)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta dos processos relacionados com a classe ${req.params.id}: ${erro}`))
})

// Devolve a legislação associada ao contexto de avaliação: id, tipo, numero, sumario
router.get('/:id/legislacao', Auth.isLoggedInKey, (req, res) => {
    Classes.legislacao(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta da legislação associada à classe ${req.params.id}: ${erro}`))
})

// Devolve a informação base do PCA: idPCA, formaContagem, subFormaContagem, idJustificacao, valores, notas
router.get('/:id/pca', Auth.isLoggedInKey, (req, res) => {
    Classes.pca(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta do PCA associado à classe ${req.params.id}: ${erro}`))
})

// Devolve uma justificação, PCA ou DF, que é composta por uma lista de critérios: criterio, tipoLabel, conteudo
router.get('/justificacao/:id', Auth.isLoggedInKey, (req, res) => {
    Classes.justificacao(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta da justificação ${req.params.id}: ${erro}`))
})

// Devolve a informação base do DF: idDF, valor, idJustificacao
router.get('/:id/df', Auth.isLoggedInKey, (req, res) => {
    Classes.df(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta do DF associado à classe ${req.params.id}: ${erro}`))
})

module.exports = router;
