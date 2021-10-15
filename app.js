const express = require('express')
const expressHandlebars = require('express-handlebars')
const session = require('express-session')
const sqlite3 = require('sqlite3')
const connectSqlite3 = require('connect-sqlite3')
const SQLiteStore = connectSqlite3(session)
const fs = require('fs')
const dummyData = require('./dummy-data.js')
const db = require('./database.js')
const { rawListeners, allowedNodeEnvironmentFlags } = require('process')
const { Console } = require('console')
const { resolve } = require('path')

const app = express()
//const path = 'database.db'
var initDB = false;

app.use(express.static('public'))
app.use(express.urlencoded({
    extended: false
}))
app.use(session({
    store: new SQLiteStore({db: "session-db.db"}),
    saveUninitialized: false,
    resave: false,
    secret: 'qopwepkma'
}))

app.use(function(request, response, next) {
    response.locals.session = request.session
    next()
})


/*
fs.access(path, fs.F_OK, (err) => {
    if(err){
        console.log("Database doesn't exist. Creating tables and filling them...");
        initDB = true;
    }
}) */

//const path = '/database.db'



///        MOOOOOOOOOOOVE SQL TO DATABASE.js



/*
const db = new sqlite3.Database('database.db', (error) => {
    if(error != null){
        //database doesnt exist
        console.log(error.message)
    } else {
        console.log("Connected to current database without issue.")
        if(initDB == true){
            initDB = false;
            //CREATE TABLES
            console.log("initdb");
            db.get("PRAGMA foreign_keys = ON")
            createTables();
        } else {
            db.get("PRAGMA foreign_keys = ON")
        }
    }
})  */

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


app.get('/', function(request, response){ 
    let restArray = []
    db.fetchTenRestaurants(function(error, restaurants) {
        restaurants.forEach((r) => {
            restArray.push(r)
            db.fetchCategoriesByRID(r.id, function(error, categories) {
                categories.forEach((c) => {
                    db.fetchItemsByCID(c.id, function(error, items) {
                        c.items = items;
                    })
                })
                r.categories = categories

            })
            
        })
        const model = {
            restaurants: restArray
        }
        response.render('menus.hbs', model)
    })
})

app.get('/getAll', function(request, response) {
    db.all("SELECT * FROM items WHERE categoryId = ?", [2], function(error, rows) {
        for(var i = 0; i < rows.length; i++){
            console.log(rows[i])
        }
    })
})

app.get('/restaurant/:id', function(request, response){
    const id = request.params.id
    db.fetchRestaurantById(id, function(error, restaurant) {
        db.fetchCategoriesByRID(id, function(error, categories) {
            const promises = []
            categories.forEach((c) => {
                c.items = new Promise((resolve, reject) => {
                    db.fetchItemsByCID(c.id, function(error, items) {
                        //console.log('items: ', items)
                        //c.items = items;
                        //console.log('c.items : ', c.items)
                        if(error){
                            reject(error)
                        } else {
                            resolve(items)
                        }
                    })
                }).then((items) => {
                    c.items = items
                })
                promises.push(c.items)
            })
            Promise.all(promises).then(function(results) {
                restaurant.categories = categories
                //console.log(restaurant.categories[0].items)
                const model = {
                    name: restaurant.name,
                    desc: restaurant.desc,
                    rating: restaurant.rating,
                    categories: restaurant.categories
                }
                response.render('menu.hbs', model)
            })
            //console.log(categories)

        })
        //console.log(restaurant)
        
    })
    /*
    getRestaurantById(id).then(function(r) {
        if(r.rating){
            rest = new Restaurant(r.id, r.name, r.desc, r.rating)
        } else {
            rest = new Restaurant(r.id, r.name, r.desc)
        }
        return new Promise(function(resolve, reject) {
            rest.getMyCategories().then(function(cats) {
                if(cats){
                    for(var i = 0; i < cats.length; i++){
                        let tempCat = new Category(cats[i].id, cats[i].name, cats[i].desc, cats[i].restaurantId)
                        rest.pushCategory(tempCat)
                    }
                    resolve(rest)
                } else {
                    resolve()
                }
            })
        })
    }).then(function(r){
        return Promise.all(r.categories.map(function(cat) {
            return cat.getMyItems().then(function(items) {
                if(items){
                    for(var i = 0; i < items.length; i++){
                        let tempI = new Item(items[i].name, items[i].desc, items[i].price, items[i].categoryId)
                        cat.pushItem(tempI);
                    }
                }
            })
        })).then(function(data) {
            console.log("R IS : " , r);
            rest = r;
        })
    }).then(function(data2) {
        if(rest) {
            const model = {
                name: rest.name,
                desc: rest.desc,
                rating: rest.rating,
                categories: rest.categories
            }
            response.render('menu.hbs', model)
        }
    }) */
    /*
    Restaurant.RestaurantById(id).then((result) => {
        console.log("RESULT IS NOW __ ", result);
        if(Array.isArray(result)){
            console.log("isanarray")
        } else {
            console.log("isnotanarray")
        }
        const model = {
            name: result.name,
            desc: result.desc,
            rating: result.rating,
            categories: result.categories
        }
        response.render('menu.hbs', model)
    }).catch((error) => {
        console.log("DID NOT FIND ID: " , id, "; error: " , error);
        response.sendStatus(404);
    }) */
})

