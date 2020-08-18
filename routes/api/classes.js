var Auth = require('../../controllers/auth.js');
var Classes = require('../../controllers/api/classes.js');
var State = require('../../controllers/state.js')

var express = require('express');
var router = express.Router();

const { query, validationResult } = require('express-validator');
const { existe, estaEm, verificaClasseId, verificaClasseCodigo, verificaJustId, eFS, verificaEnts, verificaTips, vcClassesInfo, vcClassesStruct, vcClassesTipo, vcClassesNiveis, vcClasseInfo, vcClassesRels } = require('../validation')

function verificaId() {
    return verificaClasseId('param', 'id')
}

// Devolve as classes em vários formatos podendo ser filtradas por nível 
router.get('/', Auth.isLoggedInKey, [
    estaEm('query', 'info', vcClassesInfo).optional(),
    eFS(),
    estaEm('query', 'estrutura', vcClassesStruct).optional(),
    estaEm('query', 'tipo', vcClassesTipo).optional(),
    estaEm('query', 'nivel', vcClassesNiveis).optional(),
    verificaEnts("query", "ents").optional(),
    verificaTips("query", "tips").optional()
], async (req, res, next) => { 
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    try{
        //obtém as classes com toda a info destas
        res.locals.dados = await State.getAllClassesInfo()

        //filtrar por tipo
        if(req.query.tipo){
            if(req.query.tipo == "comum"){
                res.locals.dados = State.filterProcessosComuns(res.locals.dados)
            }else{ //tipo == especifico
                res.locals.dados = State.filterProcessosEspecificos(res.locals.dados)
            }
        }

        let ents = []
        let tips = []
        //filtrar por entidades e/ou tipologias
        if(req.query.ents || req.query.tips){
            if(req.query.ents){
                ents = req.query.ents.split(',');
            }
            if(req.query.tips){
                tips = req.query.tips.split(',');
            }

            let ents_tips = ents.concat(tips)
            res.locals.dados = State.filterEntsTips(res.locals.dados, ents_tips)
        }

        //filtrar por nivel
        if(req.query.nivel){
            res.locals.dados = State.filterNivel(res.locals.dados, req.query.nivel)
        }

        //estrutura a devolver
        if(req.query.estrutura == "lista"){
            res.locals.dados = State.flatArvore(res.locals.dados)
        }
        //else não é necessário já que a outra hipótese é estrutura = arvore
        //e o objeto já se encontra em arvore, exceto claro o caso em que é filtrado
        //por nivel que torna a arvore numa lista

        if(req.query.info){
            if(req.query.info == "esqueleto"){
                res.locals.dados = State.filterEsqueletoInfo(res.locals.dados)
                res.locals.tipo = "esqueletoClasses"
            }else if(req.query.info == "pesquisa"){
                res.locals.dados = State.filterPesquisaInfo(res.locals.dados)
                res.locals.tipo = "pesquisaClasses"
            }else if(req.query.info == "pre-selecionados"){
                let ents_tips = ents.concat(tips)
                res.locals.dados = State.filterPreSelecionadoInfo(res.locals.dados, ents_tips)
                res.locals.tipo = "preselecionadoClasses"
            }else{
                //info == completa, algo que a arvore já o é, logo
                //não é necessário alterar nada
                res.locals.tipo = "classes"
            }
        }else{ //devolve apenas a info base da classe
            res.locals.dados = State.filterBaseInfo(res.locals.dados)
            res.locals.tipo = "classes"
        }

        //filtrar pelo estado das classes
        //se não for utilizador ou se for com nível inferior a 3.5 ou ainda se for o esqueleto para a criação de uma TS apenas apresentar classes com estado = Ativo
        if(res.locals.idType != "User" || req.user.level < 3.5 || res.locals.tipo == "esqueletoClasses"){
            res.locals.dados = State.filterStatus(res.locals.dados, res.locals.dados)
        }

        //remove o status do esqueleto
        if(res.locals.tipo == "esqueletoClasses"){
            for(var i=0; i < res.locals.dados.length; i++){
                delete res.locals.dados[i].status
            }
        }

        //converter para o formato de saída
        next()
    } catch(err) {
        res.status(500).send(`Erro na listagem geral das classes: ${err}`)
    }
})

// Verifica se um determinado título de classe já existe
router.get('/titulo', Auth.isLoggedInKey, [
    existe('query', 'valor')
], function (req, res) {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    State.verificaTitulo(req.query.valor)
        .then(data => res.jsonp(data))
        .catch(err => res.status(500).send(`Erro na verificação do título: ${err}`))
})

// Verifica se um determinado código de classe já existe
router.get('/codigo', Auth.isLoggedInKey, [
    verificaClasseCodigo('query', 'valor')
], function (req, res) {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    State.verificaCodigo(req.query.valor)
        .then(data => res.jsonp(data))
        .catch(err => res.status(500).send(`Erro na verificação de um código: ${err}`))
})

