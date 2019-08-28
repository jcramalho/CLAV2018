var LocalStrategy = require('passport-local').Strategy;
var Users = require('../controllers/api/users');

module.exports = function(passport) {
    passport.use(new LocalStrategy(
        function (email, password, done) {
            Users.getUserByEmail(email, function (err, user) {
                if (err) done(err);
                if (!user) {
                    return done(null, false, { message: 'Email não reconhecido' });
                }

                Users.comparePassword(password, user.local.password, function (err, isMatch) {
                    if (err) done(err);
                    if (isMatch) {
                        if(user.level==-1){
                            return done(null, false, { message: 'Utilizador desativado.' });
                        }else{
                            return done(null, user, { message: 'Login efetuado com sucesso.' });
                        }
                    } else {
                        return done(null, false, { message: 'Ocorreu um erro ao realizar o login! Por favor verifique as suas credenciais.' });
                    }
                });
            });
        })
    );

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        Users.getUserById(id, function (err, user) {
            done(err, user);
        });
    });
};
