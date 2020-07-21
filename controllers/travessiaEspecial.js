var State = require('./state.js')
var Travessia = require('./travessia.js');

var travessias = []

function getClasse(classes, codigo){
    var aux = codigo.split('.')
    var codigos = [aux[0]]

    for(var w = 1; w < aux.length; w++)
        codigos.push(codigos[w-1] + "." + aux[w]) 

    var classe = null
    for(var j = 0; j < codigos.length; j++){
        classe = null

        for(var i=0; i < classes.length && classe == null; i++)
            if(classes[i].codigo == codigos[j])
                classe = classes[i]

        if(classe)
            classes = classe.filhos
    }

    return classe
}

module.exports.reset = async () => {
    try {
        console.debug("A criar dicionário da travessia especial...")

        travessias = []
        var classes = await State.getAllClassesInfo()
        var travs = await Travessia.loadTravessias()

        for(trav of travs){
            var t = {
                codigo: trav.processo,
                fecho: []
            }
            
            for(c of trav.travessia){
                var classe = getClasse(classes, c)

                if(classe){
                    t.fecho.push({
                        codigo: c,
                        tipoProc: classe.tipoProc,
                        donos: classe.donos.map(d => d.idDono),
                        participantes: classe.participantes.map(p => p.idParticipante)
                    })
                }
            }

            travessias.push(t)
        }

        console.debug("Dicionário da travessia especial criado.")

        return "Reset efetuado com sucesso!"
    } catch (err) {
        throw err
    }
}

module.exports.travessia = async (id) => {
    var travessia = null

    for(var i = 0; i < travessias.length && !travessia; i++){
        if(travessias[i].codigo == id)
            travessia = travessias[i].fecho
    }
    
    if(!travessia)
        throw ("Não existe travessia especial para o processo " + id)

    return travessia
}

module.exports.travessiaFiltro = async (id, tipoProc) => {
    if(tipoProc == 'comum')
        tipoProc = "Processo Comum"
    else if(tipoProc == 'especifico')
        tipoProc = "Processo Específico"

    var travessia = JSON.parse(JSON.stringify(await module.exports.travessia(id)))
    var res = []
    
    for(t of travessia){
        if(t.tipoProc == tipoProc)
            res.push(t)
    }

    return res
}

module.exports.travessias = async () => { return travessias }
