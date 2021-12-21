const mongoose = require("mongoose")

const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}

const isValidTitle = function (title) {
    return ['Mr', 'Mrs', 'Miss'].indexOf(title) !== -1
}

const validateEmail = function (email) {
    var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email.trim())
};
const validatePassword = function (password) {
    var re = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,15}$/ ;
    return re.test(password.trim())
};
const validateISBN = function (ISBN) {
    var re = /^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/ ;
    //var re = /^(?:ISBN(?:-13)?:?\ )?(?=[0-9]{13}$|(?=(?:[0-9]+[-\ ]){4})[-\ 0-9]{17}$)97[89][-\ ]?[0-9]{1,5}[-\ ]?[0-9]+[-\ ]?[0-9]+[-\ ]?[0-9]$/ ;
    return re.test(ISBN.trim())
};


const validatePhone = function (phone) {
    var re =/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/ ;
    if(typeof(phone) == 'string'){
    return re.test(phone.trim())
    }else{
        return re.test(phone)
    }
};

const validateRating = function (rating) {
    var re = /^[0-5](\.[0-5][0-5]?)?$/ ;
    return re.test(rating.trim())
};


const isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}


module.exports = { isValid, isValidRequestBody, validateEmail, isValidTitle, isValidObjectId,validatePassword,validatePhone,validateISBN,validateRating}