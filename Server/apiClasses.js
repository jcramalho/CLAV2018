module.exports = function (app) {
    
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

/*
    app.get('/addDelNotes', function (req, res) {
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
                    ?Child clav:temPai ${{clav: parent}} ;
                           clav:codigo ?Code ;
                           clav:titulo ?Title
                    optional {?sub clav:temPai ?Child}
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

        var parts = url.parse(req.url, true);
        var ids = parts.query.ids.split('+');
        var content = parts.query.content.split('+');

        //Answer the request
        fetchChilds(parent).then(list => res.send(list))
            .catch(function (error) {
                console.error(error);
            });
    })
*/
    
}