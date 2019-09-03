// const ip = '192.168.85.197'
const ip = 'localhost'

module.exports.onthology = 'http://'+ip+':7200/repositories/CLAV'
//module.exports.onthology = 'http://graphdb:7200/repositories/CLAV' //docker

module.exports.prefixes = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX clav: <http://jcr.di.uminho.pt/m51-clav#>
    PREFIX owl: <http://www.w3.org/2002/07/owl#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX noInferences: <http://www.ontotext.com/explicit>
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
`

module.exports.host = 'http://'+ip+':7779'

module.exports.userDB = 'mongodb://localhost/m51-clav'
//module.exports.userDB = 'mongodb://mongo/m51-clav' //docker
