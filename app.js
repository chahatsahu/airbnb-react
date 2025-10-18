if(process.env.NODE_ENV !="production"){
  require('dotenv').config();
}


const express = require('express');
const app = express();
const mongoose = require("mongoose");
const path = require ("path");
const dbUrl = process.env.ATLASDB_URL;
const methodOverride = require ("method-override");
const ejsMate = require ("ejs-mate");
const ExpressError = require ("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const Localstrategy = require("passport-local");
const user = require("./models/user.js")

const listingsRouter = require("./routes/listing.js")
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");


const cookie = require('express-session/session/cookie.js');

main()
.then(()=>{
    console.log("connected to DB")
})
.catch((err)=>{
    console.log(err)
})
async function main (){
    await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set ("views",path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}))
app.use (methodOverride("_method"));
app.engine('ejs' , ejsMate);
app.set("layout", "layouts/boilerplate");
app.use (express.static(path.join(__dirname, "/public")));


const store = MongoStore.create({
    mongoUrl:dbUrl,
    crypto:{
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
})
store.on("error",()=>{
   console.log ("error in MOngo session store", err1);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie:{
        expires:Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

// app.get ("/",(req,res)=>{
//     res.send("hi, i am root");
// });


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new Localstrategy(user.authenticate()));

passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());

app.use((req, res, next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
})


//demo route
// app.get("/demouser",async (req, res)=>{
//   let fakeUser = new user({
//    email: "chahat@gamil.com",
//    username:"delta-student"
//   });
//   let registeredUser = await user.register(fakeUser,"helloworld");
//   res.send(registeredUser);
// })




app.use("/listings",listingsRouter)
app.use("/listings/:id/reviews",reviewsRouter);
app.use("/",userRouter);


app.all(/.*/,(req, res, next)=>{
    next(new ExpressError(404,"page not found"));
});

app.use((err, req, res, next)=>{
    let {statusCode=500, message="something went wrong !"} = err;
    res.status(statusCode).render("error.ejs",{message});
    // res.status(statusCode).send(message);
});

app.listen(8080, ()=>{
    console.log("server is listenin to port 8080");
});