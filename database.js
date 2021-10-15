const connectSqlite3 = require('connect-sqlite3');
const sqlite = require('sqlite3').verbose();
const db = new sqlite.Database('database.db')

/* SQL FUNCTIONS */

/* FETCHING */
function fetchAll(id, callback){
    const query = 
    'SELECT r.name as rName, r.desc as rDesc, c.name as cName, c.desc as cDesc, i.name as itemName, i.desc as itemDesc FROM restaurants as r INNER JOIN categories as c ON r.id = c.restaurantId INNER JOIN items as i ON c.id = i.categoryId WHERE r.id = ?';
    db.all(query, [id], function(error, rows) {
        callback(error, rows)
    })
}


exports.createItem = function(name, desc, price, categoryId, callback) {
    //HANDLE IF PRICE IS STRING
    const sql = "INSERT INTO items (name, desc, price, categoryId) VALUES (?, ?, ?, ?)"
    db.run(sql, [name, desc, price, categoryId], function(error) {
        callback(error)
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

/*

exports.getRestaurants(){
    let db = new sqlite.Database('database.db')
    return new Promise((resolve,reject) => {
        const sql = "SELECT * FROM restaurants ORDER BY id LIMIT 10"
        db.all(sql, function(error,rows) {
            if(error){
                reject(error)
            } else {
                resolve(rows);
            }
        })
    }).then(function(res){
        db.close()
    })
}
exports.getCategoriesById(id) {
    let db = new sqlite.Database('database.db')
    return new Promise(function(resolve, reject) {
        const sql = "SELECT * FROM categories WHERE restaurantId = ?"
        db.all(sql,[id], function(error,rows){
            if(error){
                reject(error)
            } else {
                resolve(rows)
            }
        })
    }).then(function(err) {
        db.close()
    })
}
exports.getItemsById(cId) {
    let db = new sqlite.Database('database.db')
    return new Promise(function(resolve, reject) {
        const sql = "SELECT * FROM items WHERE categoryId = ?"
        db.all(sql, [cId], function(error,rows) {
            if(error){
                reject(error)
            } else {
                resolve(rows)
            }
        })
    }).then(function(err) {
        db.close()
    })
} */