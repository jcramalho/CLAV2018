var Logging = require('../../controllers/logging');
var Auth = require('../../controllers/auth.js');
var Classes = require('../../controllers/api/classes.js');
var State = require('../../controllers/state.js')

var express = require('express');
var router = express.Router();

// Devolve as classes em vários formatos podendo ser filtradas por nível 
router.get('/', async (req, res) => { 
    try {
        if(req.query.formato == "arvore"){
            res.jsonp(await State.getAllClasses());
        }
        else if(req.query.formato == "lista"){
            res.jsonp(await State.getClassesFlatList());
        }
        else if(req.query.nivel){
            switch(req.query.nivel){
                case '1': try {
                        res.jsonp(await State.getLevel1Classes());
                        break  
                    } catch(err) {
                        res.status(500).send(`Erro na listagem geral das classes de nível 1: ${err}`)
                        break
                    }
                case '2': try {
                        res.jsonp(await State.getLevel2Classes());  
                        break
                    } catch(err) {
                        res.status(500).send(`Erro na listagem geral das classes de nível 2: ${err}`)
                        break
                    }  
                case '3': try {
                        res.jsonp(await State.getLevel3Classes()); 
                        break 
                    } catch(err) {
                        res.status(500).send(`Erro na listagem geral das classes de nível 3: ${err}`)
                        break
                    }
                case '4': try {
                        res.jsonp(await State.getLevel4Classes()); 
                        break 
                    } catch(err) {
                        res.status(500).send(`Erro na listagem geral das classes de nível 4: ${err}`)
                        break
                    }
            }
        }
        else{
            res.jsonp(await State.getAllClasses());
        }
    } catch(err) {
        res.status(500).send(`Erro na listagem geral das classes: ${err}`)
    }
})

// Devolve a informação de uma classe
router.get('/:id', async function (req, res) {
    try {
        res.jsonp(await Classes.retrieve(req.params.id)) 
    } catch(err) {
        res.status(500).send(`Erro na recuperação da classe ` + req.params.id + `: ${err}`)
    }
})

// Verifica se um determinado código de classe já existe
router.get('/verificar/:codigo', async (req, res) => {
    try {
        res.jsonp(await State.verificaCodigo(req.params.codigo)) 
    } catch(err) {
        res.status(500).send(`Erro na verificação de um código: ${err}`)
    }
})

// Devolve a metainformação de uma classe: codigo, titulo, status, desc, codigoPai?, tituloPai?, procTrans?, procTipo?
router.get('/:id/meta', function (req, res) {
    Classes.consultar(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta da classe ${req.params.id}: ${erro}`))
})

// Devolve a lista de filhos de uma classe: id, codigo, titulo, nFilhos
router.get('/:id/descendencia', function (req, res) {
    Classes.descendencia(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta da descendência da classe ${req.params.id}: ${erro}`))
})

// Devolve a lista de notas de aplicação de uma classe: idNota, nota
router.get('/:id/notasAp', (req, res) => {
    Classes.notasAp(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta das notas de aplicação da classe ${req.params.id}: ${erro}`))
})

// Devolve a lista de exemplos das notas de aplicação de uma classe: [exemplo]
router.get('/:id/exemplosNotasAp', (req, res) => {
    Classes.exemplosNotasAp(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta dos exemplos das notas de aplicação da classe ${req.params.id}: ${erro}`))
})

// Devolve a lista de notas de exclusão de uma classe: idNota, nota
router.get('/:id/notasEx', (req, res) => {
    Classes.notasEx(req.params.id)
    .then(dados => res.jsonp(dados))
    .catch(erro => res.status(500).send(`Erro na consulta das notas de exclusão da classe ${req.params.id}: ${erro}`))
})

// Devolve os termos de índice de uma classe: idTI, termo
router.get('/:id/ti', (req, res) => {
    Classes.ti(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta dos termos de índice da classe ${req.params.id}: ${erro}`))
})

// Devolve a(s) entidade(s) dona(s) do processo: id, tipo, sigla, designacao
router.get('/:id/dono', (req, res) => {
    Classes.dono(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta dos donos da classe ${req.params.id}: ${erro}`))
})

// Devolve a(s) entidade(s) participante(s) do processo: id, sigla, designacao, tipoParticip
router.get('/:id/participante', (req, res) => {
    Classes.participante(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta dos participantes da classe ${req.params.id}: ${erro}`))
})

// Devolve o(s) processo(s) relacionado(s): id, codigo, titulo, tipoRel
router.get('/:id/procRel', (req, res) => {
    Classes.procRel(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta dos processos relacionados com a classe ${req.params.id}: ${erro}`))
})

// Devolve o(s) processo(s) relacionado(s) por uma relação específica: id, codigo, titulo
router.get('/:id/procRel/:idRel', (req, res) => {
    Classes.procRelEspecifico(req.params.id, req.params.idRel)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta dos processos relacionados com a classe ${req.params.id}: ${erro}`))
})

// Devolve a legislação associada ao contexto de avaliação: id, tipo, numero, sumario
router.get('/:id/legislacao', (req, res) => {
    Classes.legislacao(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta da legislação associada à classe ${req.params.id}: ${erro}`))
})

// Devolve a informação base do PCA: idPCA, formaContagem, subFormaContagem, idJustificacao, valores, notas
router.get('/:id/pca', (req, res) => {
    Classes.pca(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta do PCA associado à classe ${req.params.id}: ${erro}`))
})

// Devolve uma justificação, PCA ou DF, que é composta por uma lista de critérios: criterio, tipoLabel, conteudo
router.get('/justificacao/:id', (req, res) => {
    Classes.justificacao(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta da justificação ${req.params.id}: ${erro}`))
})

// Devolve a informação base do DF: idDF, valor, idJustificacao
router.get('/:id/df', (req, res) => {
    Classes.df(req.params.id)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na consulta do DF associado à classe ${req.params.id}: ${erro}`))
        //.then(dados => res.jsonp(fa.simplificaSPARQLRes(dados, ['idDF', 'valor', 'idJustificacao'])))
        //.catch(erro => res.jsonp({cod: "404", mensagem: "Erro na consulta do DF associado à classe "+req.params.id+": " + erro}))
})

// Verifica se um código de classe existe
router.get('verifica/:codigo', (req, res) => {
    Classes.verificaCodigo(req.params.codigo, req.params.codigo.split('.').length)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na verificação da existência do código ${req.params.codigo}: ${erro}`))
})

router.post('/', Auth.isLoggedIn, (req, res) => {
    console.log('Recebi um post de classe...')
    console.log(JSON.stringify(req.body))
    
    return Classes.criar(req.body, req.user.email)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na criação da classe: ${erro}`));
})

module.exports = router;
