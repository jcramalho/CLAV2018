const client = require('../../config/database').onthology;

var SelTabs = module.exports

SelTabs.list = function () {
    return client.query(
        `SELECT * WHERE { 
            ?id rdf:type clav:TabelaSelecao ;
                clav:designacao ?Name .
        }`
    )
        .execute()
        //getting the content we want
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error(error);
        });
}

SelTabs.listClasses = function (table) {
    var listQuery = `
        SELECT DISTINCT
            ?Avo ?AvoCodigo ?AvoTitulo 
            ?Pai ?PaiCodigo ?PaiTitulo 
            ?PN ?PNCodigo ?PNTitulo   
            (GROUP_CONCAT(CONCAT(STR(?Filho),":::",?FilhoCodigo, ":::",?FilhoTitulo); SEPARATOR="###") AS ?Filhos)
        WHERE {  
            
            ?PN rdf:type clav:Classe_N3.
            ?PN clav:pertenceLC clav:${table}.
            
            ?PN clav:temPai ?Pai.
            ?Pai clav:temPai ?Avo.
            
            ?PN clav:codigo ?PNCodigo;
                clav:titulo ?PNTitulo.
            
            ?Pai clav:codigo ?PaiCodigo;
                clav:titulo ?PaiTitulo.
            
            ?Avo clav:codigo ?AvoCodigo;
                clav:titulo ?AvoTitulo.
            
            OPTIONAL {
                ?Filho clav:temPai ?PN;
                clav:codigo ?FilhoCodigo;
                clav:titulo ?FilhoTitulo
            }
        }
        Group By ?PN ?PNCodigo ?PNTitulo ?Pai ?PaiCodigo ?PaiTitulo ?Avo ?AvoCodigo ?AvoTitulo 
        Order By ?PN
        `;


    return client.query(listQuery).execute()
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error(error);
        });
}

SelTabs.classChildren = function (parent, table) {
    var fetchQuery = `
        SELECT ?Child ?Code ?Title (count(?sub) as ?NChilds)
        WHERE {
            ?Child clav:temPai clav:${parent} ;
                    clav:codigo ?Code ;
                    clav:titulo ?Title
            optional {
                ?sub clav:temPai ?Child ;
            }
        }Group by ?Child ?Code ?Title
        `;

    return client.query(fetchQuery)
        .execute()
        //getting the content we want
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error(error);
        });
}

SelTabs.stats = function (id) {
    return client.query(
        `SELECT * WHERE { 
                clav:${id} rdf:type clav:TabelaSelecao ;
                    clav:designacao ?Name .
            }`
    )
        .execute()
        //getting the content we want
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error(error);
        });
}

