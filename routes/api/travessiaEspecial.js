var Travessia = require('../../controllers/travessiaEspecial.js');

var express = require('express');
var router = express.Router();

const { body, validationResult } = require('express-validator');
const { existe, verificaClasseCodigo, vcClassesTipo, estaEm } = require('../validation')

router.get('/', async (req, res) => {
    try {
        res.jsonp(await Travessia.travessias())
    } catch (error) {
        res.status(500).send(`Erro no carregamento das travessias especiais: ${error}`)
    }
})

router.get('/:id', [
    verificaClasseCodigo("param", "id"),
    estaEm('query', 'filtro', vcClassesTipo).optional()
], async function(req,res){
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    if(req.query.filtro){
        Travessia.travessiaFiltro(req.params.id, req.query.filtro)
            .then(dados => res.jsonp(dados))
            .catch((err) => res.status(500).send(`Erro na travessia especial do processo ${req.params.id} com filtro ${req.query.filtro}: ${err}`))
    }else{
        Travessia.travessia(req.params.id)
            .then(dados => res.jsonp(dados))
            .catch((err) => res.status(500).send(`Erro na travessia especial do processo ${req.params.id}: ${err}`))
    }
})

module.exports = router;
