/**
 * Carrega todas as travessias dos PNs
 */
var Trav = [];
var travessias = [];
const fs = require('fs')

exports.reset = async () => {
    try {
        console.debug("Loading travessias")
        Trav = require('../public/travessia/travessia.json');
        for(var i = 0; i < Trav.length; i++){
            travessias[Trav[i].processo] = Trav[i].travessia
        }
        console.debug("Travessia completa")
        return "Reset efetuado com sucesso!"
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

exports.novaTravessia = async (newTrav) => {
    try {
        fs.writeFileSync("./public/travessia/travessia.json", JSON.stringify(newTrav), function(err){
            if(err) {
                return `Erro a guardar ficheiro: ${err}`
            }
            return "Ficheiro com as travessias atualizado!"
        })
    } catch (error) {
        return `Erro: ${error}`
    }
}

exports.loadTravessias = async () => { return Trav}
