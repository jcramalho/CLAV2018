var express = require('express');
var router = express.Router();
var Auth = require('../../controllers/auth.js');
var ApiStats = require('../../controllers/api/stats');

router.get('/', Auth.isLoggedInUser, Auth.checkLevel(6), (req, res) => {
    ApiStats.getStats(function(err, result){
        if(err){
            return res.status(500).send(`Erro: ${err}`);
        }else{
            return res.json(result);
        }
    });
});

router.get('/total', Auth.isLoggedInUser, Auth.checkLevel(6), (req, res) => {
    ApiStats.getCallCount(function(err, result){
        if(err){
            return res.status(500).send(`Erro: ${err}`);
        }else{
            return res.json(result);
        }
    });
});


module.exports = router;
