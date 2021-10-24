const sqlite = require('sqlite3').verbose();
const fs = require('fs')
const dummyData = require('./dummy-data.js')

const path = 'database.db'
var initDB = false;


fs.access(path, fs.F_OK, (err) => {
    if(err){
        console.log("Database doesn't exist. Creating tables and filling them...");
        initDB = true;
    }
})

const db = new sqlite.Database('database.db', (error) => {
    db.get('PRAGMA foreign_keys = ON')
    if(error != null){
    } else {
        console.log("Connected to current database without issue.")
        if(initDB == true){
            initDB = false;
            //CREATE TABLES
            console.log("initdb");
            createTables();
        } else {
        }
    }
})

function createTables(){
    const sql1 = "CREATE TABLE IF NOT EXISTS restaurants (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, desc TEXT, rating INTEGER)";
    const sql2 = "CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, desc TEXT, restaurantId INTEGER, FOREIGN KEY(restaurantId) REFERENCES restaurants(id) ON DELETE CASCADE)";
    const sql3 = "CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, desc TEXT, price INTEGER, categoryId INTEGER, FOREIGN KEY(categoryId) REFERENCES categories(id) ON DELETE CASCADE)";
    db.serialize(function() {
        db.run(sql1)
        db.run(sql2)
        db.run(sql3)
        
        const sql = "INSERT INTO restaurants(name, desc, rating) VALUES (?, ?, ?)";
        for(var i = 0; i < dummyData.restaurants.length; i+=1){
            db.run(sql, [dummyData.restaurants[i].name, dummyData.restaurants[i].desc, dummyData.restaurants[i].rating]);
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

/* CRUD FUNCTIONS */

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
exports.getRestaurants = async function() {
    try{
            const restArray = await promiseRestaurants();
            await Promise.all(restArray.map(async (rest) => {
                rest.categories = await promiseCategoriesByRID(rest.id)
                await Promise.all(rest.categories.map(async(category) => {
                    category.items = await promiseItemsByCID(category.id)
                }))
            }))
            return restArray
        }catch(error){
            throw new Error(error)
        }
}



function promiseRestaurants(count) {
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
    const query = "UPDATE categories SET name = ?, desc = ? WHERE id = ?"
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
exports.createRestaurant = function(name, desc, rating, callback) {
    const sql = "INSERT INTO restaurants (name, desc, rating) VALUES (?, ?, ?)"
    db.run(sql, [name, desc, rating, isVisible], function(error) {
        callback(error, this.lastID)
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
    db.run(sql, [name, desc, price, cId], function(error) {
        callback(error)
    })
}
/* **************************** DELETE FUNCTIONALITY ************************************* */
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
