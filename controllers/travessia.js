/**
 * Carrega todas as travessias dos PNs
 */
var Trav = [];
var travessias = {};
const fs = require('fs')
var TravessiaEspecial = require('./travessiaEspecial.js')

exports.reset = async () => {
    try {
        console.debug("Loading travessias")
        travessias = {}
        Trav = require('../public/travessia/travessia.json');
        for(var i = 0; i < Trav.length; i++){
            travessias[Trav[i].processo] = Trav[i].travessia
        }
        console.debug("Travessia completa")

        //dicionário da travessia especial
        await TravessiaEspecial.reset()

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
        fs.writeFileSync("./public/travessia/travessia.json", JSON.stringify(newTrav))
        return "Ficheiro com as travessias atualizado!"
    } catch (error) {
        return `Erro: ${error}`
    }
}

exports.loadTravessias = async () => { return Trav}

exports.loadTravessiasV2 = async () => { return travessias }
