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
