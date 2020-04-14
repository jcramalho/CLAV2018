const execQuery = require('../../controllers/api/utils').execQuery
const normalizeOrdered = require('../../controllers/api/utils').normalizeOrdered
const Ontologia = require('../../controllers/api/ontologia')
const Invariantes = module.exports
const fs = require('fs')
const invsFile = fs.readFileSync('public/invariantes/invariantes.json')
const invs = JSON.parse(invsFile).invariantes

// Obtém invariante da lista de invariantes
function findInv(idRel, idInv) {
    var rel = null
    var inv = null
    var i = 0
    var nRels = invs.length

    while(i<nRels && rel == null){
        if(invs[i].idRel == idRel) rel = invs[i]
        else i++
    }

    if(rel != null){
        i = 0
        var nInvs = rel.invs.length

        while(i<nInvs && inv == null){
            if(rel.invs[i].idInv == idInv) inv = rel.invs[i]
            else i++
        }
    }

    return [rel, inv]
}

// Devolve os erros de um invariante dado o id da relação e o id do invariante
Invariantes.getErros = async (idRel,idInv) => {
    var found = findInv(idRel, idInv)
    var rel = found[0]
    var inv = found[1]

    if(inv != null){
        try{
            var res = {}
            res.descRel = rel.desc
            res.descInv = inv.desc
            res.isFixable = "queryFix" in inv && inv.queryFix != null && inv.queryFix.length > 0
            var results = await execQuery("query", inv.query)
            res.results = normalizeOrdered(results)
            return res    
        }catch(erro) {
            throw (erro) 
        }
    }else{
        throw ("Invariante não encontrado!")
    }
}

//devolve os erros de todos os invariantes, devolve apenas os invariantes que possuem erros
Invariantes.getTodosErros = async () => {
    var res = []
    var results, i, j, n = 0
    var nRels = invs.length
    var nInvs

    for(i=0; i<nRels; i++){
        nInvs = invs[i].invs.length
        for(j=0; j<nInvs; j++){
            results = await execQuery("query", invs[i].invs[j].query)
            results = normalizeOrdered(results)
            if(results.length!=0){
                res[n] = {}
                res[n].idRel = invs[i].idRel
                res[n].idInv = invs[i].invs[j].idInv
                res[n].descRel = invs[i].desc
                res[n].descInv = invs[i].invs[j].desc
                res[n].isFixable = "queryFix" in invs[i].invs[j] && invs[i].invs[j].queryFix != null && invs[i].invs[j].queryFix.length > 0
                res[n].results = results
                n++    
            }
        }
    }

    return res
}

// Lista todos os invariantes disponíveis
Invariantes.listar = () => {
    return invs
}

//Inserção de triplos para corrigir erros de invariantes
Invariantes.fixErros = async (idRel, idInv) => {
    var inv = findInv(idRel, idInv)[1]

    if(inv){
        if(inv.queryFix){
            try{
                var triplesToInsert = await execQuery("query", inv.queryFix)
                var insertQuery = `INSERT DATA{
                    ${triplesToInsert}
                }`

                await execQuery("update", insertQuery)
                await Ontologia.atualizaData()
                return "Erros do invariante corrigidos"
                //Quando inclui muitas queries o pedido é bastante pesado
                //var askQuery = `ASK {
                //    ${triplesToInsert}
                //}`
                //result = await execQuery("query", askQuery)

                //if(result.boolean) return "Erros do invariante corrigidos"
                //else throw("Ocorreu um erro ao corrigir os erros dos invariantes")
            }catch(erro){
                throw(erro)
            }
        }else{
            throw("Os erros deste invariante não podem ser corrigidos através desta rota.")
        }
    }else{
        throw ("Invariante não encontrado!")
    }   
}
