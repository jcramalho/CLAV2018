var Auth = require('../../controllers/auth.js');
var Trav = require('../../controllers/travessia.js');

var express = require('express');
var router = express.Router();

router.get('/', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 4, 5, 6, 7]), async (req, res) => {
    try {
        res.jsonp(await Trav.loadTravessias())
    } catch (error) {
        res.status(500).send(`Erro no carregamento das travessias: ${error}`)
    }
})

router.get('/:id', Auth.isLoggedInUser, Auth.checkLevel([1, 3, 4, 5, 6, 7]), async function(req,res){
    try {
        res.jsonp(await Trav.travProc(req.params.id))
    } catch (err) {
        res.status(500).send('Erro na travessia do processo: ' + req.params.id + `: ${err}`)
    }
})

// Post de uma nova travessia (enviada pela aplicação de travessias )
router.post('/', Auth.isLoggedInUser, Auth.checkLevel(7), async (req, res) => {
    try {
        res.jsonp(await Trav.novaTravessia(req.body))
    } catch (err) {
        res.status(500).send(`Erro na criação de uma nova travessia: ${err}`)
    }
})

module.exports = router;
