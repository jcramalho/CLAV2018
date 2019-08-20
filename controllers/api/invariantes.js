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
            }catch(erro) { throw (erro) }
        }else{
            throw ("Invariante não encontrado!")
        }

    }else{
        throw ("Grupo de invariantes não encontrado!")
    }
}

// Lista todos os invariantes disponíveis
Invariantes.listar = () => {
    return invs.invariantes
}
