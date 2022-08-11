/****************************Dependencies****************************/
// import dependencies in use
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');

//validation of the objects using express validator
const { check, validationResult, header } = require('express-validator');
const { json } = require('body-parser');
//get express session
const session = require('express-session');

/****************************Database****************************/
//MongoDB
// Takes two arguments path - Includes type of DB, ip with port and name of database
// If awesomestore was not created this would create it through code!!!
mongoose.connect('mongodb://localhost:27017/awesomestore',
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

// define the collection(s) for user
const User = mongoose.model('User', {
    name: String,
    email: String,
    phone: String,
    postcode: String,
    address: String,
    country: String,
    province: String,
    password: String,
    isadmin: String,
});
// define the collection(s) for book
const Book = mongoose.model('Book', {
    bookId: String,
    bookName: String,
    authorName:String,
    description: String,
    imageName: String,
    quantity: String,
    price: String
});
const Author = mongoose.model('Author', {
    bookId: String,
    authorId:String,
    authorName:String
});
const BookSet = mongoose.model('BookSet', {
    bookId: String,
    authorId:String,
    bookName:String
});
const Order = mongoose.model('Order', {
    bookId: String,
    userId:String,
    quantity: String,
    price: String
});
const Cart = mongoose.model('Cart', {
    bookId: String,
    bookName: String,
    userId:String,
    quantity: String,
    price: String
});

/****************************Variables****************************/
var myApp = express();
myApp.use(express.urlencoded({ extended: false }));
// Setup session to work with app
// secret is a random string to use for the the hashes to save session cookies.
// resave - false prevents really long sessions and security threats from people not logging out.
// saveUninitialized - record a session of a user to see how many users were on your site even if
// they did not login or create any session variables.
myApp.use(session({
    secret: 'superrandomsecret',//Should look more like 4v2j3h4h4b324b24k2b3jk4b24kj32nb4
    resave: false,
    saveUninitialized: true
}));

//parse application json
myApp.use(express.json());
// set path to public folders and view folders
myApp.set('views', path.join(__dirname, 'views'));
//use public folder for CSS etc.
myApp.use(express.static(__dirname + '/public'));
myApp.set('view engine', 'ejs');
//use file upload for image upload
myApp.use(fileUpload());

// ----------Validation Functions --------------
// phone regex for 123-123-2341
var phoneRegex = /^[0-9]{3}\-?[0-9]{3}\-?[0-9]{4}$/;
var postRegex = /^[A-Za-z][0-9][A-Za-z]\s?[0-9][A-Za-z][0-9]$/; //postcode regex
//credit card number regex in format xxxx-xxxx-xxxx-xxxx
var rsCreditCard = /^(\d{4})\s?(\d{4})\s?(\d{4})\s?(\d{4})|(\d{16})|(\d{4})\-?(\d{4})\-?(\d{4})\-?(\d{4})$/;
//regex for numeric values
var numberRegex = /^\d*$/;
//credit card expiry month regex
var monthRegex = /^([Jj][Aa][Nn]|[Ff][Ee][bB]|[Mm][Aa][Rr]|[Aa][Pp][Rr]|[Mm][Aa][Yy]|[Jj][Uu][Nn]|[Jj][u]l|[aA][Uu][gG]|[Ss][eE][pP]|[oO][Cc]|[Nn][oO][Vv]|[Dd][Ee][Cc])$/;
//credit card expiry year regex
var yearRegex = /^[1-9][0-9]{3}$/;
var user="";
/****************************Page Routes****************************/

myApp.get('/user', function (req, res) {
    res.render('user', { userLoggedIn: req.session.userLoggedIn });
});

//validates the fields
myApp.post('/user', [
    check('name', 'Name is required!').notEmpty(),
    check('email', 'Email is required').isEmail(),
    check('address', 'Address is required!').notEmpty(),
    check('postcode', '').custom(customPostCodeValidation),
    check('province', 'Province is required!').notEmpty(),
    check('phone', '').custom(customPhoneValidation), //custom validation for phone number
    check('password', 'Password is required!').notEmpty(),
    check('isadmin', 'Select if Admin or User').notEmpty()
], function (req, res) {
    const errors = validationResult(req);
    console.log(errors);//logging this error will show us in the terminal that errors is an array and msg is what we need to print client side
    if (!errors.isEmpty()) {
        res.render('user', {
            errors: errors.array()
        });
    }
    else {
        var name = req.body.name;
        var email = req.body.email;
        var phone = req.body.phone;
        var postcode = req.body.postcode;
        var address = req.body.address;
        var country = req.body.country;
        var province = req.body.province;
        var password = req.body.password;
        var isadmin = req.body.isadmin;

        var pageData = {
            name: name,
            email: email,
            phone: phone,
            postcode: postcode,
            address: address,
            country: country,
            province: province,
            password: password,
            isadmin: isadmin
        }
// saves the entered details to mongo db as order object
        var myNewUser = new User(
            pageData
        );
        myNewUser.save().then(() => console.log('New User saved'));

        res.redirect('/login');
    }
});

//Description:Function to check a string using regex
//Value:returns true if the regex is valid else false
//Parameters:user input value and the regex expression
function checkRegex(userInput, regex) {
    if (regex.test(userInput)) {
        return true;
    }
    return false;
}

// Value:Custom validation functions return true if conditions are satisfied or throws an error of type Error as phone number format incorrect
//Description:Validates the phone number
//Parameter:the user input phone number
function customPhoneValidation(value) {
    if (!checkRegex(value, phoneRegex)) {
        throw new Error('Phone should be in the format xxx-xxx-xxxx');
    }
    return true;
}
function customCardValidation(value) {
    if (!checkRegex(value, rsCreditCard)) {
        throw new Error('CreditCard should be in the format xxxx-xxxx-xxxx-xxxx');
    }
    return true;
}
function customPostCodeValidation(value) {
    if (!checkRegex(value, postRegex)) {
        throw new Error('Post Code should be in the format XDX DXD');
    }
    return true;
}
function customMonthValidation(value) {
    if (!checkRegex(value, monthRegex)) {
        throw new Error('Exp Month should be in the format MMM');
    }
    return true;
}
function customYearValidation(value) {
    if (!checkRegex(value, yearRegex)) {
        throw new Error('Exp Year should be in the format YYYY');
    }
    return true;
}

//home page
//Description:Function to home page
//Value:returns response value of home page
//Parameters:user input values of request and response
myApp.get('/', function (req, res) {
    Book.find({}).exec(function (err, books) {
        User.findOne({ _id: req.session.username }).exec(function (err, user) {
        });
        res.render('form', { user:user,books: books, userLoggedIn: req.session.userLoggedIn });
    });
});

//Login Page
myApp.get('/login', function (req, res) {
        res.render('login', {userLoggedIn: req.session.userLoggedIn });
    
});

//Login page
//Description:Function to login Page
//Value:returns response value of login page, If there is an error it will put it in the err variable otherwise the page
//Parameters:user input values of request and response
myApp.post('/login', function (req, res) {
    var user = req.body.username;
    var pass = req.body.password;

    User.findOne({ name: user, password: pass }).exec(function (err, user) {
        // log any errors
        console.log('Error: ' + err);
        console.log('Admin: ' + user);
        if(user!=null){
            if (user.isadmin==="no") {
                //store username in session and set logged in true
                req.session.username = user._id;
                req.session.userLoggedIn = true;
                console.log(req.session.username);
                // redirect to the dashboard
                Book.find({}).exec(function (err, books) {
                    res.render('form', { user: user,books: books, userLoggedIn: req.session.userLoggedIn,userid:req.session.username });
                });
                //res.redirect('/');
            }
            else if (user.isadmin==="yes") {
                //store username in session and set logged in true
                req.session.username = user._id;
                req.session.userLoggedIn = true;
                // redirect to the admin dashboard
                Book.find({}).exec(function (err, books) {
                    res.render('admin', { user: user,books: books, userLoggedIn: req.session.userLoggedIn });
                });
                //res.redirect('/admin');
            }
        }
        else {
           
                res.render('login', { error: 'Sorry, cannot login!' });
           
        }
    });
});

//Admin Page
//Description:Function to admin Page
//Value:returns response value of admin page, If there is an error it will put it in the err variable otherwise the page
//Parameters:user input values of request and response
myApp.get('/admin', function (req, res) {
    res.render('admin', { userLoggedIn: req.session.userLoggedIn });
});

//Details in each user

myApp.get('/userdetail/:id', function (req, res) {
    // check if the user is logged in
    var userid = req.params.id;
    console.log(userid);
    User.findOne({ _id: userid }).exec(function (err, user) {
        console.log('Error: ' + err);
        console.log('User: ' + user);
        if (user) {
            res.render('userdetail', { user: user, userLoggedIn: req.session.userLoggedIn });//Render edit with the page
        }
        else {
            //This will be displayed if the user is trying to change the page id in the url
            res.send('No user found with that id...');
        }
    });
});

//Contact Page
myApp.get('/contact',function(req,res){
    res.render('contactform',{userLoggedIn:req.session.userLoggedIn}); 
});

//About Us Page
myApp.get('/about',function(req,res){
    res.render('aboutus',{userLoggedIn:req.session.userLoggedIn}); 
});

// Get page for Edit
//Use uniques mongodb id

myApp.get('/edit/:userid', function (req, res) {
    // check if the user is logged in
    if (req.session.userLoggedIn) {
        var userid = req.params.userid;
        console.log(userid);
        User.findOne({ _id: userid }).exec(function (err, user) {
            console.log('Error: ' + err);
            console.log('User: ' + user);
            if (user) {
                res.render('edit', { user: user, userLoggedIn: req.session.userLoggedIn });//Render edit with the page
            }
            else {
                //This will be displayed if the user is trying to change the page id in the url
                res.send('No user found with that id...');
            }
        });
    }
    else {
        res.redirect('/login');
    }
});

//Does the edit with post method
myApp.post('/edit/:id', [
    check('name', 'Must have a Page Title').not().isEmpty(),
], function (req, res) {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        var userid = req.params.id;
        User.findOne({ _id: userid }).exec(function (err, user) {
            console.log('Error: ' + err);
            console.log('User: ' + user);
            if (user) {
                res.render('edit', { user: user, errors: errors.array() });
            }
            else {
                res.send('No user found with that id...');
            }
        });
    }
    else {
        var name = req.body.name;
        var email = req.body.email;
        var phone = req.body.phone;
        var postcode = req.body.postcode;
        var address = req.body.address;
        var country = req.body.country;
        var province = req.body.province;
        var isadmin = req.body.isadmin;
        var id = req.params.id;
            User.findOne({ _id: id }, function (err, user) {
                user.name = name;
                user.email=email;
                user.phone=phone;
                user.postcode=postcode;
                user.address=address;
                user.country=country;
                user.province=province;
                user.isadmin=isadmin;
                user.save();
                res.render('editsuccess', { user: user,userLoggedIn: req.session.userLoggedIn });
            });
        
    }
});
//Logout Page
//Description:Function to Logout Page
//Value:returns response value of logout page
//Parameters:user input values of request and response
myApp.get('/logout', function (req, res) {
    //Remove variables from session
    req.session.username = '';
    req.session.userLoggedIn = false;
    //res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    
        res.render('logout', { message: 'You have successfully logged out!', userLoggedIn: req.session.userLoggedIn });
   
});
// Get All Users
//Description:Function to fetch all Pages
//Value:returns response value of all pages, If there is an error it will put it in the err variable otherwise the page
//Parameters:user input values of request and response
myApp.get('/userlist', function (req, res) {
    // check if the user is logged in
    if (req.session.userLoggedIn) {
        console.log(req.session.userLoggedIn);
        User.find({}).exec(function (err, users) {
            res.render('userlist', { users: users, userLoggedIn: req.session.userLoggedIn });
        });
    }
    else { // otherwise send the user to the login page
        res.redirect('/login');
    }
});

