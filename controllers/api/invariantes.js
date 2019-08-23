const client = require('../../config/database').onthology
const normalizeOrdered = require('../../controllers/api/utils').normalizeOrdered
const Invariantes = module.exports
const fs = require('fs')
const invsFile = fs.readFileSync('public/invariantes/invariantes.json')
const invs = JSON.parse(invsFile)

// Devolve os erros de um invariante dado o id da relação e o id do invariante
Invariantes.getErros = async (idRel,idInv) => {
    var rel = null
    var i = 0
    var nRels = invs.invariantes.length

    while(i<nRels && rel == null){
        if(invs.invariantes[i].idRel == idRel) rel = invs.invariantes[i]
        else i++
    }

    if(rel != null){
        var inv = null
        i = 0
        var nInvs = rel.invs.length

        while(i<nInvs && inv == null){
            if(rel.invs[i].idInv == idInv) inv = rel.invs[i]
            else i++
        }

        if(inv != null){
            try{
                var res = {}
                res.descRel = rel.desc
                res.descInv = inv.desc
                var results = await client.query(inv.query).execute()
                res.results = normalizeOrdered(results)
                return res    
            }catch(erro) {
                throw (erro) 
            }
        }else{
            throw ("Invariante não encontrado!")
        }

    }else{
        throw ("Relação não encontrada!")
    }
}

//devolve os erros de todos os invariantes, devolve apenas os invariantes que possuem erros
Invariantes.getTodosErros = async () => {
    var res = []
    var results, i, j, n = 0
    var nRels = invs.invariantes.length
    var nInvs

    for(i=0; i<nRels; i++){
        nInvs = invs.invariantes[i].invs.length
        for(j=0; j<nInvs; j++){
            results = await client.query(invs.invariantes[i].invs[j].query).execute()
            results = normalizeOrdered(results)
            if(results.length!=0){
                res[n] = {}
                res[n].descRel = invs.invariantes[i].desc
                res[n].descInv = invs.invariantes[i].invs[j].desc
                res[n].results = results
                n++    
            }
        }
    }

    return res
}

// Lista todos os invariantes disponíveis
Invariantes.listar = () => {
    return invs.invariantes
}
