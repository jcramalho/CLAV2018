var Auth = require('../../controllers/auth.js');
var Noticias = require('../../controllers/api/noticias.js')
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

var validKeys = ["titulo", "desc", "data", "ativa"];
const { validationResult } = require('express-validator');
const { existe, estaEm, dataValida, eMongoId, vcNotRec } = require('../validation')

// Lista todas as noticias: data, titulo, desc
router.get('/', Auth.isLoggedInKey, [
    existe("query", "titulo").optional(),
    existe("query", "desc").optional(),
    dataValida("query", "data").optional(),
    existe("query", "ativa")
        .bail()
        .isBoolean()
        .withMessage("Não é um valor booleano ('true', 'false')")
        .optional(),
    estaEm("query", "recentes", vcNotRec).optional()
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    var queryData = url.parse(req.url, true).query;
    
    var filtro = Object.entries(queryData)
        .filter(([k, v]) => validKeys.includes(k))

    filtro = Object.assign({}, ...Array.from(filtro, ([k, v]) => ({[k]: v}) ));
    
    // api/noticias?recentes=sim
    if (queryData.recentes) {
        Noticias.recentes()
            .then(dados => res.jsonp(dados))
		    .catch(erro => res.status(500).send(`Erro na listagem das noticias recentes: ${erro}`))
	} else {
        Noticias.listar(filtro)
            .then(dados => res.jsonp(dados))
            .catch(erro => res.status(500).send(`Erro na listagem das noticias: ${erro}`))
    }
})

// Devolve um ficheiro com todos os registos em formato pronto a importar no MongoDB
router.get('/exportar', Auth.isLoggedInUser, Auth.checkLevel([3.5, 4, 5, 6, 7]), (req, res) => {
    Noticias.listar({})
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
            res.setHeader('Content-disposition', 'attachment; filename= noticias.json');
            res.setHeader('Content-type', 'application/json');
            res.write(data, function (err) {
                res.end()
            })
        })
        .catch(erro => res.status(500).send(`Erro na exportação das notícias: ${erro}`))
})

// Consulta de uma noticia: titulo, data, desc
router.get('/:id', Auth.isLoggedInKey, [
    eMongoId('param', 'id')
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Noticias.consultar(req.params.id)
        .then(dados => dados ? res.jsonp(dados) : res.status(404).send(`Erro. A noticia '${req.params.id}' não existe`))
	    .catch(erro => res.status(500).send(`Erro na consulta da noticia '${req.params.id}': ${erro}`))
})

// Update de uma Noticia
router.put('/:id', Auth.isLoggedInUser, Auth.checkLevel([3.5, 4, 5, 6, 7]), [
    eMongoId('param', 'id'),
    existe("body", "titulo"),
    existe("body", "desc"),
    dataValida("body", "data"),
    existe("body", "ativa")
        .bail()
        .isBoolean()
        .withMessage("Não é um valor booleano ('true', 'false')")
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Noticias.update(req.params.id, req.body.titulo, req.body.desc, req.body.data, req.body.ativa)
        .then(dados => {
            if(dados) res.jsonp("Noticia modificado com sucesso")
            else res.status(500).jsonp("Erro na modificação da Noticia "+req.params.id)
        })
        .catch(erro => res.status(500).jsonp("Erro no update da Noticia "+req.params.id+": " + erro))
})

// Adiciona uma noticia
router.post('/', Auth.isLoggedInUser, Auth.checkLevel([3.5, 4, 5, 6, 7]), [
    existe("body", "titulo"),
    existe("body", "desc"),
    dataValida("body", "data"),
    existe("body", "ativa")
        .bail()
        .isBoolean()
        .withMessage("Não é um valor booleano ('true', 'false')")
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Noticias.criar(req.body)
        .then(dados => {
            if(dados) res.jsonp("Noticia adicionada com sucesso")
            else res.status(500).jsonp("Erro na adição da Noticia " + req.body.titulo)
        })
        .catch(erro => res.status(500).jsonp("Erro na adição da Noticia "+req.body.titulo+": " + erro))
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
                        res.status(500).json(`Erro na importação das notícias: ${err}`)
                    }
                    else {
                        if(fields.opcao === 'adição'){
                            // Parsing dos dados
                            var dados = JSON.parse(data)
                            // Chamada do controlador de append 
                            Noticias.append(dados)
                                .then(dados => res.jsonp(dados))
                                .catch(erro => res.status(500).jsonp(erro))
                        }
                        else if(fields.opcao === 'substituição'){
                            // Parsing dos dados
                            var dados = JSON.parse(data)
                            // Chamada do controlador de drop e povoamento da BD
                            Noticias.replace(dados)
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
            res.status(500).json(`Erro na importação das notícias: ${error}`)
        }
    })
})


router.delete('/:id', Auth.isLoggedInUser, Auth.checkLevel([3.5, 4, 5, 6, 7]), [
    eMongoId('param', 'id')
], function(req, res) {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Noticias.eliminar(req.params.id, function(err, user){
        if(err){
            res.status(500).send("Não foi possível eliminar a notícia!");
        }else{
            res.send('Notícia eliminada com sucesso!');
        }
    })
});

module.exports = router;
