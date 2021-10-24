const { request } = require('express')
const express = require('express')
const router = express.Router()
const session = require('express-session')
const cookieParser = require('cookie-parser');
const db = require(__dirname + '/../database.js')
const validate = require(__dirname+'/../validators.js')
const csrf = require('csurf');
const { route } = require('./auth-router');

var routerWithoutCSRF = new express.Router()

routerWithoutCSRF.post('/delete/restaurant', function(request, response) {
    if(request.session.loggedIn == true && request.session.editingId && request.body.restaurantId){
        const rId = request.body.restaurantId
        db.deleteRestaurant(rId, function (error) {
            if (error) {
                const model = {
                    answer: "Could not delete restaurant",
                    error
                }
                response.render('delete.hbs', model)
            } else {
                response.redirect('../../')
            }
        })
    } else {
        response.redirect('delete.hbs', {answer: "No access."})
    }
})
routerWithoutCSRF.post('/delete/category', function(request, response) {
    if(request.session.loggedIn == true && request.session.editingId && request.body.categoryId){
        const rId = request.session.editingId
        if (request.session.loggedIn == true) {
            var cId = request.body.categoryId
            db.deleteCategory(cId, function (error) {
                if (error) {
                    const model = {
                        answer: "Could not delete category",
                        error
                    }
                    response.render('delete.hbs', model)
                } else {
                    response.redirect('/menu/edit/' + rId)
                }
            })
        }
    } else {
        const model = {
            answer: "No access."
        }
        response.render('delete.hbs', model)
    }
})
routerWithoutCSRF.post('/delete/item', function(request, response) {
    if(request.session.loggedIn == true && request.session.editingId && request.body.itemId){
        const rid = request.session.editingId
        var id = request.body.itemId
        db.deleteItem(id, function (error) {
            if (error) {
                const model = {
                    answer: "Item couldn't be deleted."
                }
                response.render('delete.hbs', model)
            } else {
                response.redirect('/menu/edit/' + rid)
            }
        })
    } else {
        response.redirect('delete.hbs', {answer: "No access."})
    }
})

router.use('/api', routerWithoutCSRF)

const csrfProtection = csrf({cookie: false})
router.use(csrfProtection)

router.get('/', function(request, response) {
    response.render('404.hbs')
})
//View and edit a menu
router.get('/:id', function(request, response){
    const errors = []
    if(isNaN(request.params.id)){
        response.render('404.hbs')
    } else {
        const id = request.params.id;
        if(request.session.loggedIn == true){
                db.getRestaurantById(id).then(function(restaurant) {
                    const model = {
                        id: restaurant.id,
                        name: restaurant.name,
                        desc: restaurant.desc,
                        rating: restaurant.rating,
                        categories: restaurant.categories,
                        canEdit: true
                    }
                    response.render('menu.hbs', model)
                }).catch(function(error) {
                    response.sendStatus('500')    
                })
            //})
        } else {
            db.getRestaurantById(id).then(function(restaurant) {
                const model = {
                    id: restaurant.id,
                    name: restaurant.name,
                    desc: restaurant.desc,
                    rating: restaurant.rating,
                    categories: restaurant.categories,
                    canEdit: false
                }
                response.render('menu.hbs', model)
            }).catch(function(error) {
                response.sendStatus('500')    
            })
        }
        
    }
})

router.get('/edit/:id', function(request, response) {
    const errors = []
    if(isNaN(request.params.id)){
        response.render('404.hbs')
    } else {
        const id = request.params.id;
        if(request.session.loggedIn == true){    
            request.session.editingId = id
            db.getRestaurantById(id).then(function(restaurant) {
                const model = {
                    id,
                    name: restaurant.name,
                    desc: restaurant.desc,
                    rating: restaurant.rating,
                    categories: restaurant.categories,
                    canEdit: true
                }
                response.render('edit.hbs', model)
            }).catch(function(error) {
                response.sendStatus('500')    
            })
        } else {
            response.redirect('../../auth/login')
        }
    }
})

