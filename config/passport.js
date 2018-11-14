var LocalStrategy = require('passport-local').Strategy;
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;

var User = require('../models/user');
var ConfigJWT = require('./jwt');

//Needed for JWT Authentication
var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = ConfigJWT.jwt.secret;

module.exports = function(passport) {
    passport.use(new LocalStrategy(
        function (email, password, done) {
            User.getUserByEmail(email, function (err, user) {
                if (err) throw err;
                if (!user) {
                    return done(null, false, { message: 'Email não reconhecido' });
                }

                User.comparePassword(password, user.local.password, function (err, isMatch) {
                    if (err) throw err;
                    if (isMatch) {
                        return done(null, user);
                    } else {
                        return done(null, false, { message: 'Password Inválida' });
                    }
                });
            });
        })
    );

    passport.use(new JwtStrategy(opts,
        function(jwt_payload, done){
            User.findOne({id: jwt_payload.id}, function(err,user) {
                if(err) throw err;
                if(user){
                    done(null,user);
                }else{
                    done(null,false);
                }
            });
        }
    ));

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.getUserById(id, function (err, user) {
            done(err, user);
        });
    });
};