var Auth = require('../../controllers/auth.js');
var Classes = require('../../controllers/api/classes.js');
var State = require('../../controllers/state.js')

var express = require('express');
var router = express.Router();

// Devolve as classes em vários formatos podendo ser filtradas por nível 
router.get('/', Auth.isLoggedInKey, async (req, res, next) => { 
    try {
        if(req.query.formato == "arvore"){
            if(req.query.info == "completa"){
                res.locals.dados = await State.getAllClassesInfo()
            }else{
                res.locals.dados = await State.getAllClasses()
            }
            res.locals.tipo = "classes"
            next()
        }
        else if(req.query.formato == "lista"){
            if(req.query.info == "completa"){
                res.locals.dados = await State.getClassesInfoFlatList()
            }else{
                res.locals.dados = await State.getClassesFlatList()
            }
            res.locals.tipo = "classes"
            next()
        }
        // Devolve a lista dos processos comuns
        else if(req.query.tipo == "comum"){
            res.locals.dados = await State.getProcessosComuns()
            res.locals.tipo = "classes"
            next()
        }
        // Devolve a lista dos processos especificos
        else if(req.query.tipo == "especifico"){
            if( req.query.ents ){
                var ents = req.query.ents.split(',');
            }
            if( req.query.tips ) {
                var tips = req.query.tips.split(',');
            }
            res.locals.dados = await State.getProcessosEspecificos(ents, tips)
            res.locals.tipo = "classes"
            next()
        }
        else if(req.query.nivel){
            switch(req.query.nivel){
                case '1': try {
                        if(req.query.info == "completa"){
                            res.locals.dados = await State.getLevel1ClassesInfo()
                        }else{
                            res.locals.dados = await State.getLevel1Classes()
                        }
                        res.locals.tipo = "classes"
                        next()
                        break  
                    } catch(err) {
                        res.status(500).send(`Erro na listagem geral das classes de nível 1: ${err}`)
                        break
                    }
                case '2': try {
                        if(req.query.info == "completa"){
                            res.locals.dados = await State.getLevel2ClassesInfo()
                        }else{
                            res.locals.dados = await State.getLevel2Classes()
                        }
                        res.locals.tipo = "classes"
                        next()
                        break
                    } catch(err) {
                        res.status(500).send(`Erro na listagem geral das classes de nível 2: ${err}`)
                        break
                    }  
                case '3': try {
                        if(req.query.info == "completa"){
                            res.locals.dados = await State.getLevel3ClassesInfo()
                        }else{
                            res.locals.dados = await State.getLevel3Classes()
                        }
                        res.locals.tipo = "classes"
                        next()
                        break 
                    } catch(err) {
                        res.status(500).send(`Erro na listagem geral das classes de nível 3: ${err}`)
                        break
                    }
                case '4': try {
                        if(req.query.info == "completa"){
                            res.locals.dados = await State.getLevel4ClassesInfo()
                        }else{
                            res.locals.dados = await State.getLevel4Classes()
                        }
                        res.locals.tipo = "classes"
                        next()
                        break 
                    } catch(err) {
                        res.status(500).send(`Erro na listagem geral das classes de nível 4: ${err}`)
                        break
                    }
            }
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

// Devolve indíce de pesquisa para as classes
router.get('/indicePesquisa', Auth.isLoggedInKey, (req, res) => {
    State.pesquisaClassesIndice()
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na obtenção do índice de pesquisa: ${erro}`))
})

// Devolve a informação de uma classe
router.get('/:id', Auth.isLoggedInKey, async function (req, res, next) {
    try {
        res.locals.dados = await Classes.retrieve(req.params.id)
        res.locals.tipo = "classe"
        next()
    } catch(err) {
        res.status(500).send(`Erro na recuperação da classe ` + req.params.id + `: ${err}`)
    }
})

// Verifica se um determinado código de classe já existe
router.get('/verificar/:codigo', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 4, 5, 6, 7]), async (req, res) => {
    try {
        res.jsonp(await State.verificaCodigo(req.params.codigo)) 
    } catch(err) {
        res.status(500).send(`Erro na verificação de um código: ${err}`)
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

// Verifica se um determinado título de classe já existe
router.post('/verificarTitulo', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 4, 5, 6, 7]), async (req, res) => {
    try {
        res.jsonp(await State.verificaTitulo(req.body.titulo))
    } catch(err) {
        res.status(500).send(`Erro na verificação de um título: ${err}`)
    }
})

// Verifica se uma determinada notaAplicação já existe
router.post('/verificarNA', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 4, 5, 6, 7]), async (req, res) => {
    try {
        res.jsonp(await State.verificaNA(req.body.na))
    } catch(err) {
        res.status(500).send(`Erro na verificação de uma nota de aplicação: ${err}`)
    }
})

// Verifica se um determinado exemplo de nota de aplicação já existe
router.post('/verificarExemploNA', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 4, 5, 6, 7]), async (req, res) => {
    try {
        res.jsonp(await State.verificaExemploNA(req.body.exemplo))
    } catch(err) {
        res.status(500).send(`Erro na verificação de um exemplo de nota de aplicação: ${err}`)
    }
})

// Verifica se um determinado termo de índice já existe
router.post('/verificarTI', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 4, 5, 6, 7]), async (req, res) => {
    try {
        res.jsonp(await State.verificaTI(req.body.ti))
    } catch(err) {
        res.status(500).send(`Erro na verificação de um termo de índice: ${err}`)
    }
})

module.exports = router;
