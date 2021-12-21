const mongoose = require("mongoose")
const bookModel = require("../models/bookModel")
const reviewModel = require("../models/reviewModel.js");
const userModel = require("../models/userModel")
const validate = require("../validation/validator")

//const createBook = async (req, res) => {
const createBook = async function (req, res) {
    try {
        const requestBody = req.body;

        if (!validate.isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide book details' })
            return
        }

        // Extract params
        const { title, excerpt, userId, ISBN, category, subcategory, reviews, releasedAt } = requestBody;

        // Validation starts
        if (!validate.isValid(title)) {
            res.status(400).send({ status: false, message: 'Book Title is required' })
            return
        }
        const isTitleAlreadyUsed = await bookModel.findOne({ title: title.trim() }); // {title: title} object shorthand property

        if (isTitleAlreadyUsed) {
            res.status(400).send({ status: false, message: `${title} title is already registered` })
            return
        }

        if (!validate.isValid(excerpt)) {
            res.status(400).send({ status: false, message: 'Book excerpt is required' })
            return
        }

        if (!validate.isValid(userId)) {
            res.status(400).send({ status: false, message: "user id is required" })
            return
        }

        if (!validate.isValidObjectId(userId.trim())) {
            res.status(400).send({ status: false, message: `${userId} is not a valid user id` })
            return
        }
        if (!validate.isValid(ISBN)) {
            res.status(400).send({ status: false, message: 'Book ISBN is required' })
            return
        }
        if(!validate.validateISBN(ISBN)){
            res.status(400).send({ status: false, message: 'plz provide valid Book ISBN' })
            return
        }

        const isISBNalreadyUsed = await bookModel.findOne({ ISBN : ISBN.trim() }); // {ISBN: ISBN} object shorthand property

        if (isISBNalreadyUsed) {
            res.status(400).send({ status: false, message: `${ISBN} ISBN  is already registered` })
            return
        }
        if (!validate.isValid(category)) {
            res.status(400).send({ status: false, message: 'book category is required' })
            return
        }
        if (!validate.isValid(subcategory)) {
            res.status(400).send({ status: false, message: 'book subcategory is required' })
            return
        }

        if (!validate.isValid(releasedAt)) {
            res.status(400).send({ status: false, message: 'book releasedAt is required' })
            return
        }

        const user = await userModel.findById(userId);

        if (!user) {
            res.status(400).send({ status: false, message: `user does not exit` })
            return
        }
        // Validation ends

        const bookData = {
            title: title.trim(),
            excerpt: excerpt.trim(),
            userId: userId,
            ISBN: ISBN.trim(),
            category: category.trim(),
            subcategory: subcategory.trim().split(',').map(subcat => subcat.trim()),
            reviews: reviews,
            releasedAt: releasedAt
        }

        let savedData = await bookModel.create(bookData)


        res.status(200).send({ status: true, message: ' Book creates Successfully', data: savedData })

    } catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }

};
// get books 
const getBooks = async function (req, res) {
    try {

        const filterQuery = { isDeleted: false }
        const queryParams = req.query

        // if (!queryParams) {
        //     return res.status(404).send({ status: false, message: 'plz provide queryparams for filters' })
        // }
        const { userId, category, subcategory } = queryParams

        if (validate.isValid(userId) && validate.isValidObjectId(userId)) {
            filterQuery['userId'] = userId
        }

        if (validate.isValid(category)) {
            filterQuery['category'] = category.trim()
        }

        if (validate.isValid(subcategory)) {
            const subcatArr = subcategory.trim().split(',').map(subcat => subcat.trim());
            filterQuery['subcategory'] = { $all: subcatArr }
        }


        const books = await bookModel.find(filterQuery).select({ title: 1, excerpt: 1, userId: 1, category: 1, reviews: 1, releasedAt: 1 })

        if (Array.isArray(books) && books.length === 0) {
            res.status(404).send({ status: false, message: 'No books found' })
            return
        }


        res.status(200).send({ status: true, message: 'book list', data: books })

    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
};
const bookDetails = async function (req, res) {
    try {
        let reqBookId = req.params.bookId
        // request  params  validation

        if (!validate.isValidObjectId(reqBookId)) {
            res.status(404).send({ status: false, msg: 'plz provide valid Book id' })
        }

        let bookData = await bookModel.findOne({ _id: reqBookId, isDeleted: false }).select({ ISBN: 0, __v: 0 })
        if (!bookData) {
            res.status(404).send({ status: false, msg: 'book not found for the requested BookId' })
        } else {

            let fetchReviews = await reviewModel.find({ bookId: reqBookId, isDeleted: false }).select({ bookId: 1, reviewedBy: 1, reviewedAt: 1, rating: 1, review: 1 })
            const { title, excerpt, userId, category, subcategory, releasedAt,isDeleted,deletedAt } = bookData
            const responseData = { title: title, excerpt: excerpt, userId: userId, category: category, subcategory: subcategory,  releasedAt: releasedAt,isDeleted:isDeleted,deletedAt:deletedAt}
            responseData['reviews'] = fetchReviews.length
            responseData['reviewsData'] = fetchReviews
            if (fetchReviews.length == 0) {
                return res.status(200).send({ status: true, msg: "no review", data: responseData })
            } else {
                res.status(200).send({ status: true, message: 'Success', data: responseData })
            }

        }
    } catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }

};
const updateBook = async function (req, res) {
    try {
        const requestBody = req.body
        const bookId = req.params.bookId
        const userIdFromToken = req.userId

        // Validation stats
        if (!validate.isValidObjectId(bookId)) {
            res.status(400).send({ status: false, message: `${bookId} is not a valid bookId id` })
            return
        }
        const book = await bookModel.findOne({ _id: bookId, isDeleted: false, deletedAt: null })
        if (!book) {
            res.status(404).send({ status: false, message: `book not found` })
            return
        }
        if (book.userId.toString() != userIdFromToken) {
            res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
            return
        }
        if (!validate.isValidRequestBody(requestBody)) {
            res.status(200).send({ status: true, message: 'No paramateres passed. Book unmodified', data: book })
            return
        }

        // if (!book) {
        //     res.status(404).send({ status: false, message: `book not found` })
        //     return
        // }

        // Extract body
        const { title, excerpt, ISBN, releasedAt } = requestBody;

        const updatedBookData = {}

        // if (!validate.isValid(title)) {
        //     res.status(400).send({ status: false, message: `title is required` })
        //     return
        // }
        if (validate.isValid(title)) {
            const isTitleAlreadyUsed = await bookModel.findOne({ title: title.trim() });

            if (isTitleAlreadyUsed) {
                res.status(400).send({ status: false, message: `title is already registered` })
                return
            }


            updatedBookData['title'] = title.trim()
        }

        if (validate.isValid(excerpt)) {

            updatedBookData['excerpt'] = excerpt.trim()
        }


        if (validate.isValid(ISBN)) {

            const isISBNalreadyUsed = await bookModel.findOne({ ISBN: ISBN.trim() });

            if (isISBNalreadyUsed) {
                res.status(400).send({ status: false, message: ` ISBN  is already registered` })
                return
            }

            updatedBookData['ISBN'] = ISBN.trim()
        }

        if (validate.isValid(releasedAt)) {
            updatedBookData['releasedAt'] = releasedAt
        }

        const updatedBook = await bookModel.findOneAndUpdate({ _id: bookId }, updatedBookData, { new: true })

        res.status(200).send({ status: true, message: 'Book updated successfully', data: updatedBook });
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}
//delete book
let deleteBook = async function (req, res) {
    try {
        const bookId = req.params.bookId
        const userIdFromToken = req.userId
        //let filter = { isDeleted: false }

        if (!(validate.isValid(bookId) && validate.isValidObjectId(bookId))) {
            return res.status(400).send({ status: false, msg: "bookId is not valid" })
        }
        const book = await bookModel.findOne({ _id: bookId })
        if (!book) {
            res.status(404).send({ status: false, message: `id don't exist in book collection` })
            return
        }

        if (book.userId.toString() != userIdFromToken) {
            res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
            return
        }

        let deletedBook = await bookModel.findOneAndUpdate({_id: bookId,isDeleted:false,deletedAt: null},
             { isDeleted: true, deletedAt: new Date() }, { new: true })
        if (!deletedBook) {
            res.status(404).send({ status: false, msg: "either the book is already deleted or you are not valid user to access this book" })
            return
        }
        res.status(200).send({ status: true, msg: "Book has been deleted", data: deletedBook })


    } catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
};


module.exports = { createBook, getBooks, bookDetails, updateBook, deleteBook }



