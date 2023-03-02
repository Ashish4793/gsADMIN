//jshint esversion:6
require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");
const MongoStore = require('connect-mongo')(session);
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set("view engine" , "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('trust proxy', 1);

app.use(session({
    resave : false,
    saveUninitialized : false,
    secret : process.env.PASSPORT_KEY,
    store: new MongoStore({ mongooseConnection: mongoose.connection })
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.set("strictQuery" ,false);
const connectDB = async () => {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
  
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
};

const adminSchema = new mongoose.Schema({
    username : {type:String, unique:true},
    name : String,
    employeePhnNo : {type:String, unique:true},
    password : String
});
adminSchema.plugin(passportLocalMongoose);

const gameListSchema = new mongoose.Schema({
    gameName : {type : String, unique : true},
    gamePrice : String,
    gameCover : String
});

const orderSchema = new mongoose.Schema({
    orderBy : String,
    orderID : {type : String , unique : true},
    amount : String,
    status : String,
});

const Admin = mongoose.model("Admin" , adminSchema);
const GameList = mongoose.model("GameList" , gameListSchema);
const Order = mongoose.model("Order" , orderSchema);

passport.use(Admin.createStrategy());
passport.serializeUser(Admin.serializeUser());
passport.deserializeUser(Admin.deserializeUser());


app.get("/register" , function(req,res){
    res.render("register");
});


app.post("/register" , function(req,res){
    var rndomNo = Math.floor(10000 + Math.random() * 9000).toString();
    Admin.register({username : rndomNo , name : req.body.name , employeePhnNo : req.body.phone} , req.body.password , function(err,user){
        if (err){
            res.render("regfail");
        } else {
            res.render("regsuccess" , {employeeID : rndomNo});
        }
    });
});

app.get("/login" , function(req,res){
    res.render("login");
});

app.get("/badcred" , function(req,res){
    res.render("badcred");
});

app.post("/login", passport.authenticate("local",{
    successRedirect: "/",
    failureRedirect: "/badcred"
  }), function(req, res){
});

app.get("/logout" , function(req,res){
    if (req.isAuthenticated()){
        req.logout(function(err){});
        res.render("loggedout");
    } else {
        res.redirect("/login");
    }
});

app.get("/" , function(req,res){
    if (req.isAuthenticated()){
        res.render("addgame");
    } else {
        res.redirect("/login");
    }
});

app.post("/addgame" , function(req,res){
    if (req.isAuthenticated()){
        const newGame = new GameList({
            gameName : req.body.title,
            gamePrice : req.body.price,
            gameCover : req.body.coverlink
        });
    
        newGame.save(function(err){
            if(err){
                res.render("agfailure");
            } else {
                res.render("agsuccess");
                console.log("Game Added");
            }
        });
    } else {
        res.redirect("/login");
    }

});


app.get("/delgame" , function(req,res){
    if (req.isAuthenticated()){
        GameList.find({} , function(err , foundGames){
            if (!err){
                res.render("delgame" , {foundGames : foundGames});
            } else {
                console.log(err);
            }
        });
    } else {
        res.redirect("/login")
    } 
});

app.post("/delgame" , function(req,res){
    if (req.isAuthenticated()){
        GameList.findOneAndDelete({gameName : req.body.title} , function(err){
            if (err){
                console.log(err);
            } else {
                console.log("game deleted!");
            }
        });
    } else {
        res.redirect("/login")
    }
});


app.get("/orders" , function(req,res){
    if (req.isAuthenticated()){
        Order.find({} , function(err , foundOrder){
            if (!err){
                res.render("orders" , {foundOrder : foundOrder});
            } else {
                console.log(err);
            }
        });
    } else {
        res.redirect("/login")
    }
});

app.get("/account" , function(req,res){
    if (req.isAuthenticated()){
        Admin.findOne({username : req.user.username} , function(err,foundAdmin){
            if (!err){
                res.render("account" , {foundAdmin : foundAdmin});
            } else {
                res.render(err);
            }
        })
    } else {
        res.redirect("/login");
    }
});

app.get("/updategame" , function(req,res){
    if (req.isAuthenticated()){
        GameList.find({} , function(err , foundGames){
            if (!err){
                res.render("updategame" , {foundGames : foundGames});
            } else {
                console.log(err);
            }
        });
    } else {
        res.redirect("/login")
    }
});

app.post("/updategame" , function(req,res){
    if (req.isAuthenticated()){
        GameList.findOne({gameName : req.body.title} , function(err , foundGame){
            if (!err){
                res.render("fupdategame" , {foundGame : foundGame});
            } else {
                console.log(err);
            }
        });
    } else {
        res.redirect("/login")
    }
});

app.post("/fupdategame" , function(req,res){
    if (req.isAuthenticated()){
        GameList.findOneAndUpdate({gameName : req.body.updateID} , {gameName : req.body.title , gamePrice : req.body.price , gameCover : req.body.coverlink} , function(err){
            if (!err){
                res.render("ugsuccess");
            } else {
                console.log(err);
            }
        });
    } else {
        res.redirect("/login")
    }
});

app.get("/viewall" , function(req,res){
    if (req.isAuthenticated()){
        GameList.find({}, function(err , foundGames){
            if (err){
                console.log(err);
            } else {
                res.render("viewall" , {foundGames : foundGames});
            }
        });
    } else {
        res.redirect("/login")
    }
});

app.get("/delorder" , function(req,res){
    if (req.isAuthenticated()){
        Order.find({} , function(err, foundOrders){
            if (!err){
                res.render("delorder" , {foundOrders : foundOrders});
            } else {
                console.log(err);
            }
        });
    } else {
        res.redirect("/login")
    }
});

app.post("/delorder" , function(req,res){
    if (req.isAuthenticated()){
        Order.findOneAndDelete({orderID : req.body.orderID} , function(err){
            if (!err){
                console.log("Deleted Order");
            } else {
                console.log(err);
            }
        });
    } else {
        res.redirect("/login")
    }
});

connectDB().then(() => {
    console.log("DB CONNETED SUCCESFULLY");
    app.listen(3000, () => {
        console.log("Server STARTED");
    })
});