var Auth = require('../../controllers/auth.js');
var Creditos = require('../../controllers/api/colaboracoes.js')
var url = require('url')

var express = require('express')
var router = express.Router()

var validKeys = ["nome", "filiacao", "funcao", "desc"];
const { validationResult } = require('express-validator');
const { existe, estaEm, dataValida, eMongoId, vcNotRec } = require('../validation')

// Lista todas as pessoas nos créditos e as suas informações
router.get('/', Auth.isLoggedInKey, [
    existe("query", "nome").optional(),
    existe("query", "filiacao").optional(),
    existe("query", "funcao").optional(),
    existe("query", "desc").optional()
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    var queryData = url.parse(req.url, true).query;
    
    var filtro = Object.entries(queryData)
        .filter(([k, v]) => validKeys.includes(k))

    filtro = Object.assign({}, ...Array.from(filtro, ([k, v]) => ({[k]: v}) ));
    
    Creditos.listar(filtro)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na listagem das colaborações: ${erro}`))
})

// Consulta de uma pessoa nos créditos
router.get('/:id', Auth.isLoggedInKey, [
    eMongoId('param', 'id')
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Creditos.consultar(req.params.id)
        .then(dados => dados ? res.jsonp(dados) : res.status(404).send(`Erro: O identificador '${req.params.id}' não existe nas colaborações.`))
	    .catch(erro => res.status(500).send(`Erro na consulta das colaborações para o identificador '${req.params.id}': ${erro}`))
})

// Adiciona um crédito
router.post('/', Auth.isLoggedInUser, Auth.checkLevel([4, 5, 6, 7]), [
    existe("body", "nome"),
    existe("body", "filiacao"),
    existe("body", "funcao"),
    //existe("body", "desc").optional()
], (req, res) => {
    const errors = validationResult(req)
    
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Creditos.criar(req.body)
        .then(dados => {
            if(dados) res.jsonp("Colaboração adicionada com sucesso.")
            else res.status(500).jsonp("Erro na adição da colaboração para a pessoa: " + req.body.nome)
        })
        .catch(erro => res.status(500).jsonp("Erro na adição da colaboração para a pessoa: " + req.body.nome + ": " + erro))
})

// Update de um crédito
router.put('/:id', Auth.isLoggedInUser, Auth.checkLevel([4, 5, 6, 7]), [
    eMongoId('param', 'id'),
    existe("body", "nome"),
    existe("body", "filiacao"),
    existe("body", "funcao"),
    //existe("body", "desc").optional()
], (req, res) => {
    const errors = validationResult(req)

    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }
    let desc = "";
    if (req.body.desc !== undefined){
        desc = req.body.desc;
    }
    Creditos.update(req.params.id, req.body.nome, req.body.filiacao, req.body.funcao, desc)
        .then(dados => {
            if(dados) res.jsonp("Colaboração modificada com sucesso.")
            else res.status(500).jsonp("Erro na modificação da colaboração com identificador: " + req.params.id)
        })
        .catch(erro => res.status(500).jsonp("Erro na modificação da colaboração com identificador " + req.params.id + ": " + erro))
})

// Apagar um crédito
router.delete('/:id', Auth.isLoggedInUser, Auth.checkLevel([4, 5, 6, 7]), [
    eMongoId('param', 'id')
], function(req, res) {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Creditos.eliminar(req.params.id, function(err, user){
        if(err){
            res.status(500).send("Não foi possível eliminar a colaboração!");
        }else{
            res.send('Colaboração eliminada com sucesso!');
        }
    })
});

module.exports = router;
