var Auth = require('../../controllers/auth.js');
var State = require('../../controllers/state.js');
var express = require('express');
var router = express.Router();

router.get('/cache', Auth.isLoggedInUser, Auth.checkLevel(7), (req, res) => {
    State.reload()
        .then(() => {
            res.send("Cache: RELOADED")
        })
        .catch(erro => {
            res.status(500).send("Erro ao realizar o reload da cache sistema: " + erro)
        })
    })

module.exports = router;