app.get('/create', function(request, response) {
    if(session.isCreatingMenu == true && session.editingId) {
        console.log("COOOKIE INITIATED")
        console.log("editingid: " , session.editingId)
    } else {
        console.log("COOKIE DOESNT EXIST");
        console.log("editingid: " , session.editingId)
        session.isCreatingMenu = true;
        response.render('create.hbs')
    }
})

app.post('/created', function(request, response) {
    console.log("rName: ", request.body.rName);
    console.log("rDesc: ", request.body.rDesc);
    //VALIDATE DATA.
/*
    let restaurant = Restaurant.createRestaurant(request.body.rName, request.body.rDesc); */
    promiseRestaurant(request.body.rName, request.body.rDesc, 50).then(function(id) {
        //console.log("THIS ID IS CURRENTLY " + id)
        //session.editingId = id;
        //response.redirect('/create')
        Restaurant.RestaurantById(id).then((result) => {
            //console.log("RESULT IS NOW __ ", result);
            if(Array.isArray(result)){
                //console.log("isanarray")
            } else {
                //console.log("isnotanarray")
            }
            const model = {
                name: result.name,
                desc: result.desc,
                rating: result.rating,
                categories: result.categories
            }
            console.log("FULL MODEL FOR edit.hbs : " , model)
            response.render('edit.hbs', model)
        }).catch((error) => {
            console.log("DID NOT FIND ID: " , session.editingId, "; error: " , error);
            response.sendStatus(404);
        })    
        
    })
    //console.log("Restauranta id: " , restaurant);
    //session.restaurantObject = restaurant;
    //console.log("Session Restaurant id: " , session.restaurantObject)
    //response.redirect('')
})

app.get('/edit/:id',function(request, response) {
    const id = request.params.id
    session.editingId = id
    db.fetchRestaurantById(id, function(error, restaurant) {
        db.fetchCategoriesByRID(id, function(error, categories) {
            const promises = []
            categories.forEach((c) => {
                c.items = new Promise((resolve, reject) => {
                    db.fetchItemsByCID(c.id, function(error, items) {
                        //console.log('items: ', items)
                        //c.items = items;
                        //console.log('c.items : ', c.items)
                        if(error){
                            reject(error)
                        } else {
                            resolve(items)
                        }
                    })
                }).then((items) => {
                    c.items = items
                })
                promises.push(c.items)
            })
            Promise.all(promises).then(function(results) {
                restaurant.categories = categories
                console.log(restaurant.categories[0].items)
                const model = {
                    name: restaurant.name,
                    desc: restaurant.desc,
                    rating: restaurant.rating,
                    categories: restaurant.categories
                }
                response.render('edit.hbs', model)
            })
            //console.log(categories)

        })
        //console.log(restaurant)
        
    })
})

