var express = require('express');
var router = express.Router();
var jwt =  require('jsonwebtoken');
var Auth = require('./../../controllers/auth')
var Key = require('./../../models/keys');
var secretKey = require('./../../config/app');

router.get('/listagem', Auth.isLoggedIn, Auth.checkLevel6, (req, res) => {
    Key.find({}, function(err, keys){
        if (err) {
            throw err;
        }else {
            jsonObj = [];
            for(var i = 0; i < keys.length; i++) {
                item = {}
                jwt.verify(keys[i].key, secretKey.key, function(err, decoded){
                    item["expDate"] = new Date(decoded.exp*1000).toUTCString();
                });
                item["id"] = keys[i]._id;
                item["key"] = keys[i].key;
                item["ncalls"] = keys[i].nCalls;
                item["created"] = keys[i].created.toUTCString();
                if(keys[i].lastUsed!=null)
                    item["lastused"] = keys[i].lastUsed.toUTCString();
                else
                    item["lastused"] = 'Nunca';
                if(keys[i].active==true)
                    item["active"] = 'Sim'
                else
                    item["active"] = 'Não';
                jsonObj.push(item);
            }
        }
        return res.send(jsonObj);
    });
});

module.exports = router;