// Get page for Edit
//Use uniques mongodb id

myApp.get('/adminedit/:userid', function (req, res) {
    // check if the user is logged in
    if (req.session.userLoggedIn) {
        var userid = req.params.userid;
        console.log(userid);
        User.findOne({ _id: userid }).exec(function (err, user) {
            console.log('Error: ' + err);
            console.log('User: ' + user);
            if (user) {
                res.render('edituser', { user: user, userLoggedIn: req.session.userLoggedIn });//Render edit with the page
            }
            else {
                //This will be displayed if the user is trying to change the page id in the url
                res.send('No user found with that id...');
            }
        });
    }
    else {
        res.redirect('/login');
    }
});

//Does the edit with post method
myApp.post('/adminedit/:id', [
    check('name', 'Name is required!').notEmpty(),
    check('email', 'Email is required').isEmail(),
    check('address', 'Address is required!').notEmpty(),
    check('postcode', '').custom(customPostCodeValidation),
    check('province', 'Province is required!').notEmpty(),
    check('phone', '').custom(customPhoneValidation), //custom validation for phone number
    check('isadmin', 'Select if Admin or User').notEmpty()
], function (req, res) {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        var userid = req.params.id;
        User.findOne({ _id: userid }).exec(function (err, user) {
            console.log('Error: ' + err);
            console.log('User: ' + user);
            if (user) {
                res.render('edituser', { user: user, errors: errors.array() });
            }
            else {
                res.send('No user found with that id...');
            }
        });
    }
    else {
        var name = req.body.name;
        var email = req.body.email;
        var phone = req.body.phone;
        var postcode = req.body.postcode;
        var address = req.body.address;
        var country = req.body.country;
        var province = req.body.province;
        var isadmin = req.body.isadmin;
        var id = req.params.id;
            User.findOne({ _id: id }, function (err, user) {
                user.name = name;
                user.email=email;
                user.phone=phone;
                user.postcode=postcode;
                user.address=address;
                user.country=country;
                user.province=province;
                user.isadmin=isadmin;
                user.save();
            });
        
        res.render('admineditsuccess', { userLoggedIn: req.session.userLoggedIn });
    }
});
//Delete User
//Use uniques mongodb id
//Description:Function to Delete Page
//Value:returns response value of delete page, If there is an error it will put it in the err variable otherwise the page
//Parameters:user input values of request along with unique page id and response
myApp.get('/delete/:userid', function (req, res) {
    // check if the user is logged in
    if (req.session.userLoggedIn) {
        //delete
        var userid = req.params.userid;
        console.log(userid);
        User.findByIdAndDelete({ _id: userid }).exec(function (err, user) {
            console.log('Error: ' + err);
            console.log('User: ' + user);
            if (user) {
                res.render('delete', { message: 'Successfully deleted!', userLoggedIn: req.session.userLoggedIn });
            }
            else {
                res.render('delete', { message: 'Sorry, could not delete!', userLoggedIn: req.session.userLoggedIn });
            }
        });
    }
    else {
        res.redirect('/login');
    }
});