SelTabs.createTab = function (id, name, classes) {

    var createQuery = `
            INSERT DATA {
                clav:${id} rdf:type owl:NamedIndividual ,
                        clav:TabelaSelecao ;
                    clav:referencialClassificativoStatus 'H';
                    clav:designacao '${name} ${id.replace("ts_", "")}' .
        `;

    for (let clas of classes) {
        let clasID = id + '_' + clas.id.value.replace(/[^#]+#(.*)/, '$1');

        let level = clas.Codigo.value.split('.').length;

        createQuery += `
            clav:${clasID} rdf:type owl:NamedIndividual ,
                    clav:Classe_N${level} ;
                clav:status "H" ;
                clav:codigo "${clas.Codigo.value}" ;
                clav:pertenceLC clav:${id} ;
                clav:classeStatus "${clas.Status.value}" .
        `;

        if (clas.Pai) {
            createQuery += `
                clav:${clasID} clav:temPai clav:${id + '_' + clas.Pai.value.replace(/[^#]+#(.*)/, '$1')} .
            `;
        }

        var keyVal = {
            ProcTrans: 'processoTransversal',
            Descricao: 'descricao',
            Titulo: 'titulo'
        };

        for (const key in keyVal) {
            if (clas[key]) {
                createQuery += `
                    clav:${clasID} clav:${keyVal[key]} "${clas[key].value.replace(/\n|\r/g, '\\n').replace(/\"/g,"\\\"")}" .
                `;
            }
        }

        if (clas.Exemplos.value) {
            for (let val of clas.Exemplos.value.split('%%')) {
                createQuery += `
                    clav:${clasID} clav:exemploNA "${val.replace(/\n|\r/g, '\\n').replace(/\"/g,"\\\"")}" .
                `;
            }
        }

        var keyMultVal = {
            ProcTipo: 'processoTipoVC',
            Donos: 'temDono',
            Parts1: 'temParticipanteApreciador',
            Parts2: 'temParticipanteAssessor',
            Parts3: 'temParticipanteComunicador',
            Parts4: 'temParticipanteDecisor',
            Parts5: 'temParticipanteExecutor',
            Parts6: 'temParticipanteIniciador',
            Diplomas: 'temLegislacao',
        }

        for (const key in keyMultVal) {
            if (clas[key] && clas[key].value) {
                for (let val of clas[key].value.split('%%')) {
                    createQuery += `
                        clav:${clasID} clav:${keyMultVal[key]} clav:${val.replace(/[^#]+#(.*)/, '$1')} .
                    `;
                }
            }
        }


        var keyNotes = {
            NotasA: 'temNotaAplicacao',
            NotasE: 'temNotaExclusao',
        }

        for (const key in keyNotes) {
            if (clas[key] && clas[key].value) {
                for (let val of clas[key].value.split('%%')) {
                    val = val.split('::');
                    noteID = val[0].replace(/[^#]+#(n[ae]_)(.*)/, `$1${id}_$2`); 

                    console.log(noteID);

                    createQuery += `
                        clav:clav:${noteID} rdf:type owl:NamedIndividual,
                                clav:clav:${keyNotes[key].slice(3)};
                            clav:conteudo "${val[1].replace(/\n|\r/g, '\\n').replace(/\"/g,"\\\"")}".
                        clav:${clasID} clav:${keyNotes[key]} clav:${noteID} .
                    `;
                }
            }
        }
        

        var keyRels = {
            Rels1: 'eSintetizadoPor',
            Rels2: 'eSinteseDe',
            Rels3: 'eComplementarDe',
            Rels4: 'eCruzadoCom',
            Rels5: 'eSuplementoPara',
            Rels6: 'eSucessorDe',
            Rels7: 'eAntecessorDe',
        }

        for (const key in keyRels) {
            if (clas[key] && clas[key].value) {
                for (let val of clas[key].value.split('%%')) {
                    createQuery += `
                        clav:${clasID} clav:${keyRels[key]} clav:${id + "_" + val.replace(/[^#]+#(.*)/, '$1')} .
                    `;
                }
            }
        }
    }

    createQuery += "}"

    console.log(createQuery);

    return client.query(createQuery).execute()
        .then(response => Promise.resolve(response))
        .catch(error => console.error("Error in create:\n" + error));
}

SelTabs.deleteTab = function (id) {
    var delQuery = `
        DELETE {
            clav:${id} clav:status ?status .
        }
        INSERT {
            clav:${id} clav:status 'I' .
        }
        WHERE {
            clav:${id} clav:status ?status .
        }
    `;

    return client.query(delQuery).execute()
        //getting the content we want
        .then(response => Promise.resolve(response))
        .catch(function (error) {
            console.error(error);
        });
}

SelTabs.trueDelete = function (id) {
    var delQuery = `
        DELETE {
            clav:${id} ?s1 ?p1 .
            ?classe ?s2 ?p2 .
            ?s3 ?p3 ?classe .
            ?s4 ?p4 clav:${id} .
        }
        WHERE {
            clav:${id} ?s1 ?p1 .
            ?classe clav:pertenceLC clav:${id};
                ?s2 ?p2 .
            ?s3 ?p3 ?classe .
            ?s4 ?p4 clav:${id} .
        }
    `;
}