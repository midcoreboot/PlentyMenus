const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const session = require('express-session')
const validator = require(__dirname + '/../validators.js')

const ADMIN_USERNAME = 'Alice'
const ADMIN_HASH = '$2b$10$gEsyShx4aA1EvwCXiHuloui1v/KCwvB.SwSb1Hp0YVPuxy0MdbM.O'

router.get('/login', function(request, response) {
    if(request.session.loggedIn == true){
        response.redirect('/')
    } else { 
        response.render('login.hbs', {referer: request.headers.referer})
    }
})
router.post('/login', function(request, response) {
    let password = request.body.password;
    let username = request.body.username;
    if(username == ADMIN_USERNAME && request.session.loggedIn != true){
        const saltRounds = 10;
        bcrypt.compare(password, ADMIN_HASH, function(error, passCorrect) {
            if(error) {
                response.redirect('../500.hbs')
            } else {
                if(passCorrect == true){
                    request.session.loggedIn = true
                    request.session.userId = 1
                    request.session.accessLevel = 5
                    response.redirect('back')
                } else {
                    const model = {errors: ["Incorrect password/username."]}
                    response.render('login.hbs', model)
                }
            }
        })
    } else if(username != ADMIN_USERNAME){
        const model = {errors: ["Incorrect username."]}
        response.render('login.hbs', model)
    } else {
        response.render('500.hbs')
    }
})
router.post('/logout', function(request, response) {
    if(request.session.loggedIn == true) {
        request.session.loggedIn = false
        request.session.destroy(function(err) {
            if(err){
                console.log(err)
                response.render('500.hbs')
            } else {
                response.redirect('back')
            }
        })
    } else {
        response.redirect('/')
    }
})
module.exports = router