myApp.get('/adduser', function (req, res) {
    res.render('adduser', { userLoggedIn: req.session.userLoggedIn });
});

//validates the fields
myApp.post('/adduser', [
    check('name', 'Name is required!').notEmpty(),
    check('email', 'Email is required').isEmail(),
    check('address', 'Address is required!').notEmpty(),
    check('postcode', '').custom(customPostCodeValidation),
    check('province', 'Province is required!').notEmpty(),
    check('phone', '').custom(customPhoneValidation), //custom validation for phone number
    check('password', 'Password is required!').notEmpty(),
    check('isadmin', 'Select if Admin or User').notEmpty()
], function (req, res) {
    const errors = validationResult(req);
    console.log(errors);//logging this error will show us in the terminal that errors is an array and msg is what we need to print client side
    if (!errors.isEmpty()) {
        res.render('adduser', {
            errors: errors.array()
        });
    }
    else {
        var name = req.body.name;
        var email = req.body.email;
        var phone = req.body.phone;
        var postcode = req.body.postcode;
        var address = req.body.address;
        var country = req.body.country;
        var province = req.body.province;
        var password = req.body.password;
        var isadmin = req.body.isadmin;

        var pageData = {
            name: name,
            email: email,
            phone: phone,
            postcode: postcode,
            address: address,
            country: country,
            province: province,
            password: password,
            isadmin: isadmin
        }
// saves the entered details to mongo db as order object
        var myNewUser = new User(
            pageData
        );
        myNewUser.save().then(() => console.log('New User saved'));

        res.render('admineditsuccess', { userLoggedIn: req.session.userLoggedIn });
    }
});
//Add Book
//Description:Function to Add Page
//Value:returns response value of add book, If there is an error it will put it in the err variable otherwise the page
//Parameters:user input values of request and response
myApp.get('/addbook', function (req, res) {
    res.render('addbook', { userLoggedIn: req.session.userLoggedIn });
});

