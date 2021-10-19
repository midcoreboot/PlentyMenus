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
const { rawListeners, allowedNodeEnvironmentFlags } = require('process');
const { Console } = require('console');
const { resolve } = require('path');

const app = express()


app.use(express.static('public'))
app.use(express.urlencoded({
    extended: false
}))
app.use(session({
    store: new SQLiteStore({db: "session-db.db"}),
    saveUninitialized: false,
    resave: false,
    secret: 'qo11231pwepkma',
    cookie: {
        maxAge: 1000*60*60*24
    }
}))
app.use(cookieParser())

app.use(function(request, response, next) {
    console.log(request.headers.referer)
    //response.locals.ref = request.headers.referer
    response.locals.session = request.session
    next()
})

const hbs = expressHandlebars.create({
    helpers: {
        list: function(context, options){
            var ret = "<ul class='tab tab-block'>";
            
            for(var i = 0, j = context.length; i < j; i++){
                if(i == 0){
                    ret = ret + "<li class='tab-active'>" + options.fn(context[i]) + "</li>";
                } else {
                    ret = ret + "<li class='tab'>" + options.fn(context[i]) + "</li>";
                }
            }

            return ret + "</ul>";
        }
    },
    defaultLayout: 'main.hbs'
});

app.engine("hbs", hbs.engine)

app.use('/auth', authRouter)
app.use('/menu', menuRouter)

app.get('/', function(request, response){
    //REWORKED AND FINISHED WITH ERROR HANDLING
    db.getTenRestaurants().then(function(rests) {
        //console.log(rests)
        const model = {
            restaurants: rests
        }
        response.render('menus.hbs', model)
    }).catch(function(error) {
        console.log("Error caught in db.getTenRestaurants(): " , error)
        response.sendStatus('500')
    })
})

app.get('/aboutus', function(request, response) {
    response.render('aboutus.hbs')
})

app.get('/restaurant/:id', function(request, response){
    //REWORKED AND FINISHED WITH ERROR HANDLING
    const errors = []
    if(isNaN(request.params.id)){
        errors.push('The id you are trying to find is not in a correct format.')
        const model = { errors }
        response.render('menu.hbs', model)
    } else {
        const id = request.params.id;
        let isEditor = false;
        if(request.session.userId && request.session.accessLevel){
            if(request.session.accessLevel > 4){
                isEditor = true;
            } else {
                db.getCanEdit(id, request.session.userId).then(function(canEdit) {
                    isEditor = canEdit
                }).catch(function(error) {
                    if(error){
                        isEditor = false;
                    }
                })
            }
        }
        db.getRestaurantById(id).then(function(restaurant) {
            const model = {
                id: restaurant.id,
                name: restaurant.name,
                desc: restaurant.desc,
                rating: restaurant.rating,
                categories: restaurant.categories,
                canEdit: isEditor
            }
            response.render('menu.hbs', model)
        }).catch(function(error) {
            console.log("Error caugth in db.getRestaurantByID(): " , error)
            response.sendStatus('500')    
        })
    }
})


// LISTENING
app.listen(8080, function(){
    console.log("Server opened, listening on port 8080")
})