/**
 * Normaliza e simplifica os resultados de uma query SPARQL.
 * 
 * @example
 * // Assumindo o seguinte resultado de uma query:
 * {  
 *   "head":{  
 *     "vars":[  
 *       "sigla",
 *       "designacao",
 *       "estado",
 *       "internacional"
 *     ]
 *   },
 *   "results":{  
 *     "bindings":[  
 *       {  
 *         "estado":{  
 *           "type":"literal",
 *           "value":"Ativa"
 *         },
 *         "sigla":{  
 *           "type":"literal",
 *           "value":"PGR"
 *         },
 *         "designacao":{  
 *           "type":"literal",
 *           "value":"Procuradoria-Geral da República"
 *         },
 *         "internacional":{  
 *           "type":"literal",
 *           "value":"Não"
 *         }
 *       }
 *     ]
 *   }
 * }
 * 
 * // O resultado da normalização da resposta acima será:
 * [
 *   {  
 *     "estado":"Ativa",
 *     "sigla":"PGR",
 *     "designacao":"Procuradoria-Geral da República",
 *     "internacional":"Não"
 *   }
 * ]
 * 
 * @param response objeto de resposta da query SPARQL
 * @return objeto normalizado e simplificado
 */
exports.normalize = function(response) {
    return response.results.bindings.map(obj =>
        Object.entries(obj)
            .reduce((new_obj, [k,v]) => (new_obj[k] = v.value, new_obj),
                    new Object()));
};

/**
 * Faz o pré-cálculo da árvore de classes, grava-o no ficheiro /data/classes-preCalc.json e devolve essa estrutura
 * 
 */

var Classes = require(__dirname + '/classes.js')
var jsonfile = require('jsonfile')

exports.preCalc = ()=>{
    return new Promise((resolve,reject)=>{
        Classes.listar(null)
            .then(dados => {
                jsonfile.writeFile(__dirname + '/../../data/classes-preCalc.json', dados, erro=>{
                    if(erro) console.log('Erro na escrita do classes-preCalc.json')
                    resolve (dados)
                })
            })
            .then(classesN1 => {
                console.dir(classesN1[0])
                return  classesN1   
            

                /*for(let i=0; i < classesN1.length; i++){
                    cid = classesN1[i].id.split('#')[1] // Vou buscar o id da classe N1
                    Classes.descendencia(cid)
                        .then(filhos => { 
                            classesN1[i].filhos = filhos
                            return classesN1
                        })
                        .catch(() => {
                            classesN1[i].filhos = [] 
                            return classesN1
                        })
                }
                return classesN1*/
            })
            .catch(erro => {reject ([]);})
    })
}
