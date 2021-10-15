const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const db = require(__dirname + '/../database.js')

const saltRounds = 10;



router.get('/login', function(request, response) {
    response.render('login.hbs')
})
router.post('/login', function(request, response) {
    let pass = request.body.password;
    let user = request.body.username;
    db.getUserByUsername(user, function(error, result) {
        if(error || result === undefined){
            console.log("couldnt fetch user.")
            response.redirect('back')
        } else {
            bcrypt.compare(pass, result.hash, function(error, result) {
                if(result == true) {
                    console.log("CORRECT PASSWORD");
                    response.redirect('back')
                    //CREATE COOKIES    
                } else {
                    //SEND MSG
                    //WRONG PASS
                    console.log("Wrong password")
                    response.redirect('back')
                }
            });
            
        }
        
    })
})

router.get('/register', function(request, response) {
    response.render('register.hbs')
})
module.exports = router