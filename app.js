if(process.env.NODE_ENV !="production"){
    require('dotenv').config()
}

const express=require("express");
const app=express();
const mongoose=require("mongoose");
const Notice=require("./models/notice.js");
const path=require("path");
const methodOverride=require("method-override");
const wrapAsync=require("./utils/wrapAsync.js");
const ExpressError=require("./utils/ExpressError.js");
const session=require("express-session");
const MongoStore = require('connect-mongo');

const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");

const dbUrl=process.env.ATLASDB_URL;

main()
.then(()=>{
    console.log("Connected to DB");
}).catch((err)=>{
    console.log(err);
});

async function main(){
    await mongoose.connect(dbUrl);
}



app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname,"/public")));

//connect-mongo store
const store=MongoStore.create({
    mongoUrl:dbUrl,
    crypto: {
        secret:process.env.SECRET,
      },
      touchAfter:24*3600,
});

store.on("error",()=>{
    console.log("mongo-store session error",err);
});

//session
const sessionOptions={
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now()+7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly:true,
    },
};



app.use(session(sessionOptions));
app.use(flash());


app.use(passport.initialize());                           //passport middleware always after session middleware.
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




app.use((req,res,next)=>{
    res.locals.success=req.flash("success");        //middleware for flash
    res.locals.error=req.flash("error");
    res.locals.currUser=req.user;
    next();
});


//Root route(signup,login page)
app.get("/welcome",(req,res)=>{
    res.render("notices/root.ejs");
});



//Index route
app.get('/notices', wrapAsync (async (req, res) => {
   
        const notices = await Notice.find().sort({ date: -1 }); 
        res.render('notices/index', { notices: notices });
    
}));



//New route
app.get("/notices/new",(req,res)=>{
    if(!req.isAuthenticated()){
        req.flash("error","You must be logged-in to add Notice!");
         return res.redirect("/login");

    }
    res.render("notices/new.ejs");
});

//Create route
app.post('/notices', wrapAsync (async (req, res,next) => {
    const { title, content, submittedBy } = req.body;
    const notice = new Notice({
        title,
        content,
        submittedBy
    });
    
        const newNotice = await notice.save();
        req.flash("success","New Notice Created!");
        res.redirect("/notices");
   
        
}));


//show Route
app.get("/notices/:id", wrapAsync (async(req,res)=>{
    let {id}=req.params;
    const notice= await Notice.findById(id);
    if(!req.isAuthenticated()){
        req.flash("error","You must be logged-in to view Notice!");
         return res.redirect("/login");
    }
    res.render("notices/show.ejs",{notice});
}));


//Edit route
app.get("/notices/:id/edit", wrapAsync (async (req,res)=>{
    let {id}=req.params;
    const notice= await Notice.findById(id);
    res.render("notices/edit.ejs",{notice});
}));


//update route
app.put('/notices/:id', wrapAsync (async (req, res) => {
    const notice = await Notice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.redirect('/notices');
}));


//Delete Route
app.delete("/notices/:id", wrapAsync (async(req,res)=>{
    let {id}=req.params;
    const deletednotice= await Notice.findByIdAndDelete(id);
    console.log(deletednotice);
    req.flash("success"," Notice Deleted!");
    res.redirect("/notices");
}));


// SIGNUP ROUTE
app.get("/signup",(req,res)=>{
    res.render("users/signup.ejs");
});

app.post("/signup",wrapAsync(async (req,res)=>{
    try{
        let {username,email,course,password}=req.body;
    const newUser=new User({email,username,course});
    const registeredUser= await User.register(newUser,password);
    console.log(registeredUser);
    req.login(registeredUser,(err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","User Registered succesfully!");
        res.redirect("/notices");
    });
    
    } catch(error){
        res.send(error.message);
    }
    
}));



//LOGIN ROUTE
app.get("/login",(req,res)=>{
    res.render("users/login.ejs");
});

app.post("/login",passport.authenticate('local', { failureRedirect: '/login',failureFlash:true }),async(req,res)=>{
    req.flash("success","Welcome back! You are Logged-in!");
    res.redirect("/notices");
    
});



//LOGOUT Route
app.get("/logout",(req,res)=>{
    req.logout((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","You are logged out!");
        res.redirect("/notices");
    });
});






app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page not found"));
});



app.use((err,req,res,next)=>{
    let {statusCode=500,message="Something went wrong"}=err;
    res.render("error.ejs",{message});
    // res.status(statusCode).send(message);
});




app.listen(8080,()=>{
    console.log("Server is listening to port 8080");
});