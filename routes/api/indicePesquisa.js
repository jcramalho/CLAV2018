var Auth = require('../../controllers/auth.js');
var State = require('../../controllers/state.js')

var express = require('express');
var router = express.Router();

// Devolve o Índice Invertido de NotasAp, ExemplosNotasAp e Termos de Índice
router.get('/', Auth.isLoggedInKey, async (req, res) => {
    try {
        res.jsonp(await State.getIndicePesquisa()) 
    } catch(err) {
        res.status(500).send(`Erro na recuperação do índice de pesquisa: ${err}`)
    }
})

module.exports = router;
