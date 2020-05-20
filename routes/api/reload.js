var State = require('../../controllers/state.js');
var express = require('express');
var router = express.Router();

router.get('/cache', async (req, res) => {
    try{
        res.send("A realizar o reload da cache do sistema! Pode demorar alguns minutos. Veja o output log do sistema para ver se foi efetuado com sucesso...")
        await State.reload()
    } catch(erro) {
        res.status(500).send("Erro ao realizar o reload da cache sistema: " + erro)
    }
})

module.exports = router;
