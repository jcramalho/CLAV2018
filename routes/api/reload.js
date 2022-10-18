var State = require('../../controllers/state.js');
var express = require('express');
var router = express.Router();

router.get('/cache', (req, res) => {
    State.reload()
        .then(() => {
            res.send("Cache: RELOADED")
        })
        .catch(erro => {
            res.status(500).send("Erro ao realizar o reload da cache sistema: " + erro)
        })
    })

module.exports = router;
