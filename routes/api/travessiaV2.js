var Trav = require('../../controllers/travessia.js');

var express = require('express');
var router = express.Router();

router.get('/', async (req, res) => {
    try {
        res.jsonp(await Trav.loadTravessiasV2())
    } catch (error) {
        res.status(500).send(`Erro no carregamento das travessias: ${error}`)
    }
})

module.exports = router;
