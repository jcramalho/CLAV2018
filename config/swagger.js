var fs = require('fs')
var yaml = require('js-yaml')
var yamlinc = require('yaml-include')
var dataBases = require('./database')
var path = require('path');

//gera o ficheiro final tendo como base o index.yaml
yamlinc.setBaseFile(path.join(__dirname, '../swagger', 'index.yaml'));
var src = fs.readFileSync(yamlinc.basefile)
var swaggerDoc = yaml.load(src, { schema: yamlinc.YAML_INCLUDE_SCHEMA })

//mudar url principal na secção dos servidores do Swagger
swaggerDoc.servers[0].variables.versao.default = dataBases.apiVersion
swaggerDoc.servers[0].variables.versao.enum[0] = dataBases.apiVersion
swaggerDoc.servers[0].variables.dominio.default = dataBases.swaggerURL
swaggerDoc.servers[0].variables.dominio.enum[0] = dataBases.swaggerURL
//Escrever o ficheiro final da especificação OpenAPI
fs.writeFileSync("./public/clav.yaml", yaml.dump(swaggerDoc))

module.exports.urls = swaggerDoc.servers[0].variables.dominio.enum

//opções a passar ao Swagger UI
module.exports.options = {
  explorer: true,
  customSiteTitle: 'CLAV API',
  swaggerOptions: {
    url: '/clav.yaml',
    defaultModelsExpandDepth: -1, //hide models section
    tagsSorter: 'alpha',
    operationsSorter: (a, b) => {
        var methods = ["get", "post", "put", "delete", "patch", "options", "trace"]
        var result = methods.indexOf(a.get("method")) - methods.indexOf(b.get("method"))

        if(result == 0){
            var a_path = a.get("path")
            var b_path = b.get("path")

            result = a_path.localeCompare(b_path)

            if(result == 0){
                result = a_path.length - b_path.length
            }
        }

        return result
    }
  }
}
