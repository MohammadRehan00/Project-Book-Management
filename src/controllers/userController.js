const validate = require("../validation/validator")
const userModel = require("../models/userModel")
const jwt = require('jsonwebtoken')



//---------------------------------------------------------------------------------------
const createUser = async function (req, res) {

  try {
    const requestBody = req.body;
    const { title, name, phone, email, password, address } = requestBody


    console.log(req.body)

    if (!validate.isValidRequestBody(requestBody)) {
      res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide author details' })
      return
    }

    if (!validate.isValid(title)) {
      res.status(400).send({ status: false, message: 'Title is required' })
      return
    }

    if (!validate.isValidTitle(title)) {
      res.status(400).send({ status: false, message: `Title should be among Mr, Mrs, Miss` })
      return
    }

    if (!validate.isValid(name)) {
      res.status(400).send({ status: false, message: `name is required` })
      return
    }
    if (typeof (name) != 'string') {
      return res.status(400).send({ status: false, message: "Numbers are not allowed" })
    }
    if (!validate.isValid(phone)) {
      res.status(400).send({ status: false, message: `phone no. is required` })
      return
    }

    if (!validate.validatePhone(phone)) {
      res.status(400).send({ status: false, message: `phone should be a valid number` });
      return;
    }


    const isPhoneNumberAlreadyUsed = await userModel.findOne({ phone: phone });


    if (isPhoneNumberAlreadyUsed) {
      res.status(400).send({ status: false, message: `${phone} mobile number is already registered`, });
      return;
    }


    if (!validate.isValid(email)) {
      res.status(400).send({ status: false, message: `Email is required` })
      return
    }

    if (!validate.validateEmail(email)) {
      res.status(400).send({ status: false, message: `Email should be a valid email address` })
      return
    }

    if (!validate.isValid(password)) {
      res.status(400).send({ status: false, message: `Password is required` })
      return
    }
    if (!validate.validatePassword(password)) {
      res.status(400).send({ status: false, message: 'password should be between 8 and 15 characters' })
      return
    }

    const isEmailAlreadyUsed = await userModel.findOne({ email }); // {email: email} object shorthand property

    if (isEmailAlreadyUsed) {
      res.status(400).send({ status: false, message: `${email} email address is already registered` })
      return
    }

    const savedData = await userModel.create(req.body)
    res.status(201).send({ status: true, msg: "successfully created", data: savedData })



  } catch (err) {

    res.status(500).send({ status: false, msg: err.message })

  }

}
const loginUser = async function (req, res) {
  try {
    const requestBody = req.body;
    if (!validate.isValidRequestBody(requestBody)) {
      res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide login details' })
      return
    }

    // Extract params
    const { email, password } = requestBody;

    // Validation starts
    if (!validate.isValid(email)) {
      res.status(400).send({ status: false, message: `Email is required` })
      return
    }

    if (!validate.validateEmail(email)) {
      res.status(400).send({ status: false, message: `Email should be a valid email address` })
      return
    }

    if (!validate.isValid(password)) {
      res.status(400).send({ status: false, message: `Password is required` })
      return
    }
    if (!validate.validatePassword(password)) {
      res.status(400).send({ status: false, message: 'password should be between 8 and 15 characters' })
      return
    }
    // Validation ends

    const user = await userModel.findOne({ email: email, password: password });

    if (!user) {
      res.status(401).send({ status: false, message: `Invalid login credentials` });
      return
    }

    const token = await jwt.sign({
      userId: user._id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 1800
    }, 'soramoki')

    res.header('x-api-key', token);
    res.status(200).send({ status: true, message: `user login successfull`, data: { token } });
  } catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
}


module.exports = { createUser, loginUser }