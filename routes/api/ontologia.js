var Auth = require('../../controllers/auth.js');
var Ontologia = require('../../controllers/api/ontologia.js');
const normalizeOrdered = require('../../controllers/api/utils').normalizeOrdered

var express = require('express');
var router = express.Router();

const { oneOf, validationResult } = require('express-validator');
const { existe, estaEm, vcOntoFormats, vcBoolean } = require('../validation')

router.get('/', Auth.isLoggedInKey, [
    oneOf([
        estaEm('query', 'fs', vcOntoFormats).optional(),
        estaEm('header', 'accept', vcOntoFormats).optional()
    ]),
    existe("query", "inferencia")
        .bail()
        .isBoolean()
        .withMessage("Não é um valor booleano ('true', 'false')")
        .optional()
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    var format
    if(req.query.fs && formats.includes(req.query.fs)){
        format = req.query.fs
    } else format = req.headers.accept

    Ontologia.exportar(req.query.inferencia, format, 7)
        .then(dados => res.download(dados[0], "clav." + dados[1]))
        .catch(erro => res.status(500).send(`Erro: ${erro}`))
})

router.get('/data', Auth.isLoggedInKey, (req, res) => {
    Ontologia.data()
        .then(dados => res.json(dados))
        .catch(erro => res.status(500).send(`Erro ao obter data da ontologia: ${erro}`))
})

router.get('/descricao', Auth.isLoggedInKey, (req, res) => {
    Ontologia.descricao()
        .then(dados => res.json(dados))
        .catch(erro => res.status(500).send(`Erro ao obter data da ontologia: ${erro}`))
})

router.post('/', Auth.isLoggedInUser, Auth.checkLevel(7), [
    existe("body", "query")
        .bail()
        .isString()
        .withMessage("A query não é uma string"),
    estaEm("body", "normalizado", vcBoolean).optional()
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    Ontologia.executa(req.body.query)
        .then(dados => {
            if(!dados){
                dados = "Sucesso na query de update"
            }else if(!req.body.normalizado || req.body.normalizado != "Não"){
                dados = normalizeOrdered(dados)
            }
            res.json(dados)
        })
        .catch(erro => {
            if(erro.response && erro.response.data){
                erro = "\n\n" + erro.response.data
            }
            res.status(500).send(`Erro ao executar query: ${erro}`)
        })
})

module.exports = router;