app.get('/add-category', function(request, response) {
    console.log("GET /add-category")
    response.render('createCategory.hbs')
})

app.post('/add-category', function(request, response) {
    insertCategory(request.body.categoryName, request.body.categoryDesc, session.editingId).then((cId) => {
        response.redirect('/edit/' + session.editingId);
    })
})

app.get('/seteditingid/:id', function(request, response) {
    session.editingId = request.params.id;
})

app.get('/additemto/:id', function(request, response) {
    let categoryId = parseInt(request.params.id) // NEEDS TO BE ESCAPED
    session.currentCategory = categoryId;
    response.render('createItem.hbs')
})

app.post('/createitem', function(request, response) {
    // CLOSE TO WORKINGsq
    console.log(session.currentCategory)
    if(session.currentCategory){
        console.log("ADDING ITEM") 
        //ITEM PRICE NEEDS TO BE PARSED
        console.log("test: ", request.body.itemName, request.body.itemDesc, parseInt(request.body.itemPrice), session.currentCategory)
        db.createItem(request.body.itemName, request.body.itemDesc, parseInt(request.body.itemPrice), session.currentCategory, function(error) {
            if(error){
                console.log("Failed creating item.")
            } else {
                response.redirect('/edit/'+session.editingId)
            }
        })
    } else {
        console.log("Couldnt find current category.");
        response.redirect('/')
    }
})

app.post('/login', function(request, response) {

})


function promiseRestaurant(name, desc, rating){
    return new Promise((resolve, reject) => {
        const query = "INSERT INTO restaurants (name, desc, rating) VALUES (?, ?, ?)";
        db.run(query, [name, desc, rating], function(error) {
            if(error){
                console.log("Error while trying to create restaurants", error);
                reject(error)
            } else {
                //console.log("this.lastID = ", this.lastID)
                resolve(this.lastID)
            }
        })
    })
}

function insertCategory(name, desc, rId){
    return new Promise((resolve, reject) => {
        const query = "INSERT INTO categories (name, desc, restaurantId) VALUES (?, ?, ?)";
        db.run(query, [name, desc, rId], function(error) {
            if(error){
                console.log("Error while trying to create category", error);
                reject(error)
            } else {
                resolve(this.lastId)
            }
        })
    })
}

function insertItem(name, desc, price, cId) {
    return new Promise((resolve, reject) => {
        const query = "INSERT INTO items (name, desc, price, categoryId) VALUES (?, ?, ?, ?)";
        db.run(query, [name, desc, price, cId], function(error) {
            if(error){
                console.log("Error while trying to create item", error)
                reject(error);
            } else {
                resolve(this.lastId);
            }
        })
    })
}

