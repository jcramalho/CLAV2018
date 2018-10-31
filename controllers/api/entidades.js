const client = require('../../config/database').onthology;
var Pedidos = require('../../controllers/api/pedidos');

var Entidades = module.exports

// TODO: Este GET id esta a devolver uma lista, e não um objecto singular!!
// Ainda não posso substituir porque a interface está a contar com uma lista
Entidades.stats = function (id) {
    return client.query(`
        SELECT * where {
            clav:${id} clav:entDesignacao ?Designacao ;
                clav:entSigla ?Sigla ;
                clav:entEstado ?Estado ;
                clav:entInternacional ?Internacional .
        }`
    )
        .execute()
        //getting the content we want
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error("Dados de uma org: " + error);
        });
}

Entidades.checkAvailability = function (name, initials) {
    var checkQuery = `
        SELECT (count(*) as ?Count) where { 
            { ?t clav:tipSigla ?s ; clav:tipDesignacao ?n . }
            UNION
            { ?e clav:entSigla ?s ; clav:entDesignacao ?n .
            }
            filter (?s='${initials}' || ?n='${name}').
        }
    `;

    return client.query(checkQuery).execute()
        //Getting the content we want
        .then(response => Promise.resolve(response.results.bindings[0].Count.value))
        .catch(function (error) {
            console.error("Error in check:\n" + error);
        });
}

Entidades.updateEntidade = function (dataObj) {

    function prepDelete(dataObj) {
        let ret = "";

        if (dataObj.domain.del && dataObj.domain.del.length) {
            for (let process of dataObj.domain.del) {
                ret += `\tclav:${process.id} clav:temDono clav:${dataObj.id} .\n`;
            }
        }

        for (const pType in dataObj.parts) {
            if (dataObj.parts[pType].del && dataObj.parts[pType].del.length) {
                for (let p of dataObj.parts[pType].del) {
                    ret += "\tclav:" + p.id + " clav:temParticipante" + pType + " clav:" + dataObj.id + " .\n";
                }
            }
        }

        if (dataObj.tipols.del && dataObj.tipols.del.length) {
            for (let tipol of dataObj.tipols.del) {
                ret += `\tclav:${dataObj.id} clav:pertenceTipologiaEnt clav:${tipol.id} .\n`;
            }
        }

        return ret;
    }

    function prepInsert(dataObj) {
        let ret = "";

        if (dataObj.name) {
            ret += `\tclav:${dataObj.id} clav:entDesignacao '${dataObj.name}' .\n`;
        }

        if(dataObj.international) {
            ret += `
                clav:${dataObj.id} clav:entInternacional '${dataObj.international}' .
            `;
        }

        if (dataObj.domain.add && dataObj.domain.add.length) {
            for (let process of dataObj.domain.add) {
                ret += `\tclav:${process.id} clav:temDono clav:${dataObj.id} .\n`;
            }
        }

        for (const pType in dataObj.parts) {
            if (dataObj.parts[pType].add && dataObj.parts[pType].add.length) {
                for (let p of dataObj.parts[pType].add) {
                    ret += "\tclav:" + p.id + " clav:temParticipante" + pType + " clav:" + dataObj.id + " .\n";
                }
            }
        }

        if (dataObj.tipols.add && dataObj.tipols.add.length) {
            for (let tipol of dataObj.tipols.add) {
                ret += `\tclav:${dataObj.id} clav:pertenceTipologiaEnt clav:${tipol.id} .\n`;
            }
        }

        return ret;
    }

    function prepWhere(dataObj) {
        let ret = "";

        if(dataObj.international) {
            ret += `
                clav:${dataObj.id} clav:entInternacional ?inter .
            `;
        }

        if (dataObj.name) {
            ret += `\tclav:${dataObj.id} clav:entDesignacao ?n .\n`;
        }

        return ret;
    }

    var deletePart = "DELETE {\n" + prepWhere(dataObj) + prepDelete(dataObj) + "}\n";
    var inserTPart = "INSERT {\n" + prepInsert(dataObj) + "}\n";
    var wherePart = "WHERE {\n" + prepWhere(dataObj) + "}\n";

    var updateQuery = deletePart + inserTPart + wherePart;

    console.log(deletePart);
    console.log(inserTPart);
    console.log(wherePart);

    return client.query(updateQuery).execute()
        .then(response => Promise.resolve(response))
        .catch(error => console.error("Error in update:\n" + error));
}

Entidades.list = (req, res) => {
    const listQuery = `SELECT * {
        ?id rdf:type clav:Entidade ;
            clav:entEstado "Ativa";
            clav:entDesignacao ?Designacao ;
            clav:entSigla ?Sigla ;
            clav:entInternacional ?Internacional.
    }`;

    return client.query(listQuery).execute()
        .then(response => Promise.resolve(response.results.bindings))
        .then(entidades => res.json(entidades))
        .catch(error => res.sendStatus(500));
};

