/**
 * Carrega todas as travessias dos PNs
 */
var Trav = [];
var travessias = [];

exports.reset = async () => {
    try {
        console.debug("Loading travessias")
        Trav = require('../public/travessia/travessia.json');
        for(var i = 0; i < Trav.length; i++){
            travessias[Trav[i].processo] = Trav[i].travessia
        }
        console.debug("Travessia completa")
    } catch (err) {
        throw err
    }
}

exports.travProc = async (id) => {
    try {
        return travessias[id]
    } catch (err) {
        throw err
    }
}

exports.loadTravessias = async () => { return Trav}