module.exports = function (app) {
    
    //get a list of classes from a given level N (default N=1)
    app.get('/classesn', function (req, res) {
        const { SparqlClient, SPARQL } = require('sparql-client-2');
        var url = require('url');
        
        const client = new SparqlClient('http://localhost:7200/repositories/M51-CLAV')
            .register({
                rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                clav: 'http://jcr.di.uminho.pt/m51-clav#',
                rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
                noInferences: 'http://www.ontotext.com/explicit'
            }
        );

        function fetchClasses(level) {
            if(!level){
                level=1;
            }
            
            var listQuery=`
                SELECT ?id ?Code ?Title (count(?sub) as ?NChilds) FROM noInferences:
                WHERE {
                    ?id rdf:type clav:Classe_N`+level+` ;
                        clav:codigo ?Code ;
                        clav:titulo ?Title .
                    optional {?sub clav:temPai ?id}
                }Group by ?id ?Code ?Title
            `;

            return client.query(listQuery).execute()
                .then(response => Promise.resolve(response.results.bindings))
                .catch(function (error) {
                    console.error(error);
                }
            );
        }

        var parts = url.parse(req.url, true);
        var level = parts.query.level;

        fetchClasses(level)
            .then(list => res.send(list))
            .catch(function (error) {
                console.error(error);
            }
        );
    })

    //get the list of child classes of a given class
    app.get('/childClasses', function (req, res) {
        const { SparqlClient, SPARQL } = require('sparql-client-2');
        var url = require('url');

        const client = new SparqlClient('http://localhost:7200/repositories/M51-CLAV')
            .register({
                rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                clav: 'http://jcr.di.uminho.pt/m51-clav#',
                rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
                noInferences: 'http://www.ontotext.com/explicit'
            });

        function fetchChilds(parent) {
            var fetchQuery =SPARQL`
                SELECT ?Child ?Code ?Title (count(?sub) as ?NChilds)
                WHERE {
                    ?Child clav:temPai clav:`+parent+` ;
                           clav:codigo ?Code ;
                           clav:titulo ?Title
                    optional {?sub clav:temPai ?Child}
                }Group by ?Child ?Code ?Title
            `;
            
            console.log("query: \n"+fetchQuery);

            return client.query(fetchQuery)
                .execute()
                //getting the content we want
                .then(response => Promise.resolve(response.results.bindings))
                .catch(function (error) {
                    console.error(error);
                });
        }

        var parts = url.parse(req.url, true);
        var parent = parts.query.parent;

        console.log(parent);

        //Answer the request
        fetchChilds(parent).then(list => res.send(list))
            .catch(function (error) {
                console.error(error);
            });
    })

    //get data on a single class
    app.get('/singleClass', function (req, res) {
        const { SparqlClient, SPARQL } = require('sparql-client-2');
        var url = require('url');

        const client = new SparqlClient('http://localhost:7200/repositories/M51-CLAV')
            .register({
                rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                clav: 'http://jcr.di.uminho.pt/m51-clav#',
            });

        function fetchClass(id) {
            var fetchQuery =`
                SELECT * WHERE { 
                    clav:`+id+` clav:titulo ?Titulo;
                        clav:codigo ?Codigo;
                    OPTIONAL {
                        clav:`+id+` clav:temPai ?Pai.
                        ?Pai clav:codigo ?CodigoPai;
                            clav:titulo ?TituloPai.
                    } OPTIONAL {
                        clav:`+id+` clav:classeStatus ?Status.
                    } OPTIONAL {
                        clav:`+id+` clav:descricao ?Desc.
                    } OPTIONAL {
                        clav:`+id+` clav:processoTipo ?ProcTipo.
                    } OPTIONAL {
                        clav:`+id+` clav:processoTransversal ?ProcTrans.
                    }
                }`;
            
            console.log(fetchQuery);

            return client.query(fetchQuery)
                .execute()
                //getting the content we want
                .then(response => Promise.resolve(response.results.bindings))
                .catch(function (error) {
                    console.error(error);
                });
        }

        var parts = url.parse(req.url, true);
        var id = parts.query.id;

        //Answer the request
        fetchClass(id).then(clas => res.send(clas))
            .catch(function (error) {
                console.error(error);
            });
    })

    //get list of class Owners
    app.get('/ownersClass', function (req, res) {
        const { SparqlClient, SPARQL } = require('sparql-client-2');
        var url = require('url');

        const client = new SparqlClient('http://localhost:7200/repositories/M51-CLAV')
            .register({
                rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                clav: 'http://jcr.di.uminho.pt/m51-clav#',
            });

        function fetchOwners(id) {
            var fetchQuery =`
                SELECT * WHERE { 
                    clav:`+id+` clav:temDono ?id.
                    ?id clav:orgNome ?Nome;
                        clav:orgSigla ?Sigla;
                }`;
            
            console.log(fetchQuery);

            return client.query(fetchQuery).execute()
                .then(response => Promise.resolve(response.results.bindings))
                .catch(function (error) {
                    console.error(error);
                });
        }

        var parts = url.parse(req.url, true);
        var id = parts.query.id;

        //Answer the request
        fetchOwners(id).then(owners => res.send(owners))
            .catch(function (error) {
                console.error(error);
            });
    })

    //inserts a list of 'NotaAplicacao' into the DB
    app.post('/createAppNotes', function (req, res) {
        const { SparqlClient, SPARQL } = require('sparql-client-2');
        
        const client = new SparqlClient('http://localhost:7200/repositories/M51-CLAV', {
                updateEndpoint: 'http://localhost:7200/repositories/M51-CLAV/statements'
            })
            .register({
                rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                clav: 'http://jcr.di.uminho.pt/m51-clav#',
                owl: 'http://www.w3.org/2002/07/owl#',
        });


        //Create new organization
        function createAppNotes(list) {            
            var createQuery = "INSERT DATA {";

            for(var i=0;i<list.length;i++){
                createQuery+=`
                    clav:`+list[i].id+SPARQL` rdf:type owl:NamedIndividual,
                            clav:NotaAplicacao;
                        clav:conteudo "`+list[i].text.replace(/\n/g,'\\n')+`" .
                `
            }
            createQuery+='}';

            console.log(createQuery);
            /*
            return client.query(createQuery).execute()
                .then(response => Promise.resolve(response))
                .catch(error => console.error("Error in create:\n" + error));
            */
        }

        //Getting data
        var list= req.body.list;

        createAppNotes(list);
        /*
        createAppNotes(list)
        .then(function () {
            res.send("Nota(s) de Aplicação Criadas!");
        })
        .catch(error => console.error(error));    
        */ 
    })

    //inserts a list of 'NotaExclusao' into the DB
    app.post('/createDelNotes', function (req, res) {
        const { SparqlClient, SPARQL } = require('sparql-client-2');
        
        const client = new SparqlClient('http://localhost:7200/repositories/M51-CLAV', {
                updateEndpoint: 'http://localhost:7200/repositories/M51-CLAV/statements'
            })
            .register({
                rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                clav: 'http://jcr.di.uminho.pt/m51-clav#',
                owl: 'http://www.w3.org/2002/07/owl#',
        });


        //Create new organization
        function createDelNotes(list) {            
            var createQuery = "INSERT DATA {";

            for(var i=0;i<list.length;i++){
                createQuery+=`
                    clav:`+list[i].id+SPARQL` rdf:type owl:NamedIndividual,
                            clav:NotaExclusao;
                        clav:conteudo "`+list[i].text.replace(/\n/g,'\\n')+`" .
                `
            }
            createQuery+='}';

            console.log(createQuery);

            return client.query(createQuery).execute()
                .then(response => Promise.resolve(response))
                .catch(error => console.error("Error in create:\n" + error));
        }

        //Getting data
        var list= req.body.list;

        createDelNotes(list)
        .then(function () {
            res.send("Nota(s) de Exclusão Criadas!");
        })
        .catch(error => console.error(error));     
    })

    //inserts a new class into the DB
    app.post('/createClass', function (req, res) {
        const { SparqlClient, SPARQL } = require('sparql-client-2');
        
        const client = new SparqlClient('http://localhost:7200/repositories/M51-CLAV', {
                updateEndpoint: 'http://localhost:7200/repositories/M51-CLAV/statements'
            })
            .register({
                rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                clav: 'http://jcr.di.uminho.pt/m51-clav#',
                owl: 'http://www.w3.org/2002/07/owl#',
        });


        //Create new organization
        function createClass(data) {
            var id = "c"+data.code;
            var type = "Classe_N"+data.level;

            var createQuery = `
                INSERT DATA {
                    clav:`+id+SPARQL` rdf:type owl:NamedIndividual ,
                                           ${{clav: type}} ;
                                  clav:classeStatus ${data.status} ;
                                  clav:descricao `+'"'+data.description.replace(/\n/g,'\\n')+'"'+SPARQL` ;
                                  clav:pertenceLC clav:lc1 ;
                                  clav:titulo ${data.title} ;                    
            `;

            if(data.parent){
                createQuery+='clav:temPai clav:'+data.parent+' ;\n';
            }
            
            if(data.owners){
                for(var i=0;i<data.owners.length;i++){
                    createQuery+='clav:temDono clav:'+data.owners[i].id+' ;\n';
                }
            }
            
            if(data.legislations){
                for(var i=0;i<data.legislations.length;i++){
                    createQuery+='clav:temLegislacao clav:'+data.legislations[i].id+' ;\n';
                }
            }
            
            if(data.exAppNotes){
                for(var i=0;i<data.exAppNotes.length;i++){
                    createQuery+='clav:exemploNA "'+data.exAppNotes[i].replace(/\n/g,'\\n')+'" ;\n';
                }
            }

            if(data.appNotes){
                for(var i=0;i<data.appNotes.length;i++){
                    createQuery+='clav:temNotaAplicacao clav:'+data.appNotes[i]+' ;\n';
                }
            }    
            
            if(data.delNotes){
                for(var i=0;i<data.delNotes.length;i++){
                    createQuery+='clav:temNotaExclusao clav:'+data.delNotes[i]+' ;\n';
                }
            }

            createQuery+='clav:codigo "'+data.code+'" .\n';

            createQuery+='}';

            console.log(createQuery);
            /*
            return client.query(createQuery).execute()
                .then(response => Promise.resolve(response))
                .catch(error => console.error("Error in create:\n" + error));
            */
        }

        //Getting data
        var data= req.body;

        createClass(data);
        /*
        createClass(data)
        .then(function () {
            res.send("Classe Inserida!");
        })
        .catch(error => console.error(error));    
        */ 
    })
}