/* ******************************* CLASSES ***********************************/
/*

class Restaurant {
    constructor(id, name, desc, rating = 50){
        this.id = id
        this.name = name;
        this.desc = desc;
        this.categories = []
        this.rating = rating
        this.isFetching = false;
    }

    static createRestaurant(name, desc, rating){
        promiseRestaurant(name, desc, rating).then((id) => {
            let rest = new Restaurant(id, name, desc, rating)
            return rest;
        })
    }

    static RestaurantById(id){
        let promises = []
        var rest;
        let allItems = []
        //findItems(1)
        
        
        return new Promise((resolve, reject) => {
            getRestaurantById(id).then((restaurant) => {
                //console.log(restaurant);
                if(restaurant){
                    rest = new Restaurant(restaurant.id, restaurant.name, restaurant.desc, restaurant.rating)
                    return rest.promiseCategory();
                } else {
                    reject("Did not find the id.");
                }
            }).then((results) => {
                if(Array.isArray(results)){
                    //console.log("ALL RESULTS ARE AS FOLLOWED: " , results)
                    results.map((cat, index) => {
                        let temp = new Category(cat.id, cat.name, cat.desc);
                        console.log("PUSHING CATEGORY : " , temp, "index: " , index, "; id: ;", cat.id);
                        rest.pushCategory(temp);
                        promises.push(rest.categories[index].findItems());
                    }) 

                }
                //console.log("Current rest object: " , rest);
                return Promise.all(promises)
            }).then((ress) => {
                console.log("RESS = " ,ress + "; Length: " + ress.length);
                ress.map((result) => {
                    console.log("RESULT: " ,result)
                    if(result.length > 0){
                        console.log("ARRAY IS LENGTH: ", result.length)
                        result.map((item) => {
                            console.log("ITEM: ", item, "; name: ", item.name)
                            allItems.push(new Item(item.name, item.desc, item.price, item.categoryId))
                        })
                    } else if(result){
                        console.log("result was not array....")
                        allItems.push(new Item(item.name, item.desc, item.price, item.categoryId))
                    }
                }) 
                allitems.map((i) => {
                    console.log("I: " ,i)
                    rest.categories.map((c) => {
                        //console.log("C IS CURRENTLY ___ " , c, "; i IS CURRENTLY____" , i);
                        if(i.catagoryId == c.id){
                            c.pushItem(i)
                        }
                    })
                })
                resolve(rest)
            }).catch((error) => {
                console.log("ERROR CAUGHT TRYING TO FETCH ONE RESTAURANT (RestaurantByID(id)", error);
                reject(error);
            })
            
        }) 
        /*
        let promises = []
            getRestaurantById(id).then((restaurant) => {
                console.log(restaurant);
                let temp = new Restaurant(restaurant.id, restaurant.name, restaurant.desc, restaurant.rating);
                return temp.findCategories();
            }).then((error, cats) => {
                if(error){
                    console.log(error);
                } else {
                    console.log(cats)
                    this.categories.map((cat) => {
                        promises.push(cat.findItems());
                    })
                }
                return promises;
            }).catch(error => {
                console.log("error caught in findCategories: " , error);
            }) */
    //}

    //
