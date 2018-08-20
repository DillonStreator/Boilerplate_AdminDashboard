const express = require('express');
const router = express.Router();
const passport = require('passport');

router.get('/', (req, res) => {
    return res.render(
        'login',
        { 
            title: 'Login'
        }
    );
});

router.post('/', passport.authenticate('local-login', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    })
)

module.exports = router;