//Post method for add page
myApp.post('/addbook', [
    check('bookName', 'Book Title is required!').not().isEmpty(),
    check('authorName', 'Author Name is required!').not().isEmpty(),
    check('price', 'Price is required!').not().isEmpty(),
    check('quantity', 'Quantity is required!').not().isEmpty()
],//Description:Function to add a new page
//Value:returns response value of add success page
//Parameters:user input values of request and response
function (req, res) {
    const errors = validationResult(req);
    console.log(errors);//logging this error will show us in the terminal that errors is an array and msg is what we need to print client side
    if (!errors.isEmpty()) {
        res.render('addbook', {
            errors: errors.array(), userLoggedIn: req.session.userLoggedIn
        });
    }
    else {
        var bookName = req.body.bookName;
        var description = req.body.description;
        var authorName = req.body.authorName;
        var quantity = req.body.quantity;
        var price = req.body.price;
        console.log(req.body);
        // get the name of the file
        if (req.files) {
            var imageName = req.files.image.name;
            // get the actual file (temporary file)
            var imageFile = req.files.image;
            // decide where to save it (should also check if the file exists and then rename it before saving or employ some logic to come up with unique file names)
            var imagePath = 'public/uploads/' + imageName;
            // move temp file to the correct folder (public folder)
            imageFile.mv(imagePath, function (err) {
                console.log(err);
            });
        }
        var bookId = Math.floor((Math.random() * 1000) + 1);
        var authorId = bookId*2;

        var bookData = {
            bookId:bookId,
            bookName: bookName,
            authorName:authorName,
            description: description,
            imageName: imageName,
            quantity:quantity,
            price:price
        }

        var authorData = {
            bookId:bookId,
            authorId: authorId,
            authorName:authorName
        }

        var bookSetData = {
            bookId:bookId,
            authorId: authorId,
            bookName:bookName
        }

        var myNewBook = new Book(
            bookData
        );
        var myNewAuthor = new Author(
            authorData
        );
        var myNewBookSet = new BookSet(
            bookSetData
        );
        myNewBook.save().then(() => console.log('New Book saved'));
        myNewAuthor.save().then(() => console.log('New Author saved'));
        myNewBookSet.save().then(() => console.log('New BookSet saved'));
        res.render('admineditsuccess', { userLoggedIn: req.session.userLoggedIn });
    }
});
// Get All Books
//Description:Function to fetch all Pages
//Value:returns response value of all pages, If there is an error it will put it in the err variable otherwise the page
//Parameters:user input values of request and response
myApp.get('/booklist', function (req, res) {
    // check if the user is logged in
    if (req.session.userLoggedIn) {
        console.log(req.session.userLoggedIn);
        Book.find({}).exec(function (err, books) {
            res.render('booklist', { books: books, userLoggedIn: req.session.userLoggedIn });
        });
    }
    else { // otherwise send the user to the login page
        res.redirect('/login');
    }
});
// Get page for Edit Book
//Use uniques mongodb id