/*
    pushCategory(category){
        //console.log("PUSHING CATEGORY: ", category.name, ", TO RESTAURANT: ", this.name)
        this.categories.push(category);
    }

    getMyCategories(){
        let id = this.id
        return new Promise(function(resolve) {
            const query = "SELECT * FROM categories WHERE restaurantId = ?"
            db.all(query, [id], function(error, rows) {
                if(error){
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    }

    findCategories(){
        //console.log("findCategories run from :" + this.name);
        return new Promise((resolve, reject) => {
            this.promiseCategory().then((rows) => {
                if(Array.isArray(rows)){
                    rows.map((row) => {
                        //console.log(row);
                        console.log(row.id, row.name, row.desc);
                        let temp = new Category(row.id, row.name, row.desc);
                        this.pushCategory(temp);
                    })
                } else {
                    //let temp = new Category(rows.id, rows.name, rows.desc);
                    //this.pushCategory(temp);
                }
                resolve(this.categories);
            }).catch((error) => {
                reject(error);
            })
        })
    }
    promiseCategory(){
        this.isFetching = true;
        let id = this.id
        let name = this.name
        const promises = []
        let cats = []
        console.log(id)
        return new Promise(function(resolve, reject) {
            const sql1 = "SELECT * FROM categories WHERE restaurantId = ?";
            db.each(sql1,[id], (error, row) => {
                if(error){
                    reject(error);
                } else {
                    let cat = new Category(row.id, row.name, row.desc, row.restaurantId)
                    //console.log("length_ " + row.length)
                    //console.log("Restaurant namE:" , name, "; Category name: " , row.name)
                    cats.push(cat)
                    console.log(cat)
                    promises.push(cat.findItems())
                }
            }, function(error, numberofRows) {
                return Promise.all(promises).then(function(results) {
                    resolve(results)
                }).catch(function(error) {
                    reject(error)
                })
            })
        }).then(function(result) {
            //this.pushCategory(cats)
        })
    }
}

class Category {
    constructor(id, name, desc, restaurantId){
        this.id = id
        this.name = name;
        this.desc = desc;
        this.rId = restaurantId
        this.items = []
        this.isFetching = false;
    }
    pushItem(item){
        this.items.push(item);
    }
    getMyItems(){
        let id = this.id
        
        return new Promise(function(resolve) {
            const query = "SELECT * FROM items WHERE categoryId = ?"
            db.all(query, [id], function(error, rows) {
                if(error){
                    reject(error)
                } else {
                    console.log("ROWS: ", rows)
                    resolve(rows)
                }
            }).then(function(t) {
                dbObj.close()
            })
        })
    }

    findItems(){
        return new Promise((resolve, reject) => {
            this.promiseItems().then((rows) => {
                //console.log("____________________________________________________________________")
                //console.log(rows)
                if(rows){
                    if(rows.length > 0){
                        rows.map((row) => {
                            let temp = new Item(row.name, row.desc, row.price, row.categoryId)
                            this.pushItem(temp);
                        })
                    } else {
                        if(rows){
                            console.log("ROWS LENGTH IS ZZZZZZZZZZZZZZZZZZZEEEEEEEEEEEEEEEEEEERRRRRRRRRRRRRROOOOOOOOOOOOO : ", rows)
                        }
                        //let temp = new Item(rows.name, rows.desc, rows.price, row.categoryId);
                        //this.pushItem(temp);
                    }
                    resolve(this.items);
                } 
            }).catch((error) => {
                reject(error)
            })
        })
    }
    promiseItems(){
        let id = this.id
        let items = []
        return new Promise(function(resolve, reject) {
            const query = "SELECT * FROM items WHERE categoryId = ?"
            db.each(query, [id], function(error, row) {
                if(error){
                    reject(error)
                } else {
                    let item = new Item(row.name, row.desc, row.price, row.categoryId)
                    items.push(item)
                }
            }, function(error, count) {
                this.items = items
                resolve(items)
            })
        })
    }
}

class Item {
    constructor(name, desc, price, categoryId){
        this.name = name;
        this.desc = desc;
        this.price = price;
        this.categoryId = categoryId
    }
}
 */

/* -------------------------- SQL FUNCTIONS ------------------- */

