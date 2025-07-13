const express= require("express");
const app= express();
const mongoose = require('mongoose');
const Listing= require("./models/listing.js");
const path=require("path");
const methodOverride = require("method-override");
const ejsMate =require("ejs-mate");
const wrapAsync= require("./utils/wrapAsync.js");
const ExpressError= require("./utils/ExpressError.js");
const {listingSchema}= require("./schema.js");

main()
.then(()=>{
    console.log("welcome to wanderlust");
})
.catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
}

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,'public')))

app.get("/",(req,res)=>{
    res.send("system is working");
});

const validateListing = (req,res,next)=>{
      const {error}= listingSchema.validate(req.body);
        if(error){
            const errMsg= error.details.map(el => el.message).join(', ');
            throw new ExpressError (400,errMsg);
        }else{
            next();
        }
};

//index route
app.get("/listings",wrapAsync(async(req,res)=>{
    const allListings= await Listing.find({});
    res.render("listings/index.ejs",{ allListings });
}));

//new route
app.get("/listings/new",wrapAsync(async(req,res)=>{
    res.render("listings/new.ejs");
}));

//show route
app.get("/listings/:id",wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("show.ejs", { listing }); // Make sure the view name matches and object is passed
}));

//crete route

app.post(
    "/listings",validateListing,
    wrapAsync(async(req,res,next) =>{
    const newListing= new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");

}));

//edit route
app.get("/listings/:id/edit",wrapAsync(async(req,res)=>{
    let result= listingSchema.validate(req.body);
    console.log(result);
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("edit.ejs",{ listing });
    // console.log("edit.ejs")
}));

//update route
app.put("/listings/:id",validateListing, wrapAsync(async( req,res ) => {
    let {id} = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect(`/listings/${id}`) ;  
}));

//DELETE 
app.delete("/listings/:id",wrapAsync(async (req,res)=>{
    let {id}=req.params;
    let deletedListing= await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
}));

// listing rout
// app.get("/testListing",async(req,res)=>{
//     let samplelisting= new Listing({
//         title: "My home",
//         description: "Near the Beach",
//         price:5000,
//         location:"indore,(M.P.)",
//         country:"india"
//     });
//     await samplelisting.save();
//     console.log("sample was saved");
//     res.send('successful testing');
// });

app.all("/*a",(req,res,next)=>{
    next(new ExpressError(404,"Page not found"));
});

app.use((err,req,res,next)=>{
    let {statusCode=500, message="something went wrong"}=err;
    // res.status(statusCode).send(message);
    res.status(statusCode).render("error.ejs",{err});
});

app.listen(8080,()=>{
    console.log("port is listening on 8080");
})