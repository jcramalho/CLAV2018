var Auth = require('../../controllers/auth.js');
var AggregateLogs = require('../../controllers/api/aggregateLogs.js');

var express = require('express');
var router = express.Router();

router.get('/', Auth.isLoggedInUser, Auth.checkLevel(6), async (req, res) => {

    if (req.query.tipo && req.query.id) {
        AggregateLogs.getAggregateLog(req.query.id, req.query.tipo)
            .then(data => res.jsonp(data))
            .catch(error => res.status(500).send(`Erro ao obter os logs agregados de ${req.query.tipo} com o id ${req.query.id}: ${error}`))
    } else {
        AggregateLogs.getAllAggregateLogs()
            .then(data => res.jsonp(data))
            .catch(error => res.status(500).send(`Erro ao obter os logs agregados: ${error}`))
    }
})

module.exports = router;
