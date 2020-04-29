var Auth = require('../../controllers/auth.js');
var Parametros = require('../../controllers/api/parametros');

var express = require('express');
var router = express.Router();

const { oneOf, validationResult } = require('express-validator');
const { estaEm, vcParametros, eExpiresTime, vcParametrosExpires } = require('../validation')

router.get('/', Auth.isLoggedInUser, Auth.checkLevel(7), (req, res) => {
    try{
        var dados = Parametros.getParameters()
        res.jsonp(dados)
    }catch(erro){
        res.status(500).send(`Erro: ${erro}`)
    }
})

router.get('/:parametro', Auth.isLoggedInUser, Auth.checkLevel(7), [
    estaEm('param', 'parametro', vcParametros)
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    try{
        var dados = Parametros.getParameter(req.params.parametro)
        res.jsonp(dados)
    }catch(erro){
        res.status(500).send(`Erro: ${erro}`)
    }
})

router.put('/:parametro', Auth.isLoggedInUser, Auth.checkLevel(7), [
    estaEm('param', 'parametro', vcParametros),
    eExpiresTime('body', "valor", (v, {req}) => {return vcParametrosExpires.includes(req.params.parametro)} /*apenas verifica se for para os parametros expire*/)
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    try{
        Parametros.setParameter(req.params.parametro, req.body.valor)
        res.jsonp(`Parâmetro ${req.params.parametro} atualizado com sucesso`)
    }catch(erro){
        res.status(500).send(`Erro: ${erro}`)
    }
})

module.exports = router;
