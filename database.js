const sqlite = require('sqlite3').verbose();
const fs = require('fs')
const dummyData = require('./dummy-data.js')
const bcrypt = require('bcrypt')
//const db = new sqlite.Database('database.db')
const ACCESSLEVEL_TO_EDIT = 5

const path = 'database.db'
var initDB = false;


fs.access(path, fs.F_OK, (err) => {
    if(err){
        console.log("Database doesn't exist. Creating tables and filling them...");
        initDB = true;
    }
})

const db = new sqlite.Database('database.db', (error) => {
    //console.log("ssss")
    db.get('PRAGMA foreign_keys = ON')
    if(error != null){
        //database exists exist
        console.log(error.message)
        //db.get("PRAGMA foreign_keys = ON")
    } else {
        console.log("Connected to current database without issue.")
        if(initDB == true){
            initDB = false;
            //CREATE TABLES
            console.log("initdb");
            createTables();
            
        } else {
        //db.get("PRAGMA foreign_keys = ON")
        }
    }
})

function createTables(){
    const sql0 = "PRAGMA foreign_keys = ON";
    const sql1 = "CREATE TABLE IF NOT EXISTS restaurants (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, desc TEXT, rating INTEGER, isVisible BOOLEAN NOT NULL CHECK (isVisible IN (0,1)))";
    const sql2 = "CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, desc TEXT, restaurantId INTEGER, FOREIGN KEY(restaurantId) REFERENCES restaurants(id) ON DELETE CASCADE)";
    const sql3 = "CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, desc TEXT, price INTEGER, categoryId INTEGER, FOREIGN KEY(categoryId) REFERENCES categories(id) ON DELETE CASCADE)";
    const sql4 = "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, fullname TEXT, hash TEXT, accessLevel INTEGER DEFAULT 0)";
    const sqlFinal = "CREATE TABLE IF NOT EXISTS RestaurantsEditors (id INTEGER PRIMARY KEY AUTOINCREMENT, restaurantId INTEGER, userId INTEGER, FOREIGN KEY(restaurantId) REFERENCES restaurants(id), FOREIGN KEY(userId) REFERENCES users(id))";
    db.serialize(function() {
        db.run(sql1)
        db.run(sql2)
        db.run(sql3)
        db.run(sql4)
        db.run(sqlFinal)
        
        const sql = "INSERT INTO restaurants(name, desc, rating, isVisible) VALUES (?, ?, ?, ?)";
        for(var i = 0; i < dummyData.restaurants.length; i+=1){
            var bool;
            if(dummyData.restaurants[i].isVisible == true){
                bool = 1;
            } else {
                bool = 0;
            }
            db.run(sql, [dummyData.restaurants[i].name, dummyData.restaurants[i].desc, dummyData.restaurants[i].rating, bool]);
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
        bcrypt.hash('adminpass', 10, function(err, hash) {
            if(err) {
                //SEND ERROR
            } else {
                console.log(hash);
                const sql7 = "INSERT INTO users(username, fullname, hash, accessLevel) VALUES (?, ?, ?, ?)";
                db.run(sql7, ['midcoreboot', 'Rasmus Kolmodin', hash, 5]);
            }
        })
    })
}

/* SQL FUNCTIONS */

/* USER RELATED FUNCTIONS */
exports.getUserByUsername = function(username, callback){
    const query = 'SELECT * FROM users WHERE username = ?'
    db.get(query, [username], function(error, result) {
        callback(error, result)
    })
}

exports.createUser = function(username, fullname, hash, callback) {
    const query = 'INSERT INTO users (username, fullname, hash) VALUES (?, ?, ?)'
    db.run(query, [username, fullname, hash], function(error) {
        callback(error);
    })
}


/* RESTAURANTS */
function fetchAll(id, callback){
    const query = 
    'SELECT r.name as rName, r.desc as rDesc, c.name as cName, c.desc as cDesc, i.name as itemName, i.desc as itemDesc FROM restaurants as r INNER JOIN categories as c ON r.id = c.restaurantId INNER JOIN items as i ON c.id = i.categoryId WHERE r.id = ?';
    db.all(query, [id], function(error, rows) {
        callback(error, rows)
    })
}



exports.getRestaurant = function(id) {
    db.serialize(function() {
        var rest;
        var categories = []
        var items = []
        console.log("id:" , id)
        db.get("SELECT * FROM restaurants WHERE id = ?", [id], function(error, row) {
            if(error){
                console.log(error)
            } else {
                console.log("TEST")
                rest = row
            }
        }).each("SELECT * FROM categories WHERE restaurantId = ?", [id], function(error,row) {
            if(error){
                console.log(error)
            } else {
                console.log("REST IS NOW : " , rest)
                console.log("catname: " , row.name)
                categories.push(row)
            }
        }, function(error, count) {
            //
        })
        db.serialize(() => {
            
        for(var i = 0; i < categories.length; i++) {
            categories[i].items = []
            db.each("SELECT * FROM items WHERE categoryId = ?", [categories[i].id], function(error, row) {
                categories[i].items.push(row)
            })
        }
        })
        //rest.categories = categories
        console.log("FINAL REST: " , rest)
        let model = {
            name: rest.name,
            desc: rest.desc,
            rating: rest.rating,
            categories: categories,
        }
        console.log("FINAL : " , model)
    })
}
//TRY TO USE ASYNC
//FINAL USING CALLBACKS
exports.canEdit = function(accessLevel, rId, uId, callback) {
    var userCanEdit = false;
    var error;
    console.log("test1231")
    if(accessLevel >= ACCESSLEVEL_TO_EDIT) {
        callback(error, true)
    } else {
        const sql = "SELECT * FROM RestaurantsEditors WHERE restaurantId = ?"
        db.each(sql, [rId], function(er, row) {
            if(er){
                callback(er, false)
            } else {
                if(row.userId = uId){
                    userCanEdit = true;
                }
            }
        }, function(err, n){
            if(err){
                callback(err, false)
            } else {
                callback(error, userCanEdit)
            }
        })
    }
} 

function getCanEdit(restaurantId, userId){
    return new Promise(function(resolve, reject) {
        const query = "SELECT * FROM RestaurantsEditors WHERE restaurantId = ?";
        let isEditor = false;
        db.each(query, [restaurantId], function(error, row) {
            if(error){
                reject(error)
            } else {
                if(row.userId == userId){
                    isEditor = true;
                }
            }
        }, function(error) {
            if(error){
                reject(error)
            } else if(isEditor == true) {
                resolve(true)
            } else {
                resolve(false)
            }
        })
    })
}

exports.getCanEdit = function(restaurantId, userId) {
    return new Promise(function(resolve, reject) {
        const query = "SELECT * FROM RestaurantsEditors WHERE restaurantId = ?";
        let isEditor = false;
        db.each(query, [restaurantId], function(error, row) {
            if(error){
                reject(error)
            } else {
                if(row.userId == userId){
                    isEditor = true;
                }
            }
        }, function(error) {
            if(error){
                reject(error)
            } else if(isEditor == true) {
                reject(true)
            } else {
                reject(false)
            }
        })
    })
}
//USING THIS CURRENTLY
exports.getRestaurantById = async function(restaurantId) {
    try {
        const restaurant = await promiseRestaurantById(restaurantId)
        restaurant.categories = await promiseCategoriesByRID(restaurantId)
        await Promise.all(restaurant.categories.map(async(category) => {
            category.items = await promiseItemsByCID(category.id)
        }))
        return restaurant
    } catch(error) {
        throw new Error(error)
    }
}
exports.getTenRestaurants = async function() {
    try{
            const restArray = await promiseTenRestaurants();
            //console.log(restArray)
            await Promise.all(restArray.map(async (rest) => {
                rest.categories = await promiseCategoriesByRID(rest.id)
                //console.log(rest.categories)
                await Promise.all(rest.categories.map(async(category) => {
                    category.items = await promiseItemsByCID(category.id)
                    //console.log(category.items)
                }))
            }))
            return restArray
        }catch(error){
            throw new Error(error)
        }
}
function promiseTenRestaurants(count) {
    return new Promise(function(resolve, reject) {
        const query = "SELECT * FROM restaurants ORDER BY id ASC";
        db.all(query, function(error, restaurants) {
            if(error){
                reject(error)
            } else if(restaurants.length < 1){
                reject("No restaurants found.")
            } else {
                resolve(restaurants)
            }
        })
    })
}
function promiseCategoriesByRID(restaurantId) {
    return new Promise(function(resolve, reject) {
        const query = "SELECT * FROM categories WHERE restaurantId = ?";
        db.all(query, [restaurantId], function(error, categories) {
            if(error){
                reject(error)
            } else {
                resolve(categories)
            }
        })
    })
}
function promiseItemsByCID(categoryId) {
    return new Promise(function(resolve, reject) {
        const query = "SELECT * FROM items WHERE categoryId = ?";
        db.all(query, [categoryId], function(error, items) {
            if(error){
                reject(error)
            } else {
                resolve(items)
            }
        })
    })
}
function promiseRestaurantById(id) {
    return new Promise(function(resolve, reject) {
        const query = "SELECT * FROM restaurants WHERE id = ?";
        db.get(query, [id], function(error, restaurant) {
            if(error){
                reject(error)
            } else {
                resolve(restaurant)
            }
        })
    })
}
/* **************** RESTAURANT UPDATE FUNCTIONALITY ************* */
exports.updateRestaurant = function(id, name, desc, callback) {
    const query = "UPDATE restaurants SET name = ?, desc = ? WHERE id = ?"
    db.run(query, [name, desc, id], function(error) {
        callback(error)
    })
}
exports.updateCategory = function(id, name, desc, callback){
    const query = "UPDATE categories SET name = ?. desc = ? WHERE id = ?"
    db.run(query, [name, desc, id], function(error) {
        callback(error)
    })
}

exports.updateItem = function(id, name, desc, price, callback) {
    const query = "UPDATE items SET name = ?, desc = ?, price = ? WHERE id = ?"
    db.run(query, [name, desc, price, id], function(error) {
        callback(error)
    })
}
/********************************CREATE FUNCTIONALITY********************************** */
exports.createRestaurant = function(name, desc, rating, isVisible, callback) {
    const sql = "INSERT INTO restaurants (name, desc, rating, isVisible) VALUES (?, ?, ?, ?)"
    db.run(sql, [name, desc, rating, isVisible], function(error) {
        callback(error, this.lastID)
    })
}
exports.createRestaurantEditor = function(rid, uid, callback) {
    const sql = "INSERT INTO RestaurantsEditors (restaurantId, userId) VALUES (?, ?)"
    db.run(sql, [rid, uid], function(error) {
        callback(error)
    })
}
exports.createCategory = function(name, desc, rId, callback) {
    const sql = "INSERT INTO categories (name, desc, restaurantId) VALUES (?, ?, ?)"
    db.run(sql, [name, desc, rId], function(error) {
        callback(error)
    })
}
exports.createItem = function(name, desc, price, cId, callback) {
    const sql = "INSERT INTO items(name, desc, price, categoryId) VALUES (?, ?, ?, ?)"
    console.log(name, desc, price, cId)
    db.run(sql, [name, desc, price, cId], function(error) {
        callback(error)
    })
}

exports.deleteRestaurant = function(resId, callback) {
    const sql = "DELETE FROM restaurants WHERE id = ?"
    db.run(sql, [resId], function(err) {
        callback(err)
    })
}

exports.deleteCategory = function(catId, callback) {
    const sql = "DELETE FROM categories WHERE id = ?"
    db.run(sql, [catId], function(err) {
        callback(err)
    })
}

exports.deleteItem = function(itemId, callback) {
    const sql = "DELETE FROM items WHERE id = ?"
    db.run(sql, [itemId], function(err){
        callback(err)
    })
}





//FUNCTIONS NOT IN USE
exports.fetchTenRestaurants = function(callback) {
    const query = "SELECT * FROM restaurants ORDER BY id ASC LIMIT 10";
    db.all(query, function(error, restaurants) {
        callback(error, restaurants)
    })
}

exports.fetchRestaurantById = function(restaurantId, callback) {
    const query = "SELECT * FROM restaurants WHERE id = ?";
    db.get(query, [restaurantId], function(error, restaurant) {
        callback(error, restaurant)
    })
}

exports.fetchCategoriesByRID = function(restaurantId, callback) {
    const query = "SELECT * FROM categories WHERE restaurantId = ?";
    db.all(query, [restaurantId], function(error, categories) {
        callback(error, categories)
    })
}

exports.fetchItemsByCID = function(categoryId, callback) {
    const query = "SELECT * FROM items WHERE categoryId = ?"
    db.all(query, [categoryId], function(error, rows) {
        callback(error, rows)
    })
}

exports.fetchItemsByRID = function(restaurantId, callback) {
    const query = "SELECT i.name, i.desc, i.price, i.categoryId FROM items as i INNER JOIN categories as c ON i.categoryId = c.id INNER JOIN restaurants as r ON r.id = c.restaurantId WHERE r.id = ?";
    db.all(query,[restaurantId],function(error, items) {
        callback(error, items)
    })
}

exports.fetchAllRestaurants = function() {
    const query = "SELECT * FROM restaurants LIMIT 10"
    return new Promise(function(resolve, reject) {
        const results = []
        db.serialize(() => {
            db.each(query, function(error, restaurant) {
                /// ERROR HANDLING NEEDS TO BE DONE
        if(error){
            console.log(error)
        } else {
            fetchAll(restaurant.id, function(error, rows) {
                if(error){
                    console.log(error)
                    reject(error)
                } else {
                    console.log(rows.length)
                    for(var i = 0; i < rows.length; i++){
                        //console.log(rows[i])
                        let temp = rows[i]
                        console.log(temp)
                        results.push(temp)
                        console.log("results", results)
                    }
                }
            })
        }
    }, function(error,count) {
        if(error){
            reject(error)
        } else {
            console.log("Results: " ,results)
            resolve(results)
        }
    })
        })
        
    })
    
}

exports.fetchRestaurants = function(callback) {
    const query = "SELECT * FROM restaurants LIMIT 10"
    db.all(query, function(error, restaurants) {
        //console.log(restaurants)
        callback(error, restaurants)
    })
}

exports.fetchCategoryById = function(restaurantId, callback) {
    const query = "SELECT * FROM categories WHERE restaurantId = ?"
    db.all(query, [restaurantId], function(error, categories) {
        //console.log(categories)
        callback(error, categories)
    })
}

exports.fetchItemsById = function(categoryId, callback) {
    const query = "SELECT * FROM items WHERE categoryId = ?"
    db.all(query, [categoryId], function(error, items) {
        callback(error, items)
    })
}
