const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const session = require('express-session')
const db = require(__dirname + '/../database.js')
const validator = require(__dirname + '/../validators.js')

const saltRounds = 10;



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
    db.getUserByUsername(username, function(error, user) {
        if(error || user === undefined){
            //console.log("couldnt fetch user.")
            response.redirect('back')
        } else {
            bcrypt.compare(password, user.hash, function(error, result) {
                if(result == true) {
                    //console.log("CORRECT PASSWORD");
                   // response.redirect('back')
                    //CREATE COOKIES
                    request.session.loggedIn = true
                    request.session.userId = user.id
                    request.session.accessLevel = user.accessLevel
                    //console.log(request.body.referer)
                    response.redirect('back')
                } else {
                    //SEND MSG
                    //WRONG PASS
                    //console.log("Wrong password")
                    response.redirect('back')
                }
            });
            
        }
        
    })
})
router.post('/logout', function(request, response) {
    if(request.session.loggedIn == true) {
        request.session.loggedIn = false
        request.session.destroy(function(err) {
            if(err){
                console.log(err)
                response.sendStatus('500.hbs')
            } else {
                response.redirect('back')
            }
        })
    } else {
        response.redirect('/')
    }
})

router.get('/register', function(request, response) {
    response.render('register.hbs')
})
router.post('/register', function(request, response) {
    const username = request.body.username
    const fullname = request.body.fullname
    const pass = request.body.password
    const errors = validator.getRegistrationErrors(username, fullname, pass);
    if(errors.length == 0 ){
          db.getUserByUsername(username, function(error, result) {
              if(error){
                errors.push(error)
                const model = { errors };
                response.render('register.hbs', model)
              } else {
                  if(result){
                      errors.push("User with username ["+username+"] is already taken.");
                      const model = { errors };
                      response.render('register.hbs', model)
                  } else {
                    //HASH PASSWORD
                    bcrypt.hash(pass, 10, function(error, hash) {
                        if(error) {
                            errors.push("Internal server error.")
                            response.render('register.hbs', model)
                        } else {
                            db.createUser(username, fullname, hash, function(error) {
                                if(error){
                                    errors.push("Internal server error.")
                                } else {
                                    //USER CREATED
                                    //LOGIN
                                    //console.log("USER CREATED: ", username, fullname, hash)
                                    response.redirect('/')
                                }
                            })
                        }
                    })
                  }
              }
          })
    } else {
        const model = {
            errors
        }
        response.render('register.hbs', model)
    }
})

router.get('/myid', function(request, response) {
    response.send(request.session.loggedIn)
})
module.exports = router