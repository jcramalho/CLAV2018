// const ip = '192.168.85.197'
const ip = process.env.IP || 'localhost'
const port = process.env.PORT || '7779'

module.exports.onthology = process.env.GRAPHDB ? 'http://' + process.env.GRAPHDB +'/repositories/CLAV' : 'http://'+ip+':7200/repositories/CLAV'

module.exports.prefixes = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX clav: <http://jcr.di.uminho.pt/m51-clav#>
    PREFIX owl: <http://www.w3.org/2002/07/owl#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX noInferences: <http://www.ontotext.com/explicit>
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
`

module.exports.host = 'http://'+ip+':'+port

module.exports.swaggerURL = process.env.SWAGGER_URL || 'http://clav-api.dglab.gov.pt'

module.exports.userDB = process.env.MONGODB ? 'mongodb://' + process.env.MONGODB + '/m51-clav' : 'mongodb://localhost/m51-clav'

module.exports.interfaceHosts = [
    "http://localhost:8080",
    "http://clav.dglab.gov.pt",
    "http://epl.di.uminho.pt:7780",
    "http://epl.di.uminho.pt:7781"
]
