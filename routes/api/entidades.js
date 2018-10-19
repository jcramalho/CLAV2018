var Logging = require('../../controllers/logging');
var Auth = require('../../controllers/auth.js');
var Entidades = require('../../controllers/api/entidades.js');

var express = require('express');
var router = express.Router();

// TODO: Este GET id esta a devolver uma lista, e não um objecto singular!!
router.get('/:id', function (req, res) {
    Entidades.stats(req.params.id)
        .then(stats => res.send(stats))
        .catch(function (error) {
            console.error("Chamada de dados de uma org: " + error);
        });
})

/* TODO: refacter put */
router.put('/:id', function (req, res) {
    var dataObj = req.body;

    //Executing queries
    Entidades.checkAvailability(dataObj.name)
        .then(function (count) {
            if (count > 0) {
                res.send("Designação já existentente!");
            }
            else {
                Entidades.updateEntidade(dataObj)
                    .then(function () {
                        Logging.logger.info('Update a entidade \'' + req.params.id + '\' por utilizador \'' + req.user._id + '\'');

                        req.flash('success_msg', 'Info. de Entidade atualizada');
                        res.send(dataObj.id);
                    })
                    .catch(error => console.error(error));
            }
        })
        .catch(error => console.error("Initials error:\n" + error));

})


router.get('/', Entidades.list);
router.post('/', Entidades.isAvailable, Entidades.create);
//router.get('/:id', Entidades.detail);
//router.put('/:id', Entidades.isAvailable, Entidades.update);
router.delete('/:id', Entidades.delete);
router.get('/:id/tipologias', Entidades.tipologias);
router.get('/:id/dominio', Entidades.dominio);
router.get('/:id/participacoes', Entidades.participacoes);

module.exports = router;