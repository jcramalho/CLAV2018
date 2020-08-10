var Auth = require('../../controllers/auth.js');
var Creditos = require('../../controllers/api/colaboracoes.js')
var url = require('url')
var formidable = require("formidable")
// Para os ficheiros
var ncp = require('ncp').ncp;
ncp.limit = 16;
var fs = require('fs')
var fsExtra = require("fs.extra")
var path = require('path')

var express = require('express')
var router = express.Router()

var validKeys = ["nome", "filiacao", "funcao", "desc", "data_inicio", "data_fim"];
const { validationResult } = require('express-validator');
const { existe, estaEm, dataValida, eMongoId, vcNotRec } = require('../validation')

// Lista todas as pessoas nos créditos e as suas informações
router.get('/', Auth.isLoggedInKey, [
    existe("query", "nome").optional(),
    existe("query", "filiacao").optional(),
    existe("query", "funcao").optional(),
    existe("query", "desc").optional(),
    dataValida("query", "data_inicio").optional(),
    dataValida("query", "data_fim").optional()
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

// Devolve um ficheiro com todos os registos em formato pronto a importar no MongoDB
router.get('/exportar', Auth.isLoggedInUser, Auth.checkLevel([3.5, 4, 5, 6, 7]), (req, res) => {
    Creditos.listar({})
        .then(function(dados){
            // Tratamento do formato do ID
            var output = dados.map(obj => {
                return {
                    ...obj._doc,
                    _id: {
                        $oid : obj._doc._id
                    } 
                }
            });
            // Encoding 
            var data = JSON.stringify(output, null, 2);
            res.setHeader('Content-disposition', 'attachment; filename= colaboracoes.json');
            res.setHeader('Content-type', 'application/json');
            res.write(data, function (err) {
                res.end()
            })
        })
        .catch(erro => res.status(500).send(`Erro na exportação das colaborações: ${erro}`))
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
router.post('/', Auth.isLoggedInUser, Auth.checkLevel([3.5, 4, 5, 6, 7]), [
    existe("body", "nome"),
    existe("body", "filiacao"),
    existe("body", "funcao"),
    existe("body", "desc").optional(),
    dataValida("body", "data_inicio").optional(),
    dataValida("body", "data_fim").optional()
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

// Importação de um ficheiro com registos - Pode ser adição (append) à BD ou substituição (drop)
router.post('/importar', Auth.isLoggedInUser, Auth.checkLevel([3.5, 4, 5, 6, 7]), (req, res) => {
    var form = new formidable.IncomingForm()
    form.parse(req, async (error, fields, formData) => {
        if(!error){
            // Verificar os operacao e ficheiro
            if(fields.opcao && formData.file && formData.file.type && formData.file.path){
                fs.readFile(formData.file.path, 'utf8', function read(err, data) {
                    if (err) {
                        res.status(500).json(`Erro na importação das colaborações: ${err}`)
                    }
                    else {
                        if(fields.opcao === 'adição'){
                            // Parsing dos dados
                            var dados = JSON.parse(data)
                            // Chamada do controlador de append 
                            Creditos.append(dados)
                                .then(dados => res.jsonp(dados))
                                .catch(erro => res.status(500).jsonp(erro))
                        }
                        else if(fields.opcao === 'substituição'){
                            // Parsing dos dados
                            var dados = JSON.parse(data)
                            // Chamada do controlador de drop e povoamento da BD
                            Creditos.replace(dados)
                                .then(dados => res.jsonp(dados))
                                .catch(erro => res.status(500).jsonp(erro))
                        }
                        else{
                            res.status(500).json(`Erro na importação: as opções são "adição" ou "substituição."`)
                        } 
                    }
                });
            }
            else {
                res.status(500).json(`Erro nos campos da importação: deve fornecer um ficheiro e a opção.`)
            }
        }
        else {
            res.status(500).json(`Erro na importação das colaborações: ${error}`)
        }
    })
})


// Update de um crédito
router.put('/:id', Auth.isLoggedInUser, Auth.checkLevel([3.5, 4, 5, 6, 7]), [
    eMongoId('param', 'id'),
    existe("body", "nome"),
    existe("body", "filiacao"),
    existe("body", "funcao"),
    existe("body", "desc").optional(),
    dataValida("body", "data_inicio").optional(),
    dataValida("body", "data_fim").optional()
], (req, res) => {
    const errors = validationResult(req)

    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }
    Creditos.update(req.params.id, req.body)
        .then(dados => {
            if(dados) res.jsonp("Colaboração modificada com sucesso.")
            else res.status(500).jsonp("Erro na modificação da colaboração com identificador: " + req.params.id)
        })
        .catch(erro => res.status(500).jsonp("Erro na modificação da colaboração com identificador " + req.params.id + ": " + erro))
})

// Apagar um crédito
router.delete('/:id', Auth.isLoggedInUser, Auth.checkLevel([3.5, 4, 5, 6, 7]), [
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