myApp.get('/editbook/:bookid', function (req, res) {
    // check if the user is logged in
    if (req.session.userLoggedIn) {
        var bookid = req.params.bookid;
        console.log(bookid);
        Book.findOne({ _id: bookid }).exec(function (err, book) {
            console.log('Error: ' + err);
            console.log('Book: ' + book);
            if (book) {
                res.render('editbook', { book: book, userLoggedIn: req.session.userLoggedIn });//Render edit with the page
            }
            else {
                //This will be displayed if the user is trying to change the page id in the url
                res.send('No Book found with that id...');
            }
        });
    }
    else {
        res.redirect('/login');
    }
});

//Does the edit with post method
myApp.post('/editbook/:id', [
    check('bookName', 'Book Title is required!').not().isEmpty(),
    check('authorName', 'Author Name is required!').not().isEmpty(),
    check('price', 'Price is required!').not().isEmpty(),
    check('quantity', 'Quantity is required!').not().isEmpty()
], function (req, res) {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        var bookid = req.params.id;
        Book.findOne({ _id: bookid }).exec(function (err, book) {
            console.log('Error: ' + err);
            console.log('Book: ' + book);
            if (book) {
                res.render('editbook', { book: book, errors: errors.array() });
            }
            else {
                res.send('No book found with that id...');
            }
        });
    }
    else {
        var bookName = req.body.bookName;
        var description = req.body.description;
        var authorName = req.body.authorName;
        var quantity = req.body.quantity;
        var price = req.body.price;
        var bookId=0;
        var authorId=0;
         //fetch and save the image
         console.log(req.body);
         console.log(req.files);
         if (req.files) {
             console.log("IMAGE0");
            // get the name of the file
            var imageName = req.files.image.name;
            // get the actual file (temporary file)
            var imageFile = req.files.image;
            // decide where to save it (should also check if the file exists and then rename it before saving or employ some logic to come up with unique file names)
            var imagePath = 'public/uploads/' + imageName;
            // move temp file to the correct folder (public folder)
            imageFile.mv(imagePath, function (err) {
                console.log(err);

            });
        var id = req.params.id;
            Book.findOne({ _id: id }, function (err, book) {
                book.bookName = bookName;
                book.description = description;
                book.authorName=authorName;
                book.imageName = imageName;
                book.quantity=quantity,
                book.price=price,
                bookId=book.bookId;
                book.save();
                BookSet.findOne({ bookId: bookId }, function (err, bookSet) {
                    bookSet.bookName = bookName;
                    console.log(bookName);
                    bookSet.save();
                });
                Author.findOne({ bookId: bookId }, function (err, author) {
                    author.authorName = authorName;
                    console.log(authorName);
                    author.save();
                });
            });
        }else{
            console.log("NO IMAGE")
            var id = req.params.id;
            Book.findOne({ _id: id }, function (err, book) {
                book.bookName = bookName;
                book.description = description;
                book.authorName=authorName;
                book.quantity=quantity,
                book.price=price,
                bookId=book.bookId;
                authorId=book.authorId;
                book.save();
                BookSet.findOne({ bookId: bookId }, function (err, bookSet) {
                    bookSet.bookName = bookName;
                    bookSet.save();
                });
                Author.findOne({ bookId: bookId}, function (err, author) {
                    author.authorName = authorName;
                    author.save();
                });
            });
        } 
        res.render('admineditsuccess', { userLoggedIn: req.session.userLoggedIn });
    }
});
//Delete Book
//Use uniques mongodb id
//Description:Function to Delete Page
//Value:returns response value of delete page, If there is an error it will put it in the err variable otherwise the page
//Parameters:user input values of request along with unique page id and response
myApp.get('/deletebook/:bookid', function (req, res) {
    // check if the user is logged in
    if (req.session.userLoggedIn) {
        //delete
        var bookid = req.params.bookid;
        console.log(bookid);
        Book.findByIdAndDelete({ _id: bookid }).exec(function (err, book) {
            console.log('Error: ' + err);
            console.log('Book: ' + book);
            if (book) {
                
                res.render('delete', { message: 'Successfully deleted!', userLoggedIn: req.session.userLoggedIn });
            }
            else {
                res.render('delete', { message: 'Sorry, could not delete!', userLoggedIn: req.session.userLoggedIn });
            }
        });
    }
    else {
        res.redirect('/login');
    }
});
// Get All Books
//Description:Function to fetch all Pages
//Value:returns response value of all pages, If there is an error it will put it in the err variable otherwise the page
//Parameters:user input values of request and response
myApp.get('/orderlist', function (req, res) {
    // check if the user is logged in
    if (req.session.userLoggedIn) {
        console.log(req.session.userLoggedIn);
        Order.find({}).exec(function (err, orders) {
            res.render('orderlist', { orders: orders, userLoggedIn: req.session.userLoggedIn });
        });
    }
    else { // otherwise send the user to the login page
        res.redirect('/login');
    }
});
//Add Book
//Description:Function to Add Page
//Value:returns response value of add book, If there is an error it will put it in the err variable otherwise the page
//Parameters:user input values of request and response
myApp.get('/addorder', function (req, res) {
    res.render('addorder', { userLoggedIn: req.session.userLoggedIn });
});
//validates the fields
myApp.post('/addorder', [
    check('bookId', 'BookId is required!').notEmpty(),
    check('userId', 'UserId is required').notEmpty()
], function (req, res) {
    const errors = validationResult(req);
    console.log(errors);//logging this error will show us in the terminal that errors is an array and msg is what we need to print client side
    if (!errors.isEmpty()) {
        res.render('addorder', {
            errors: errors.array()
        });
    }
    else {
        var bookId = req.body.bookId;
        var userId = req.body.userId;
        var price = req.body.price;
        var quantity = req.body.quantity;

        var pageData = {
            bookId: bookId,
            userId: userId,
            price: price,
            quantity: quantity
        }
// saves the entered details to mongo db as order object
        var myNewOrder = new Order(
            pageData
        );
        myNewOrder.save().then(() => console.log('New Order saved'));

        res.render('admineditsuccess', { userLoggedIn: req.session.userLoggedIn });
    }
});
// Get page for Edit
//Use uniques mongodb id