//GET and POST of editing an restaurant.
router.get('/edit/restaurant/:id', function(request, response) {
    const errors = []
    if(isNaN(request.params.id)){
        errors.push('Invalid id')
        const model = {errors}
        response.render('editRestaurant.hbs', model)
    } else {
        const id = request.params.id
        if(request.session.editingId == id){
            const model = {
                id
            }
            response.render('editRestaurant.hbs', model)
        } else {
            response.redirect('/menu/edit/'+id)
        }
    }
})
router.post('/edit/restaurant/:id', function(request, response) {
    if(isNaN(request.params.id)){
        const errors = []
        errors.push("The restaurantid is not in a correct format.")
    } else {
        const id = request.params.id
        if(request.session.loggedIn == true){
            let name = request.body.restaurantName
            let desc = request.body.restaurantDesc
            const id = request.params.id
            const errors = validate.getRestaurantErrors(name, desc)
            if(errors.length > 0) {
                const model = {errors, id}
                response.render('editRestaurant.hbs', model)
            } else {               
                db.updateRestaurant(id, name, desc, function(error){
                    if(error){
                        errors.push("Could not update restaurant...")
                        const model = { errors }
                        response.render('editRestaurant.hbs', model)
                    } else {
                        response.redirect('/menu/edit/'+id)
                    }
                })
            }
        } else {
            const errors = []
            errors.push('You do not have access to this edit this resource')
            response.render('editRestaurant.hbs', model)
        }
    } 
})
//GET and POST of editing an category.
router.get('/edit/:rId/category/:id', function(request, response) {
    const errors = []
    if(request.params.id && request.params.rId) {
        const rId = request.params.rId
        const id = request.params.id
        if(rId != request.session.editingId){
            errors.push('You dont have access to edit this page.')
            const model = {errors}
            response.render('editCategory.hbs', model)
        } else {
             const model = {
                 rId,
                 id,
                 csrfToken: request.csrfToken()
             }
             response.render('editCategory.hbs', model)
        }
    } else {
        response.render('404.hbs')
    }
})
router.post('/edit/:rId/category/:id', function(request, response) {
    if (request.params.id, request.params.rId) {
        const id = request.params.id
        const rId = request.params.rId
        if (request.session.loggedIn == true) {
            const name = request.body.categoryName
            const desc = request.body.categoryDesc
            const id = request.params.id
            const errors = validate.getCategoryErrors(name, desc)
            if (errors.length > 0) {
                const model = { errors, id }
                response.render('editCategory.hbs', model)
            } else {
                db.updateCategory(id, name, desc, function (error) {
                    if (error) {
                        errors.push("Could not update category...", error)
                        const model = { errors }
                        response.render('editCategory.hbs', model)
                    } else {
                        response.redirect('/menu/edit/' + rId)
                    }
                })
            }
        } else {
            response.redirect('/menu/edit/' + rId)
        }
    }
})
//GET and POST of editing an item.
router.get('/edit/:rId/item/:id', function(request, response) {
    const errors = []
    if(request.params.id && request.params.rId) {
        const rId = request.params.rId
        const id = request.params.id
        if(rId != request.session.editingId){
            errors.push('You dont have access to edit this page.')
            const model = {errors}
            response.render('editItem.hbs', model)
        } else {
             const model = {
                 rId,
                 id,
                 csrfToken: request.csrfToken()
             }
             response.render('editItem.hbs', model)
        }
    } else {
        response.render('404.hbs')
    }
})
router.post('/edit/:rId/item/:id', function(request, response) {
    const errors = []
    if(request.params.id, request.params.rId){
        const id = request.params.id
        const rId = request.params.rId
        if (request.session.loggedIn == true) {
            var name = request.body.itemName
            var desc = request.body.itemDesc
            var price = request.body.itemPrice
            const id = request.params.id
            const errors = validate.getItemErrors(name, desc, price)
            if (errors.length > 0) {
                const model = { errors, id }
                response.render('editItem.hbs', model)
            } else {
                db.updateItem(id, name, desc, price, function (error) {
                    if (error) {
                        errors.push("Could not update item...")
                        const model = { errors }
                        response.render('editItem.hbs', model)
                    } else {
                        response.redirect('/menu/edit/' + rId)
                    }
                })
            }
        } else {
            response.redirect('/menu/edit/' + rId)
        }
    }
})


//GET and POST of creating an restaurant.
router.get('/create/restaurant', function(request, response) {
    if(request.session.loggedIn == true){
        response.render('createRestaurant.hbs', {csrfToken: request.csrfToken()})
    }
})
router.post('/create/restaurant', function(request, response) {
    const errors = []
    if(request.session.loggedIn == true){
        var name = request.body.rName;
        var desc = request.body.rDesc;
        db.createRestaurant(name, desc, 50, function(error, id) {
            if(error){
                errors.push(error)
                const model = {errors}
                response.render('createRestaurant.hbs', model)
            } else {
                request.session.editingId = id;
                response.redirect('/menu/edit/'+id)
            }
        })
    }
})

