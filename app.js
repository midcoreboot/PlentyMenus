const express = require('express');
const expressHandlebars = require('express-handlebars');
const sqlite3 = require('sqlite3');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const SQLiteStore = require('connect-sqlite3')(session);
const dummyData = require('./dummy-data.js');
const db = require('./database.js');
const authRouter = require('./routers/auth-router');
const menuRouter = require('./routers/menu-router')

const app = express()

app.use(express.static('public'))
app.use(express.urlencoded({
    extended: false
}))
app.use(express.json())
app.use(session({
    store: new SQLiteStore({db: "session-db.db"}),
    saveUninitialized: false,
    resave: false,
    secret: 'qo11231pwepkma',
    cookie: {
        maxAge: 1000*60*60*24
    }
}))
app.use(function(request, response, next) {
    response.locals.session = request.session
    next()
})
const hbs = expressHandlebars.create({
    defaultLayout: 'main.hbs'
});

app.engine("hbs", hbs.engine)

app.use('/auth', authRouter)
app.use('/menu', menuRouter)

app.get('/', function(request, response){
    //REWORKED AND FINISHED WITH ERROR HANDLING
    const errors = []
    db.getRestaurants().then(function(rests) {
        const model = {
            restaurants: rests
        }
        response.render('menus.hbs', model)
    }).catch(function(error) {
        errors.push(error)
        const model = {
            errors
        }
        response.render('menus.hbs', model)
    })
})

app.get('/aboutus', function(request, response) {
    response.render('aboutus.hbs')
})

app.get('/contactus', function(request, response) {
    response.render('contactus.hbs')
})

// LISTENING
app.listen(8080, function(){
    console.log("Server opened, listening on port 8080")
})