myApp.get('/editorder/:orderid', function (req, res) {
    // check if the user is logged in
    if (req.session.userLoggedIn) {
        var orderid = req.params.orderid;
        console.log(orderid);
        Order.findOne({ _id: orderid }).exec(function (err, order) {
            console.log('Error: ' + err);
            console.log('User: ' + order);
            if (order) {
                res.render('editorder', { order: order, userLoggedIn: req.session.userLoggedIn });//Render edit with the page
            }
            else {
                //This will be displayed if the user is trying to change the page id in the url
                res.send('No order found with that id...');
            }
        });
    }
    else {
        res.redirect('/login');
    }
});

//Does the edit with post method
myApp.post('/editorder/:id', [
    check('bookId', 'Book Id is required!').notEmpty(),
    check('userId', 'User Id is required').notEmpty()
], function (req, res) {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        var orderid = req.params.id;
        Order.findOne({ _id: orderid }).exec(function (err, order) {
            console.log('Error: ' + err);
            console.log('Order: ' + order);
            if (order) {
                res.render('editorder', { order: order, errors: errors.array() });
            }
            else {
                res.send('No order found with that id...');
            }
        });
    }
    else {
        var bookId = req.body.bookId;
        var userId = req.body.userId;
        var price = req.body.price;
        var quantity = req.body.quantity;
        var id = req.params.id;
            Order.findOne({ _id: id }, function (err, order) {
                order.bookId = bookId;
                order.userId=userId;
                order.price=price;
                order.quantity=quantity;
                order.save();
            });
        
        res.render('admineditsuccess', { userLoggedIn: req.session.userLoggedIn });
    }
});
//Delete Order
//Use uniques mongodb id
//Description:Function to Delete Page
//Value:returns response value of delete page, If there is an error it will put it in the err variable otherwise the page
//Parameters:user input values of request along with unique page id and response
myApp.get('/deleteorder/:orderid', function (req, res) {
    // check if the user is logged in
    if (req.session.userLoggedIn) {
        //delete
        var orderid = req.params.orderid;
        console.log(orderid);
        Order.findByIdAndDelete({ _id: orderid }).exec(function (err, order) {
            console.log('Error: ' + err);
            console.log('Order: ' + order);
            if (order) {
                res.render('delete', { message: 'Successfully deleted!', userLoggedIn: req.session.userLoggedIn });
            }
            else {
                res.render('delete', { message: 'Sorry, could not delete!', userLoggedIn: req.session.userLoggedIn });
            }
        });
    }
    else {
        res.redirect('/login');
    }
});
myApp.get('/bookdetails/:bookid', function (req, res) {
    // check if the user is logged in
    if (req.session.userLoggedIn) {
        var bookid = req.params.bookid;
        console.log(bookid);
        Book.findOne({ _id: bookid }).exec(function (err, book) {
            console.log('Error: ' + err);
            console.log('Book: ' + book);
            if (book) {
                var details=book.description;
                const strippedString = details.replace(/(<([^>]+)>)/gi, ""); 
                res.render('bookdetails', { book: book,strippedString:strippedString, userLoggedIn: req.session.userLoggedIn });//Render edit with the page
            }
            else {
                //This will be displayed if the user is trying to change the page id in the url
                res.send('No Book found with that id...');
            }
        });
    }
    else {
        res.redirect('/login');
    }
});
myApp.post('/', function (req, res) {
    // check if the user is logged in
    
        var search = req.body.search;
        console.log("search");
        console.log(search);
        Book.find({ bookName: {$regex: search, $options: "$i"}}).exec(function (err, books) {
            console.log('Error: ' + err);
            console.log('Book: ' + books);
            if (books.length>0) {
                res.render('form', { books: books, userLoggedIn: req.session.userLoggedIn });//Render edit with the page
            }
            else{
                Author.findOne({ authorName: {$regex: search, $options: "$i"}}).exec(function (err, authors) {
                    console.log('authors: ' + authors);
                    if(authors){
                    Book.find({ bookId: authors.bookId }).exec(function (err, books) {
                    console.log('Error: ' + err);
                    console.log('User: ' + books);
                    if (books) {
                        res.render('form', { books: books, userLoggedIn: req.session.userLoggedIn });//Render edit with the page
                    }
                    else {
                                            //This will be displayed if the user is trying to change the page id in the url
                                            res.send('No Book found...');
                    }
                });
                                
            }else{
                res.render('nosearch', { message: 'Sorry, No Book Found', userLoggedIn: req.session.userLoggedIn });
            }
        });
            }
        });      
});
myApp.get('/editcart/:bookid', function (req, res) {
    // check if the user is logged in
    if (req.session.userLoggedIn) {
        var bookid = req.params.bookid;
        console.log(bookid);
        Book.findOne({ _id: bookid }).exec(function (err, book) {
            console.log('Error: ' + err);
            console.log('User: ' + book);
            if (book) {
                res.render('cart', { book: book, userLoggedIn: req.session.userLoggedIn });//Render edit with the page
            }
            else {
                //This will be displayed if the user is trying to change the page id in the url
                res.send('No Book found with that id...');
            }
        });
    }
    else {
        res.redirect('/login');
    }
});

