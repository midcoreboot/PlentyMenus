const { request } = require('express')
const express = require('express')
const router = express.Router()
const session = require('express-session')
const { updateRestaurant } = require('../database')
const db = require(__dirname + '/../database.js')
const validate = require(__dirname+'/../validators.js')

router.get('/', function(request, response) {
    response.render('404.hbs')
})

router.get('/:id', function(request, response){
    //REWORKED AND FINISHED WITH ERROR HANDLING
    const errors = []
    if(isNaN(request.params.id)){
        //errors.push('The id you are trying to find is not in a correct format.')
        //const model = { errors }
        response.render('404.hbs')
    } else {
        const id = request.params.id;
        if(request.session.loggedIn == true){
            db.canEdit(request.session.accessLevel, id, request.session.userId, function(error, bEdit) {
                if(error){
                    var isEditor = false
                } else {
                    var isEditor = bEdit;
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
            })
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
                console.log("Error caugth in db.getRestaurantByID(): " , error)
                response.sendStatus('500')    
            })
        }
        
    }
})

router.get('/edit/:id', function(request, response) {
    const errors = []
    
    if(isNaN(request.params.id)){
        //errors.push('The id you are trying to find is not in a correct format.')
        //const model = { errors }
        response.render('404.hbs')
    } else {
        const id = request.params.id;
        if(request.session.loggedIn == true){
            db.canEdit(request.session.accessLevel, id, request.session.userId, function(error, bEdit) {
                if(error) {
                    var isEditor = false;
                } else {
                   var isEditor = bEdit
                }
                
                if(isEditor = true){
                    request.session.editingId = id
                }
                db.getRestaurantById(id).then(function(restaurant) {
                    const model = {
                        id,
                        name: restaurant.name,
                        desc: restaurant.desc,
                        rating: restaurant.rating,
                        categories: restaurant.categories,
                        canEdit: isEditor
                    }
                    console.log("id: ", model.id)
                    response.render('edit.hbs', model)
                }).catch(function(error) {
                    console.log("Error caugth in db.getRestaurantByID(): " , error)
                    response.sendStatus('500')    
                })
            })
        } else {
            response.redirect('../auth/login')
        }
        
    }
})


router.get('/edit/restaurant/:id', function(request, response) {
    const errors = []
    if(isNaN(request.params.id)){
        errors.push('Invalid id')
        const model = {errors}
        response.render('editRestaurant.hbs', model)
    } else {
        const id = request.params.id
        if(request.session.editingId == id){
            const model = {id}
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
        db.canEdit(request.session.accessLevel,id, request.session.userId, function(err, userCanEdit) {
            if(err){
                response.render('500.hbs')
            } else {
                if(userCanEdit == true){
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
                    response.redirect('/edit/'+id)
                }
            }
        })
    }
})

router.get('/edit/:rId/category/:id', function(request, response) {
    // EASY WAY TO CHECK ACCESS.
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
                 id
             }
             response.render('editCategory.hbs', model)
        }
    } else {
        response.render('404.hbs')
    }
})
router.post('/edit/:rId/category/:id', function(request, response) {
    if(request.params.id, request.params.rId){
        const id = request.params.id
        const rid = request.params.rId
        db.canEdit(request.session.accessLevel,rid, request.session.userId, function(err, userCanEdit) {
            if(err){
                response.render('500.hbs')
            } else {
                if(userCanEdit == true){
                    let name = request.body.categoryName
                    let desc = request.body.categoryDesc
                    const id = request.params.id
                    const errors = validate.getCategoryErrors(name, desc)
                    if(errors.length > 0) {
                        const model = {errors, id}
                        response.render('editCategory.hbs', model)
                    } else {               
                        db.updateCategory(id, name, desc, function(error){
                            if(error){
                                errors.push("Could not update restaurant...")
                                const model = { errors }
                                response.render('editCategory.hbs', model)
                            } else {
                                response.redirect('/menu/edit/'+rid)
                            }
                        })
                    }
                } else {
                    response.redirect('/menu/edit/'+rid)
                }
            }
        })
    }
})

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
                 id
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
        const rid = request.params.rId
        db.canEdit(request.session.accessLevel,rid, request.session.userId, function(err, userCanEdit) {
            if(err){
                response.render('500.hbs')
            } else {
                if(userCanEdit == true){
                    var name = request.body.itemName
                    var desc = request.body.itemDesc
                    var price = request.body.itemPrice
                    const id = request.params.id
                    const errors = validate.getItemErrors(name, desc, price)
                    if(errors.length > 0) {
                        const model = {errors, id}
                        response.render('editItem.hbs', model)
                    } else {               
                        db.updateItem(id, name, desc, price, function(error){
                            if(error){
                                errors.push("Could not update restaurant...")
                                const model = { errors }
                                response.render('editItem.hbs', model)
                            } else {
                                response.redirect('/menu/edit/'+rid)
                            }
                        })
                    }
                } else {
                    response.redirect('/menu/edit/'+rid)
                }
            }
        })
    }
})

