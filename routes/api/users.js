var express = require('express');
var router = express.Router();

var User = require('../../models/user');

router.get('/', (req, res) => {
    User.find({}, function(err, users){
        if (err) {
            throw err;
        }else {
            jsonObj = [];
            for(var i = 0; i < users.length; i++) {
                item = {}
                item["name"] = users[i].name;
                item["level"] = users[i].level;
                item["email"] = users[i].email;
                item["id"] = users[i]._id;
                jsonObj.push(item);
            }
        }

        return res.send(jsonObj);
    });
});

module.exports = router;