/*

function promiseFetch(){
    return new Promise((resolve, reject) => {
        
    })
}

function promiseCategory(id){
    return new Promise((resolve, reject) => {
        const sql1 = "SELECT * FROM categories WHERE restaurantId = ?";
        db.all(sql1,[id], (error, rows) => {
            if(error){
                reject(error);
            } else {
                if(rows.length > 0) {/*
                    var categories = [] 
                    for(let i = 0; i < rows.length; i++){
                        let row = rows[i]
                        console.log("MY OWN ID: "+ this.id + "; Row id:" + row.id)
                    } 
                    resolve(rows);
                }
            }
        })
    })
}

function getRestaurantById(id) {
    //console.log("ID: " , id)
    return new Promise(function(resolve, reject) {
        promiseRestaurant(id).then(function(r) {
            if(r.rating){
                rest = new Restaurant(r.id, r.name, r.desc, r.rating)
            } else {
                rest = new Restaurant(r.id, r.name, r.desc)
            }
            return new Promise(function(resolve, reject) {
                rest.getMyCategories().then(function(cats) {
                    if(cats){
                        for(var i = 0; i < cats.length; i++){
                            let tempCat = new Category(cats[i].id, cats[i].name, cats[i].desc, cats[i].restaurantId)
                            rest.pushCategory(tempCat)
                        }
                        resolve(rest)
                    } else {
                        resolve()
                    }
                })
            }).catch(function(error) {
                reject(error);
            })
        }).then(function(r){
            return Promise.all(r.categories.map(function(cat) {
                return cat.getMyItems().then(function(items) {
                    if(items){
                        for(var i = 0; i < items.length; i++){
                            let tempI = new Item(items[i].name, items[i].desc, items[i].price, items[i].categoryId)
                            cat.pushItem(tempI);
                        }
                    }
                })
            })).then(function(data) {
                //console.log("R IS : " , r);
                rest = r;
            })
        }).then(function(data2) {
            if(rest) {
                //console.log("REST IS " , rest)
                const model = {
                    name: rest.name,
                    desc: rest.desc,
                    rating: rest.rating,
                    categories: rest.categories
                }
                resolve(model)
            } else {
                resolve()
            }
        }).catch(function(error) {
            reject(error);
        })
    })
}

function promiseRestaurant(id) {
    return new Promise((resolve, reject) => {
        const sql1 = "SELECT * FROM restaurants WHERE id = ?";
        db.get(sql1, [id], (error, rest) => {
            if(error){
                console.log("Error trying to fetch restaurant id: " + id);
                reject(error);
            } else {
                if(typeof rest !== 'undefined'){
                    resolve(rest);
                } else {
                    reject('Found nothing while trying to fetch restaurant id: ' + id)
                }
            }
        })
    })
}

function getRestaurants(){
    return new Promise((resolve, reject) => {
        const sql1 = "SELECT * FROM restaurants ORDER BY id LIMIT 10"
        db.all(sql1, (error, rows) => {
            if(error){
                console.log("Error while trying to fetch restaurants. Message:" , error);
                reject(error);
            } else {
                //console.log(rows)
                resolve(rows);
            }
        })
    })
}
function getCategories(rId){
    return new Promise((resolve, reject) => {
        const sql1 = "SELECT * FROM categories WHERE restaurantId = ?";
        db.all(sql1,[rId], (error, rows) => {
            if(error){
                console.log("Error while trying to fetch categories for rId ="+ rId +". Message:" , error);
                reject(error);
            } else {
                resolve(rows);
            }
        })
    })
}

function getItems(categoryId){
    let items = []
    return new Promise(function(resolve, reject) {
        const query = "SELECT * FROM items WHERE categoryId = ?"
        db.each(query, [categoryId], function(error, row) {
            if(error){
                reject(error);
            } else {
                let item = {
                    name: row.name,
                    desc: row.desc,
                    price: row.price,
                    cId: row.categoryId
                }
                items.push(item)
            }
        }, function(error, count) {
            //console.log(items)
        })
    })
}


function createTables(){
    const sql0 = "PRAGMA foreign_keys = ON";
    const sql1 = "CREATE TABLE IF NOT EXISTS restaurants (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, desc TEXT, rating INTEGER)";
    const sql2 = "CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, desc TEXT, restaurantId INTEGER, FOREIGN KEY(restaurantId) REFERENCES restaurants(id))";
    const sql3 = "CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, desc TEXT, price INTEGER, categoryId, FOREIGN KEY(categoryId) REFERENCES categories(id))";
    db.serialize(function() {
        db.run(sql1)
        db.run(sql2)
        db.run(sql3)
        
        const sql4 = "INSERT INTO restaurants(name, desc, rating) VALUES (?, ?, ?)";
        for(var i = 0; i < dummyData.restaurants.length; i+=1){
            db.run(sql4, [dummyData.restaurants[i].name, dummyData.restaurants[i].desc, dummyData.restaurants[i].rating]);
        }
        console.log("Restaurants table populated without issue...")
        const sql5 = "INSERT INTO categories(name, desc, restaurantId) VALUES (?, ?, ?)";
        for(var i = 0; i < dummyData.categories.length; i+=1){
            db.run(sql5, [dummyData.categories[i].name, dummyData.categories[i].desc, dummyData.categories[i].rId]);
        }
        console.log("Categories table populated without issue...")
        const sql6 = "INSERT INTO items(name, desc, price, categoryId) VALUES (?, ?, ?, ?)";
        for(var i = 0; i < dummyData.items.length; i+=1){
            db.run(sql6, [dummyData.items[i].name, dummyData.items[i].desc, dummyData.items[i].price, dummyData.items[i].cId]);
        } 
        console.log("Items table populated without issue...")
    })
}


 */
// LISTENING
app.listen(8080, function(){
    console.log("Server opened, listening on port 8080")
})