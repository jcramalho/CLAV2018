var Auth = require('../../controllers/auth.js');
const nanoid = require('nanoid')

var express = require('express');
var router = express.Router();

router.get('/id', (req, res) => {
    res.send(nanoid())
})

module.exports = router;
