var Trav = require('../../controllers/travessia.js');

var express = require('express');
var router = express.Router();

const { body, validationResult } = require('express-validator');
const { existe, verificaClasseCodigo, verificaLista } = require('../validation')

router.get('/', async (req, res) => {
    try {
        res.jsonp(await Trav.loadTravessias())
    } catch (error) {
        res.status(500).send(`Erro no carregamento das travessias: ${error}`)
    }
})

router.get('/reset', async function(req,res){
    try {
        res.jsonp(await Trav.reset())
    } catch (err) {
        res.status(500).send(`Erro ao fazer reset das travessias: ${err}`)
    }
})

router.get('/:id', [
    verificaClasseCodigo("param", "id")
], async function(req,res){
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    try {
        res.jsonp(await Trav.travProc(req.params.id))
    } catch (err) {
        res.status(500).send(`Erro na travessia do processo ${req.params.id}: ${err}`)
    }
})

// Post de uma nova travessia (enviada pela aplicação de travessias )
router.post('/', [
    body().isArray().withMessage("Não é um array"),
    verificaClasseCodigo('body', '*.processo'),
    verificaLista('body', '*.travessia'),
    verificaClasseCodigo('body', '*.travessia.*')
], async (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    try {
        res.jsonp(await Trav.novaTravessia(req.body))
    } catch (err) {
        res.status(500).send(`Erro na criação de uma nova travessia: ${err}`)
    }
})

module.exports = router;
