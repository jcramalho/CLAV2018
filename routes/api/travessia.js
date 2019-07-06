var Trav = require('../../controllers/travessia.js');

var express = require('express');
var router = express.Router();

router.get('/', async (req, res) => {
    try {
        res.jsonp(await Trav.loadTravessias())
    } catch (error) {
        res.status(500).send(`Erro no carregamento das travessias: ${err}`)
    }
})

router.get('/:id', async function(req,res){
    try {
        res.jsonp(await Trav.travProc(req.params.id))
    } catch (err) {
        res.status(500).send('Erro na travessia do processo: ' + req.params.id + `: ${err}`)
    }
})

module.exports = router;