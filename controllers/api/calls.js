var Call = require('./../../models/call');
var Calls = module.exports

Calls.getRoute = function(req){
    return req.originalUrl.replace(/\?.*$/,"")
}

Calls.newCall = async function(route, method, id, type, httpStatus){
    var call = await Call.findOne({route: route, method: method})

    if(call){
        call = await Call.findOne(
        {
            route: route,
            method: method,
            accesses: {$elemMatch: {id: id, type: type}}
        })

        if(call){
            call = await Call.findOne(
            {
                route: route,
                method: method,
                accesses: {
                    $elemMatch: {
                        id: id,
                        type: type,
                        accesses: {$elemMatch: {httpStatus: httpStatus}}
                    }
                }
            })

            if(call){
                var len = call.accesses.length
                var f1 = false
                var f2 = false

                for (var i=0; i < len && !f1; i++){
                    if(call.accesses[i].id == id && call.accesses[i].type == type){
                        len = call.accesses[i].accesses.length
                        f1 = true

                        for(var j=0; j < len && !f2; j++){
                            if(call.accesses[i].accesses[j].httpStatus == httpStatus){
                                f2 = true

                                call.accesses[i].accesses[j].nCalls++
                                call.accesses[i].accesses[j].lastAccess = Date.now()
                            }
                        }
                    }
                }

                return call.save()
            }else{
                return Call.updateOne(
                {
                    route: route,
                    method: method,
                    accesses: {$elemMatch: {id: id, type: type}}
                },
                {
                    $push: {
                        "accesses.$.accesses": {
                            httpStatus: httpStatus,
                            nCalls: 1,
                            lastAccess: Date.now()
                        }
                    },
                },
                {
                    useFindAndModify: false
                })
            }   
        }else{
            return Call.updateOne(
            {
                route: route,
                method: method
            },
            {
                $push: {
                    accesses: {
                        id: id,
                        type: type,
                        accesses: [{
                            httpStatus: httpStatus,
                            nCalls: 1,
                            lastAccess: Date.now()
                        }]
                    }
                }
            },
            {
                useFindAndModify: false
            })
        }   
    }else{
        return Call.create({
            route: route,
            method: method,
            accesses: [{
                id: id,
                type: type,
                accesses: [{
                    httpStatus: httpStatus,
                    nCalls: 1,
                    lastAccess: Date.now()
                }]
            }]
        })
    }
}

Calls.getCall = function(route, method){
    return Call.findOne({route: route, method: method})
}

Calls.getUserCalls = function(id, type){
    return Call.find({accesses: {$elemMatch: {id: id, type: type}}})
}