myApp.post('/editcart/:bookid', function (req, res) {
    // check if the user is logged in
    if (req.session.userLoggedIn) {
        var bookId = req.params.bookid;
        var quantity = req.body.numberCol;
        Book.findOne({ _id: bookId }).exec(function (err, book) {
            console.log('Error: ' + err);
            console.log('User: ' + book);
            if (book) {
                var price=book.price*quantity;
                var pageData = {
                    bookId: bookId,
                    bookName: book.bookName,
                    userId: req.session.username,
                    price: price.toFixed(2),
                    quantity: quantity
                }
        // saves the entered details to mongo db as order object
                var myNewCart = new Cart(
                    pageData
                );
                myNewCart.save().then(() => console.log('New Cart saved'));
                res.render('cartsuccess', { userLoggedIn: req.session.userLoggedIn });
            }
            else {
                //This will be displayed if the user is trying to change the page id in the url
                res.send('No Book found with that id...');
            }
        });
    }
    else {
        res.redirect('/login');
    }
});
// Get All Cart
//Description:Function to fetch all Pages
//Value:returns response value of all pages, If there is an error it will put it in the err variable otherwise the page
//Parameters:user input values of request and response
myApp.get('/viewcart', function (req, res) {
    // check if the user is logged in
    if (req.session.userLoggedIn) {
        console.log(req.session.userLoggedIn);
        Cart.find({}).exec(function (err, carts) {
            if(carts.length>0){
                var total_count=0;
                var total=0;
                for (let i = 0; i < carts.length; i++) {
                    var price= carts[i].price;
                    total_count+=parseFloat(price);
                    }
                    total=total_count.toFixed(2);
                    console.log(total_count);
               res.render('showcart', { carts: carts,total:total, userLoggedIn: req.session.userLoggedIn }); 
            }else{
                res.render('cartempty', {userLoggedIn: req.session.userLoggedIn });
            }
            
        });
    }
    else { // otherwise send the user to the login page
        res.redirect('/login');
    }
});
//Delete User
//Use uniques mongodb id
//Description:Function to Delete Page
//Value:returns response value of delete page, If there is an error it will put it in the err variable otherwise the page
//Parameters:user input values of request along with unique page id and response
myApp.get('/deletecart/:cartid', function (req, res) {
    // check if the user is logged in
    if (req.session.userLoggedIn) {
        //delete
        var cartid = req.params.cartid;
        console.log(cartid);
        Cart.findByIdAndDelete({ _id: cartid }).exec(function (err, cart) {
            console.log('Error: ' + err);
            console.log('Order: ' + cart);
            if (cart) {
               res.redirect('/viewcart');
            }
            else {
                res.render('delete', { message: 'Sorry, could not delete!', userLoggedIn: req.session.userLoggedIn });
            }
        });
    }
    else {
        res.redirect('/login');
    }
});
// Get All Payment
//Description:Function to fetch all Pages
//Value:returns response value of all pages, If there is an error it will put it in the err variable otherwise the page
//Parameters:user input values of request and response
myApp.get('/payment', function (req, res) {
    // check if the user is logged in
    if (req.session.userLoggedIn) {
        console.log(req.session.userLoggedIn);
        Cart.find({}).exec(function (err, carts) {
            if(carts){
                var total_count=0;
                var total=0;
                for (let i = 0; i < carts.length; i++) {
                    var price= carts[i].price;
                    total_count+=parseFloat(price);
                    }
                    total=total_count.toFixed(2);
            User.findOne({ _id: req.session.username }).exec(function (err, user) {
                res.render('payment', { user: user,total:total, userLoggedIn: req.session.userLoggedIn }); 
            });
               
            }else{
                res.render('cartempty', {userLoggedIn: req.session.userLoggedIn });
            }
            
        });
    }
    else { // otherwise send the user to the login page
        res.redirect('/login');
    }
});
myApp.post('/payment', [
    check('name', 'Name is required!').notEmpty(),
    check('email', 'Email is required').isEmail(),
    check('address', 'Address is required!').notEmpty(),
    check('phone', '').custom(customPhoneValidation), //custom validation for phone number
    check('creditcard', '').custom(customCardValidation),
    check('expmonth', '').custom(customMonthValidation),
    check('expyear', '').custom(customYearValidation),
], function (req, res) {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        var userid = req.session.username;
        var total=0;
        Cart.find({}).exec(function (err, carts) {
            if(carts){
                var total_count=0;
                for (let i = 0; i < carts.length; i++) {
                    var price= carts[i].price;
                    total_count+=parseFloat(price);
                    }
                    total=total_count.toFixed(2);
                }
                });
        User.findOne({ _id: userid }).exec(function (err, user) {
            console.log('Error: ' + err);
            console.log('User: ' + user);
            if (user) {
                res.render('payment', { user: user,total:total,errors: errors.array() });
            }
            else {
                res.send('No user found with that id...');
            }
        });
    }
    else {
        var total=0;
        Cart.find({}).exec(function (err, carts) {
            if(carts){
                for (let i = 0; i < carts.length; i++) {

                   // var bookId = 
                   console.log(carts[i].bookId);
                   console.log(carts[i].userId);
                   console.log(carts[i].quantity);
                    //var userId = carts[i].userId;
                    //var price = carts[i].price;
                    //var quantity = carts[i].quantity;

                    var pageData = {
                        bookId: carts[i].bookId,
                        userId: carts[i].userId,
                        price: carts[i].price,
                        quantity: carts[i].quantity
                    }
            // saves the entered details to mongo db as order object
                    var myNewOrder = new Order(
                        pageData
                    );
                    myNewOrder.save().then(() => console.log('New Order saved'));
                    Cart.findByIdAndDelete({ _id: carts[i]._id }).exec(function (err, cart) {

                    });
                    //reduce the quantity after order confirmed
                    Book.findOne({ _id: carts[i].bookId }, function (err, book) {
                        if(book){
                            book.quantity-=carts[i].quantity,
                            book.save();
                        }
                    });
                    
                }
            }
        });
        
        res.render('ordersuccess', { userLoggedIn: req.session.userLoggedIn });
    }
});

//to validate if the card is expired
function validateCardExpired(expYear, expMonth) {
    if (expYear != '' && expMonth != '') {
        var monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        //to get the index of user entered expiry month
        var index = monthNames.indexOf(expMonth.toUpperCase());
        if (index != -1) { //if a valid month
            //to get the current month and year for card exipry validation
            var today = new Date();
            var someday = new Date();
            someday.setFullYear(expYear, index, 1); //date of user entered expiry month and year

            if (someday < today) {
                formErrors += `Your card is expired.Enter valid date. <br>`;

            }
        } else { // if the month entered is not valid
            formErrors += `Please enter a valid card expiration date.<br>`;
        }
    }
}




// start the server and listen at a port
myApp.listen(8080);

//tell everything was ok
console.log('Everything executed fine.. website at port 8080....');