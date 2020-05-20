var Noticias = require('../../controllers/api/noticias.js')
var url = require('url')

var express = require('express')
var router = express.Router()

var validKeys = ["titulo", "desc", "data", "ativa"];
const { validationResult } = require('express-validator');
const { existe, estaEm, dataValida, eMongoId, vcNotRec } = require('../validation')

// Lista todas as noticias: data, titulo, desc
router.get('/', [
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

// Consulta de uma noticia: titulo, data, desc
router.get('/:id', [
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
router.put('/:id', [
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
router.post('/', [
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

router.delete('/:id', [
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