router.get('/create/restaurant', function(request, response) {
    if(request.session.loggedIn == true){
        response.render('createRestaurant.hbs')
    }
})
router.post('/create/restaurant', function(request, response) {
    const errors = []
    if(request.session.loggedIn == true){
        var name = request.body.rName;
        var desc = request.body.rDesc;
        db.createRestaurant(name, desc, 50, false, function(error, id) {
            if(error){
                errors.push(error)
                const model = {errors}
                response.render('createRestaurant.hbs', model)
            } else {
                db.createRestaurantEditor(id, request.session.userId, function(error) {
                    console.log("T")
                    if(error){
                        response.redirect('500.hbs')
                    } else {
                        //CREATED
                        request.session.editingId = id;
                        response.redirect('/menu/edit/'+id)
                    }
                })
            }
        })
    }
})


router.get('/:rId/create/category', function(request, response) {
    if(request.params.rId){
        const rId = request.params.rId
        if(rId != request.session.editingId){
            errors.push('You dont have access to edit this page.')
            const model = {errors}
            response.render('createCategory.hbs', model)
        } else {
             const model = {
                 rId
             }
             response.render('createCategory.hbs', model)
        }
    }
})
router.post('/:rId/create/category', function(request, response) {
    if(request.params.id, request.params.rId){
        //const id = request.params.id
        const rid = request.params.rId
        db.canEdit(request.session.accessLevel,rid, request.session.userId, function(err, userCanEdit) {
            if(err){
                response.render('500.hbs')
            } else {
                if(userCanEdit == true){
                    let name = request.body.categoryName
                    let desc = request.body.categoryDesc
                    const errors = validate.getCategoryErrors(name, desc)
                    if(errors.length > 0) {
                        const model = {errors, rid}
                        response.render('createCategory.hbs', model)
                    } else {               
                        db.createCategory(name, desc, rid, function(error){
                            if(error){
                                errors.push("Could not update restaurant...")
                                const model = { errors }
                                response.render('createCategory.hbs', model)
                            } else {
                                response.redirect('/menu/edit/'+rid)
                            }
                        })
                    }
                } else {
                    response.redirect('/menu/edit/'+rid)
                }
            }
        })
    }
})

router.get('/category/:cId/create/item', function(request, response) {
    if(request.params.cId){
        if(!request.session.editingId){
            errors.push('You dont have access to edit this page.')
            const model = {errors}
            response.render('createItem.hbs', model)
        } else {
             const model = {
                 rId: request.session.editingId,
                 cId: request.params.cId
             }
             response.render('createItem.hbs', model)
        }
    }
})
router.post('/category/:cId/create/item', function(request, response) {
    const errors = []
    if(request.params.cId && request.session.editingId){
        const cid = request.params.cId
        const rid = request.session.editingId
        db.canEdit(request.session.accessLevel,rid, request.session.userId, function(err, userCanEdit) {
            if(err){
                response.render('500.hbs')
            } else {
                if(userCanEdit == true){
                    var name = request.body.itemName
                    var desc = request.body.itemDesc
                    var price = request.body.itemPrice
                    const errors = validate.getItemErrors(name, desc, price)
                    if(errors.length > 0) {
                        const model = {errors, id}
                        response.render('createItem.hbs', model)
                    } else {               
                        db.createItem(name, desc, price, cid, function(error){
                            console.log("cid: ",cid)
                            if(error){
                                console.log(error)
                                errors.push("Could not update restaurant...", error)
                                const model = { errors }
                                response.render('createItem.hbs', model)
                            } else {
                                response.redirect('/menu/edit/'+rid)
                            }
                        })
                    }
                } else {
                    response.redirect('/menu/edit/'+rid)
                }
            }
        })
    }
})

router.post('/delete/restaurant', function(request, response) {
    if(request.session.loggedIn == true & request.body.rId){
        const rid = request.body.rId
        db.canEdit(request.session.accessLevel, rid, request.session.userId, function(err, userCanEdit) {
            if(err){
                response.render('500.hbs')
            } else {
                if(userCanEdit == true){
                    db.deleteRestaurant(rId, function(error) {
                        if(error){
                            const model = {
                                answer: "Could not delete restaurant",
                                error
                            }
                            response.render('delete.hbs', model)
                        } else {
                            response.redirect('/menu/edit/'+rid)
                        }
                    })
                }
            }
        })
    }
})

router.post('/delete/category', function(request, response) {
    if(request.session.loggedIn == true & request.session.editingId){
        const rid = request.session.editingId
        db.canEdit(request.session.accessLevel, rid, request.session.userId, function(err, userCanEdit) {
            if(err){
                response.render('500.hbs')
            } else {
                if(userCanEdit == true){
                    var cid = request.body.catId
                    db.deleteCategory(cid, function(error) {
                        if(error){
                            const model = {
                                answer: "Could not delete category",
                                error
                            }
                            response.render('delete.hbs', model)
                        } else {
                            response.redirect('/menu/edit/'+rid)
                        }
                    })
                }
            }
        })
    }
})

router.post('/delete/item', function(request, response) {
    if(request.session.loggedIn == true & request.session.editingId){
        const rid = request.session.editingId
        db.canEdit(request.session.accessLevel, rid, request.session.userId, function(err, userCanEdit) {
            if(err){
                response.render('500.hbs')
            } else {
                if(userCanEdit == true){
                    var id = request.body.itemId
                    db.deleteItem(id, function(error){
                        if(error){
                            const model = {
                                answer: "Item couldn't be deleted."
                            }
                            response.render('delete.hbs', model)
                        } else {
                            response.redirect('/menu/edit/'+rid)
                        }
                    })
                }
            }
        })
    }
})


// DO POST
module.exports = router