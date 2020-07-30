var express = require('express');
var router = express.Router();

const { validationResult } = require('express-validator');
const { existe } = require('../validation')

router.get('/', [
    existe("query", "caminho")
        .bail()
        .customSanitizer(decodeURIComponent)
        //impede que tentem aceder a ficheiros fora da pasta public
        .customSanitizer(v => {
            if(!v.startsWith("/")){
                v = "/" + v
            }
            return v.replace(/\/\.\.\/(\.\.\/)*/g, "/")
        })
        .isURL({
            require_tld: false,
            require_host: false,
            require_valid_protocol: false
        })
        .withMessage("Não é um caminho válido")
], (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).jsonp(errors.array())
    }

    res.download("./public" + req.query.caminho, (err) => {
        if(err) res.status(404).send("Not Found")
    })
})

module.exports = router;
