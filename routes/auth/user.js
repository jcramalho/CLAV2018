var Logging = require('../../controllers/logging');
var passport = require('passport');

module.exports = function (app, passport) {

    // Local user registration
    app.post('/registar', function (req, res) {
        var name = req.body.name;
        var email = req.body.email;
        var password = req.body.password;
        var password2 = req.body.password2;

        // Validation
        req.checkBody('name', 'Nome é obrigatório').notEmpty();
        req.checkBody('email', 'Email é obrigatório').notEmpty();
        req.checkBody('email', 'Email inválido').isEmail();
        req.checkBody('password', 'Password é obrigatória').notEmpty();
        req.checkBody('password2', 'Passwords têm de ser iguais').equals(req.body.password);

        var errors = req.validationErrors();

        if (errors) {
            res.render('users/registar', {
                errors: errors
            });
        }
        else {
            var newUser = new User({
                name: name,
                level: 1,
                email: email,
                local: {
                    password: password
                }
            });

            User.getUserByEmail(email, function (err, user) {
                if (err) throw err;
                if (!user) {
                    User.createUser(newUser, function (err, user) {
                        if (err) throw err;
                    });

                    Logging.logger.info('Utilizador '+user._id+' registado.');

                    req.flash('success_msg', 'A sua conta foi criada, pode agora fazer login');

                    res.redirect('/');
                }
                else {
                    res.render('users/registar', {
                        errors: [{ msg: "Email já em uso" }]
                    });
                }
            });
        }
    });

    // Local authentication
    app.post('/login',
    passport.authenticate('local', {failureRedirect:'/iniciarSessao',failureFlash: true}),
        function (req, res) {
            res.redirect(req.body.location);
        }
    );

    // Facebook authentication
    app.get('/loginFB', passport.authenticate(
        'facebook',
        passport.authorize('facebook', { 
            scope: ['email'] 
        })
    ));

    app.get('/loginFB/callback',
        passport.authenticate('facebook', {
            successRedirect: '/',
            failureRedirect: '/'
        })
    );

    // Google authentication
    app.get('/loginG', passport.authenticate(
        'google',
        {scope: ['profile','email']} 
    ));

    app.get('/loginG/callback',
        passport.authenticate('google', {
            successRedirect: '/',
            failureRedirect: '/'
        })
    );

    app.get('/logout', function (req, res) {
        var url = require('url');
        var parts = url.parse(req.url, true);
        var location = parts.query.l;

        req.logout();

        req.flash('success_msg', 'You are logged out');

        res.redirect(location);
    });
}