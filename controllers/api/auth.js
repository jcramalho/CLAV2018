var AuthCall = require('../../models/auth');
var AuthCalls = module.exports

AuthCalls.addRedirectUrl = function (redirect, callback) {
	redirect.save(callback);
}

AuthCalls.get = function(id, callback){
    AuthCall.findById(id, function(err, authcall){
        if (err) {	
            callback(err, null)
        } else {
            // callback(null, authcall.url);
            AuthCall.findByIdAndRemove(id, function(err, res){
                if (err) {	
                    callback(err, null)
                } else {
                    callback(null, authcall.url);
                }
            });
        }
    });
}

AuthCalls.remove = function(id, callback){
    AuthCall.findByIdAndRemove(id, function(err, authcall){
        if (err) {	
            callback(err, null)
        } else {
		    callback(null, authcall);
        }
    });
}