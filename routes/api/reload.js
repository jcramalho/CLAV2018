var Auth = require('../../controllers/auth.js');
var Travessia = require('../../controllers/travessia.js');
var State = require('../../controllers/state.js');
var express = require('express');
var router = express.Router();

router.get('/cache', Auth.isLoggedInUser, Auth.checkLevel(7), async (req, res) => {
    try{
        await Travessia.reset()
        await State.reload()
        res.send("Reload da cache sistema efetuado com sucesso!")
    } catch(erro) {
        res.status(500).send("Erro ao realizar o reload da cache sistema: " + erro)
    }
})

module.exports = router;
