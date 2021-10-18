const MIN_USERNAME_LENGTH = 5
const MAX_USERNAME_LENGTH = 20
const MIN_FULLNAME_LENGTH = 3
const MIN_PASSWORD_LENGTH = 7 
const MAX_PASSWORD_LENGTH = 24
const MIN_RESTNAME_LENGTH = 8
const MAX_RESTNAME_LENGTH = 255
const MIN_RESTDESC_LENGTH = 24
const MIN_CATNAME_LENGTH = 3
const MAX_CATNAME_LENGTH = 36
const MIN_CATDESC_LENGTH = 3
const MIN_ITEMNAME_LENGTH = 3
const MAX_ITEMNAME_LENGTH = 100
const MIN_ITEMDESC_LENGTH = 5

//login:

exports.getRegistrationErrors = function(username, fullname, password) {
    const errors = []
    if(!username){
        errors.push("No username was submitted.")
    } else if(username.length > MAX_USERNAME_LENGTH){
        errors.push("The username submitted is too big, max length is" +MAX_USERNAME_LENGTH+" characters.")
    } else if(username.length < MIN_USERNAME_LENGTH) {
        errors.push("The username submitted is too short, atleast "+MIN_USERNAME_LENGTH+" characters.")
    }

    if(!fullname){
        errors.push("No Full-Name was submitted")
    } else if(fullname.length < MIN_FULLNAME_LENGTH){
        errors.push("Full-Name needs to be atleast"+MIN_FULLNAME_LENGTH+" characters.")
    }

    if(!password){
        errors.push("No password was submitted.")
    } else if(password.length < MIN_PASSWORD_LENGTH){
        errors.push("Password needs to be atleast: "+MIN_PASSWORD_LENGTH+" characters.")
    } else if(password.length > MAX_PASSWORD_LENGTH) {
        errors.push("Password cannot be longer than: "+MAX_PASSWORD_LENGTH+" characters.")
    } else {
        //REGEX EXPRESSION?
    }
    return errors;
}

//restaurants:
exports.getRestaurantErrors = function(name, desc){
    const errors = []
    if(!name){
        errors.push("Please enter a name for the restaurant.")
    } else if(name.length < MIN_RESTNAME_LENGTH){
        errors.push("Restaurant name needs to be atleast "+MIN_RESTNAME_LENGTH+" characters.")
    } else if(name.length > MAX_RESTNAME_LENGTH){
        errors.push("Restaurant can be at most "+MAX_RESTNAME_LENGTH+" characters.")
    }
    if(!desc){
        errors.push("Please enter a description for your restaurant.")
    } else if(desc < MIN_RESTDESC_LENGTH){
        errors.push("Restaurant description needs to be atleast "+MIN_RESTDESC_LENGTH+" characters.")
    }
    return errors
}
//CATEGORY
exports.getCategoryErrors = function(name, desc) {
    const errors = []
    if(!name){
        errors.push('Please enter a name for the category')
    } else if(name.length < MIN_CATNAME_LENGTH){
        errors.push('Category name is not long enough. It should be atleast '+MIN_CATNAME_LENGTH+' characters.')
    } else if(name.length > MAX_CATNAME_LENGTH){
        errors.push('Category name is too long. It can at most be '+MAX_CATNAME_LENGTH+' characters.')
    }
    if(!desc){
        errors.push("Please enter a description for your category.")
    } else if(desc < MIN_CATDESC_LENGTH){
        errors.push("Restaurant description needs to be atleast "+MIN_RESTDESC_LENGTH+" characters.")
    }
    return errors;
}
//ITEM
exports.getItemErrors = function(name, desc, price) {
    const errors = []
    if(!name){
        errors.push('Please enter a name for the item')
    } else if(name.length < MIN_ITEMNAME_LENGTH){
        errors.push('Item name is not long enough. It should be atleast '+MIN_ITEMNAME_LENGTH+' characters.')
    } else if(name.length > MAX_ITEMNAME_LENGTH){
        errors.push('Category name is too long. It can at most be '+MAX_ITEMNAME_LENGTH+' characters.')
    }
    if(!desc){
        errors.push("Please enter a description for your category.")
    } else if(desc < MIN_ITEMDESC_LENGTH){
        errors.push("Restaurant description needs to be atleast "+MIN_ITEMDESC_LENGTH+" characters.")
    }
    if(!price){
        errors.push("Please enter a price for the product.")
    }
    return errors;
}