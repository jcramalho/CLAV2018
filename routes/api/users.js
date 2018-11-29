var express = require('express');
var router = express.Router();

var User = require('../../models/user');

router.get('/listagem', (req, res) => {
    User.find({}, function(err, users){
        if (err) {
            throw err;
        }else {
            jsonObj = [];
            for(var i = 0; i < users.length; i++) {
                item = {}
                item["name"] = users[i].name;
                switch(users[i].level) {
                    case 7:
                        item["level"] = 'Administrador de Perfil Tecnológico (Nível 7)';
                        break;
                    case 6:
                        item["level"] = 'Administrador de Perfil Funcional (Nível 6)';
                        break;
                    case 5:
                        item["level"] = 'Utilizador Validador (Nível 5)';
                        break;
                    case 4:
                        item["level"] = 'Utilizador Avançado (Nível 4)';
                        break;
                    case 3:
                        item["level"] = 'Utilizador Decisor (Nível 3)';
                        break;
                    case 2:
                        item["level"] = 'Utilizador Simples (Nível 2)';
                        break;
                    case 1:
                        item["level"] = 'Representante Entidade (Nível 1)'
                        break;
                    case -1:
                        item["level"] = 'Utilizador desativado (Nível -1)'
                        break;
                }
                item["email"] = users[i].email;
                item["id"] = users[i]._id;
                jsonObj.push(item);
            }
        }
        return res.send(jsonObj);
    });
});


router.get('/getEmail/:id', function(req, res) {
    User.findOne({_id: req.params.id}, function(err, user){
		if (err) {	
			throw err;
		} else {
            return res.send(user)
        }
	});
});

module.exports = router;