Entidades.isAvailable = (req, res, next) => {
    const isAvailableQuery = `ASK {
        { ?e clav:entDesignacao|clav:tipDesignacao '${req.body.name}' }
        UNION
        { ?s clav:entSigla|clav:tipSigla '${req.body.initials}' }
    }`;

    return client.query(isAvailableQuery).execute()
        .then(results => Promise.resolve(!results.boolean))
        .then(isAvailable => isAvailable ? next() : res.sendStatus(409))
        .catch(error => res.sendStatus(500));
}

Entidades.create = (req, res) => {
    const createQuery = `INSERT DATA {
        clav:ent_${req.body.initials} rdf:type owl:NamedIndividual , clav:Entidade;
            clav:entDesignacao '${req.body.name}' ;
            clav:entSigla '${req.body.initials}' ;
            clav:entInternacional '${req.body.international}' ;
            ${req.body.tipologias.map(tipologia => `clav:pertenceTipologiaEnt clav:${tipologia.id} ;`).join('\n')}
            clav:entEstado 'Harmonização' .
    }`;

    return client.query(createQuery).execute()
        .then(response => Promise.resolve(response))
        .then(response => {
            // Após sucesso na criação da entidade, fazer um redirect para
            // /pedidos e criar o novo pedido de criação de entidade
            var pedido = {
                criadoPor: req.body.email,  // TODO: mudar para req.user.email
                objeto: {
                    codigo: req.body.initials,
                    tipo: "Entidade",
                    acao: "Criação"
                },
                distribuicao: [{
                    estado: "Submetido"
                }]
            };
            req.body = pedido;
            Pedidos.criar(req, res);
        })
        .catch(error => res.sendStatus(500));
};

Entidades.detail = (req, res) => {
    const detailQuery = `SELECT * where {
        clav:${req.params.id} clav:entDesignacao ?Designacao ;
            clav:entSigla ?Sigla ;
            clav:entEstado ?Estado ;
            clav:entInternacional ?Internacional .
    }`

    return client.query(detailQuery).execute()
        .then(response => Promise.resolve(response.results.bindings[0]))
        .then(entidade => entidade ? res.json(entidade) : res.sendStatus(404))
        .catch(error => res.sendStatus(500));
};

Entidades.update = (req, res) => {
    return null;
};

Entidades.delete = (req, res) => {
    const deleteQuery = `DELETE { clav:${req.params.id} clav:entEstado ?status .
    } INSERT {
        clav:${req.params.id} clav:entEstado 'Inativa' .
    } WHERE {
        clav:${req.params.id} clav:entEstado ?status .
    }`;

    return client.query(deleteQuery).execute()
        .then(response => Promise.resolve(response))
        .then(response => res.sendStatus(200))
        .catch(error => res.sendStatus(500));
};

Entidades.tipologias = (req, res) => {
    const tipologiasQuery = `SELECT * WHERE {
        clav:${req.params.id} clav:pertenceTipologiaEnt ?id .
        
        ?id clav:tipEstado "Ativa";
            clav:tipSigla ?Sigla;
            clav:tipDesignacao ?Designacao.
    }`;

    return client.query(tipologiasQuery).execute()
        .then(response => Promise.resolve(response.results.bindings))
        .then(tipologias => res.json(tipologias))
        .catch(error => res.sendStatus(500));
};

Entidades.dominio = (req, res) => {
    const dominioQuery = `SELECT * WHERE {
        ?id clav:temDono clav:${req.params.id} ;
            clav:codigo ?Code ;
            clav:titulo ?Title ;
            clav:pertenceLC clav:lc1 ;
            clav:classeStatus "A" .
    }`;

    return client.query(dominioQuery).execute()
        .then(response => Promise.resolve(response.results.bindings))
        .then(dominio => res.json(dominio))
        .catch(error => res.sendStatus(500));
};

Entidades.participacoes = (req, res) => {
    const participacoesQuery = `SELECT * WHERE { 
        ?id clav:temParticipante clav:${req.params.id} ;
            ?Type clav:${req.params.id} ;
        
            clav:titulo ?Title ;
            clav:codigo ?Code ;
            clav:pertenceLC clav:lc1 ;
            clav:classeStatus "A" .
        
        FILTER (?Type!=clav:temParticipante && ?Type!=clav:temDono)
    }`;

    return client.query(participacoesQuery).execute()
        .then(response => Promise.resolve(response.results.bindings))
        .then(participacoes => res.json(participacoes))
        .catch(error => res.sendStatus(500));
};