require("dotenv").config();

const bodyParser = require("body-parser");
const express = require("express");
const bcrypt = require("bcrypt");
const path = require('path');
const app = express();
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const { config } = require("process");
const http = require("http").createServer(app);
const saltRounds = 10;
const io = require("socket.io")(http);
const cors = require("cors");

const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

app.use("*/css", express.static("public/css"));
app.use("*/images", express.static("public/images"));
app.use("*/js", express.static("public/js"));
app.set('views', path.join(__dirname, 'views'));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(
  process.env.MONGO_URL,
);

const studentSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
  secret: String,
});
const adminSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
  secret: String,
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
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});
app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("course");
    }
  });
});

app.get("/forgotpassword", function (req, res) {
  res.render("forgotpassword", { message: "hii" });
});

app.get("/community", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("community");
  } else {
    res.redirect("/login");
  }
});

app.post("/register", async function (req, res) {
  // check if email username and password is valid

  if(isEmail(req.body.email)) {
    return res.render("login", {message: "Invalid Email"});
  }

  const student = await Student.findOne({ email: req.body.username });
  if(student){
    return res.render("login", {message: "Email already registered"});
  }

  if(req.body.password.length < 8){
    return res.render("login", {message: "Password must be atleast 8 characters long"});
  }

  const generateSecret = Math.floor(Math.random() * 1000000) + 1;

  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    const newStudent = new Student({
      email: req.body.username,
      username: req.body.personName,
      password: hash,
      secret: generateSecret,
    });
    newStudent.save(function (err) {
      if (err) {
        console.log(err);
      } else {
        res.render("login", {message: "Registered Successfully! Your secret code is " + generateSecret + ""});
      }
    });
  });
});

app.post('/forgotpassword', async function(req, res) {
  const {email, secret, password} = req.body;
  console.log(email, secret, password);
  // return res.render("login", {message: "Email not registered!"});
  const student = await Student.findOne({email: email});
  if(!student){
    return res.render("forgotpassword", {message: "Email not registered!"});
  }

  if(student.secret === secret){
    bcrypt.hash(password, saltRounds, function (err, hash) {
      student.password = hash;
      student.save(function (err) {
        if (err) {
          console.log(err);
        } else {
          res.render("login", {message: "Password changed successfully!"});
        }
      });
    });
  } else {
    res.render("forgotpassword", {message: "Secret code is incorrect!"});
  }
});


app.post("/login", async function (req, res) {
  var username = req.body.username;
  var password = req.body.password;

  const student = await Student.findOne({ email: username });
  if (student) {
    bcrypt.compare(password, student.password, function (err, result) {
      if (result === true) {
        let joinMessage = student.username + " has joined the chat.";
        handleBotMessages(joinMessage);
        return res.render("community", { yourName: student.username });
      }
    });
  } else {
    res.redirect("/login");
  }
});
app.post("/adminLogin", function (req, res) {
  username = req.body.username;
  password = md5(req.body.password);
  console.log(password);

  Admin.findOne({ email: username }, function (err, foundAdmin) {
    if (err) {
      console.log(err);
    } else {
      if (foundAdmin) {
        if (foundAdmin) {
          if (foundAdmin.password === password) {
            res.render("community", { yourName: foundAdmin.name });
          }
        }
      }
    }
  });
});


io.on("connection", (socket) => {
  console.log("Connected...");
  socket.on("message", (msg) => {
    socket.broadcast.emit("message", msg);
  });
});

const handleBotMessages = (message) => {
  let msg1 = {
    user: "Bot",
    message: message,
  };
  io.emit("message", msg1);
};

const isEmail = (email) => {
  var re = /\S+@\S+\.\S+/;
  return re.test(email);
}