// Devolve a informação de uma classe
router.get('/:id', Auth.isLoggedInKey, [
    verificaId(),
    eFS(),
    estaEm("query", "tipo", vcClasseInfo).optional()
], async function (req, res, next) {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

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
router.get('/:id/meta', Auth.isLoggedInKey, [
    verificaId()
], function (req, res) {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Classes.consultar(req.params.id)
        .then(dados => res.jsonp(dados[0]))
        .catch(erro => res.status(500).send(`Erro na consulta da classe ${req.params.id}: ${erro}`))
})

// Devolve a lista de filhos de uma classe: id, codigo, titulo, nFilhos
router.get('/:id/descendencia', Auth.isLoggedInKey, [
    verificaId()
], function (req, res) {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Classes.descendencia(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta da descendência da classe ${req.params.id}: ${erro}`))
})

// Devolve a lista de notas de aplicação de uma classe: idNota, nota
router.get('/:id/notasAp', Auth.isLoggedInKey, [
    verificaId()
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Classes.notasAp(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta das notas de aplicação da classe ${req.params.id}: ${erro}`))
})

// Devolve a lista de exemplos das notas de aplicação de uma classe: [exemplo]
router.get('/:id/exemplosNotasAp', Auth.isLoggedInKey, [
    verificaId()
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Classes.exemplosNotasAp(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta dos exemplos das notas de aplicação da classe ${req.params.id}: ${erro}`))
})

// Devolve a lista de notas de exclusão de uma classe: idNota, nota
router.get('/:id/notasEx', Auth.isLoggedInKey, [
    verificaId()
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Classes.notasEx(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta das notas de exclusão da classe ${req.params.id}: ${erro}`))
})

// Devolve os termos de índice de uma classe: idTI, termo
router.get('/:id/ti', Auth.isLoggedInKey, [
    verificaId()
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Classes.ti(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta dos termos de índice da classe ${req.params.id}: ${erro}`))
})

// Devolve a(s) entidade(s) dona(s) do processo: id, tipo, sigla, designacao
router.get('/:id/dono', Auth.isLoggedInKey, [
    verificaId()
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Classes.dono(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta dos donos da classe ${req.params.id}: ${erro}`))
})

// Devolve a(s) entidade(s) participante(s) do processo: id, sigla, designacao, tipoParticip
router.get('/:id/participante', Auth.isLoggedInKey, [
    verificaId()
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Classes.participante(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta dos participantes da classe ${req.params.id}: ${erro}`))
})

// Devolve o(s) processo(s) relacionado(s): id, codigo, titulo, tipoRel
router.get('/:id/procRel', Auth.isLoggedInKey, [
    verificaId()
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Classes.procRel(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta dos processos relacionados com a classe ${req.params.id}: ${erro}`))
})

// Devolve o(s) processo(s) relacionado(s) por uma relação específica: id, codigo, titulo
router.get('/:id/procRel/:idRel', Auth.isLoggedInKey, [
    verificaId(),
    estaEm("param", "idRel", vcClassesRels)
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Classes.procRelEspecifico(req.params.id, req.params.idRel)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta dos processos relacionados com a classe ${req.params.id}: ${erro}`))
})

// Devolve a legislação associada ao contexto de avaliação: id, tipo, numero, sumario
router.get('/:id/legislacao', Auth.isLoggedInKey, [
    verificaId()
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Classes.legislacao(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta da legislação associada à classe ${req.params.id}: ${erro}`))
})

// Devolve a informação base do PCA: idPCA, formaContagem, subFormaContagem, idJustificacao, valores, notas
router.get('/:id/pca', Auth.isLoggedInKey, [
    verificaId()
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Classes.pca(req.params.id)
        .then(dados => res.jsonp(dados[0]))
        .catch(erro => res.status(500).send(`Erro na consulta do PCA associado à classe ${req.params.id}: ${erro}`))
})

// Devolve uma justificação, PCA ou DF, que é composta por uma lista de critérios: criterio, tipoLabel, conteudo
router.get('/justificacao/:id', Auth.isLoggedInKey, [
    verificaJustId('param', 'id')
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Classes.justificacao(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta da justificação ${req.params.id}: ${erro}`))
})

// Devolve a informação base do DF: idDF, valor, idJustificacao
router.get('/:id/df', Auth.isLoggedInKey, [
    verificaId()
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Classes.df(req.params.id)
        .then(dados => res.jsonp(dados[0]))
        .catch(erro => res.status(500).send(`Erro na consulta do DF associado à classe ${req.params.id}: ${erro}`))
})

module.exports = router;