//GET and POST of creating an category.
router.get('/:rId/create/category', function(request, response) {
    if(request.params.rId){
        const rId = request.params.rId
        if(rId != request.session.editingId){
            errors.push('You dont have access to edit this page.')
            const model = {errors}
            response.render('createCategory.hbs', model)
        } else {
             const model = {
                 rId,
                 csrfToken: request.csrfToken()
             }
             response.render('createCategory.hbs', model)
        }
    }
})
router.post('/:rId/create/category', function(request, response) {
    if(request.params.id, request.params.rId){
        const rid = request.params.rId
        if (request.session.loggedIn == true) {
            let name = request.body.categoryName
            let desc = request.body.categoryDesc
            const errors = validate.getCategoryErrors(name, desc)
            if (errors.length > 0) {
                const model = { errors, rid }
                response.render('createCategory.hbs', model)
            } else {
                db.createCategory(name, desc, rid, function (error) {
                    if (error) {
                        errors.push("Could not update restaurant...")
                        const model = { errors }
                        response.render('createCategory.hbs', model)
                    } else {
                        response.redirect('/menu/edit/' + rid)
                    }
                })
            }
        } else {
            response.redirect('/menu/edit/' + rid)
        }
    }
})
//GET and POST of creating an item.
router.get('/category/:cId/create/item', function(request, response) {
    if(request.params.cId){
        if(!request.session.editingId){
            errors.push('You dont have access to edit this page.')
            const model = {errors}
            response.render('createItem.hbs', model)
        } else {
             const model = {
                 rId: request.session.editingId,
                 cId: request.params.cId,
                 csrfToken: request.csrfToken()
             }
             response.render('createItem.hbs', model)
        }
    }
})
router.post('/category/:cId/create/item', function(request, response) {
    const errors = []
    if(request.params.cId && request.session.editingId){
        const cId = request.params.cId
        const rId = request.session.editingId
        if (request.session.loggedIn == true) {
            var name = request.body.itemName
            var desc = request.body.itemDesc
            var price = request.body.itemPrice
            const errors = validate.getItemErrors(name, desc, price)
            if (errors.length > 0) {
                const model = { errors, id }
                response.render('createItem.hbs', model)
            } else {
                db.createItem(name, desc, price, cId, function (error) {
                    if (error) {
                        errors.push("Could not update restaurant...")
                        const model = { errors }
                        response.render('createItem.hbs', model)
                    } else {
                        response.redirect('/menu/edit/' + rId)
                    }
                })
            }
        } else {
            response.redirect('/menu/edit/' + rId)
        }
    }
})
//DELETE ROUTES
router.post('/delete/restaurant', function(request, response) {
    if(request.session.loggedIn == true && request.session.editingId && request.body.restaurantId){
        const rId = request.body.restaurantId
        db.deleteRestaurant(rId, function (error) {
            if (error) {
                const model = {
                    answer: "Could not delete restaurant",
                    error
                }
                response.render('delete.hbs', model)
            } else {
                response.redirect('../../')
            }
        })
    } else {
        response.redirect('delete.hbs', {answer: "No access."})
    }
})

router.post('/delete/category', function(request, response) {
    if(request.session.loggedIn == true && request.session.editingId && request.body.categoryId){
        const rId = request.session.editingId
        if (request.session.loggedIn == true) {
            var cId = request.body.categoryId
            db.deleteCategory(cId, function (error) {
                if (error) {
                    const model = {
                        answer: "Could not delete category",
                        error
                    }
                    response.render('delete.hbs', model)
                } else {
                    response.redirect('/menu/edit/' + rId)
                }
            })
        }
    } else {
        const model = {
            answer: "No access."
        }
        response.render('delete.hbs', model)
    }
})

router.get('/delete/item', function(request, response) {
    response.render('delete.hbs', { question: true, csrfToken: request.csrfToken()})
})

router.post('/delete/item', function(request, response) {
    if(request.session.loggedIn == true && request.session.editingId && request.body.itemId){
        const rid = request.session.editingId
        var id = request.body.itemId
        db.deleteItem(id, function (error) {
            if (error) {
                const model = {
                    answer: "Item couldn't be deleted."
                }
                response.render('delete.hbs', model)
            } else {
                response.redirect('/menu/edit/' + rid)
            }
        })
    } else {
        response.redirect('delete.hbs', {answer: "No access."})
    }
})

module.exports = router