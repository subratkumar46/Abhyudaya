
const bodyParser = require("body-parser");
const express = require("express");
const bcrypt = require("bcrypt");
const app = express();
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const http = require('http').createServer(app)
const saltRounds=10;


const PORT = process.env.PORT || 3000

http.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})




app.use('*/css', express.static('public/css'));
app.use('*/images', express.static('public/images'));
app.use('*/js', express.static('public/js'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/abhyudayaDB");

const studentSchema = new mongoose.Schema({
    username:String,
    email: String,
    password: String,
    secret:String
});
const adminSchema = new mongoose.Schema({
    username:String,
    email: String,
    password: String,
    secret:String
});

studentSchema.plugin(passportLocalMongoose);

const Student = new mongoose.model("Student", studentSchema);
const Admin = new mongoose.model("Admin", adminSchema);

passport.use(Student.createStrategy());
passport.serializeUser(Student.serializeUser());
passport.deserializeUser(Student.deserializeUser());

app.get("/", function (req, res) {
    res.render("index");
});
app.get("/about", function (req, res) {
    res.render("about");
});
app.get("/login", function (req, res) {
    res.render("login");
});
app.get("/course", function (req, res) {
    res.render("course");
});
app.get("/class7", function (req, res) {
    res.render("class7th");
});
app.get("/class6", function (req, res) {
    res.render("class6th");
});
app.get("/register", function (req, res) {
    res.render("login");
});
app.get("/contact", function (req, res) {
    res.render("contact");
});
app.get("/loginAsAdmin", function (req, res) {
    res.render("adminLogin");
});
app.get("/submit", function (req, res) {
    if (req.isAuthenticated()){
        res.render("submit");
      } else {
        res.redirect("/login");
      }
});
app.get("/logout", function (req, res) {
    req.logout(function(err){
        if(err){
            console.log(err);
        }else{
            res.redirect("course");
        }
        
    });
});
app.get("/community", function (req, res) {
    if (req.isAuthenticated()){
        res.render("community");
      } else {
        res.redirect("/login");
      }
    
});


app.post("/register", function (req, res) {


    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        
        const newStudent = new Student({
            email: req.body.username,
            username: req.body.personName,
            password: hash
        });
        // console.log(req.body.username);
        // console.log(req.body.personName);
        // console.log(hash);
        newStudent.save(function (err) {
            if (err) {
               
                console.log(err);
            } else {
                res.render("login");
            }
        });
    });

});
app.post("/login", function (req, res) {

    var username = req.body.username;
    var password = req.body.password;
    

    Student.findOne({ email: username }, function (err, foundStudent) {
        if (err) {
            console.log(err);
        } else {
            if (foundStudent) {
                bcrypt.compare(password, foundStudent.password, function (err, result) {
                    if (result === true) {
                        console.log(foundStudent.name);
                        res.render("community",{yourName:foundStudent.username});
                    }
                });
            }
        }
    });
});
app.post("/adminLogin", function (req, res) {

    username = req.body.username;
    password = md5(req.body.password);
    console.log(password);
   

    Admin.findOne({ email: username }, function (err, foundAdmin) {
        if(err){
            console.log(err);
        } else {
            if(foundAdmin){
                if(foundAdmin){
                    if(foundAdmin.password===password){
                        res.render("community",{yourName:foundAdmin.name});
                    }
                }
            }
        }
    });
});

const io = require('socket.io')(http)

io.on('connection', (socket) => {
    console.log('Connected...')
    socket.on('message', (msg) => {
        socket.broadcast.emit('message', msg)
    })

})

