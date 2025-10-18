const Listing = require ("../models/listing.js")
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken});

module.exports.index = async (req , res)=>{
  const allListings = await Listing.find({});
  console.log("ALL DATDA ",allListings);
  
  res.render("listings/index.ejs", {allListings});
};

module.exports.renderNewForm = (req , res)=>{
    res.render("listings/new.ejs");
};

module.exports.showListing =(async (req , res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id)
    .populate({
        path:"reviews",
        populate:{
        path: "author",
    }
        
    })
    .populate("owner");
    if (!listing) {
        req.flash("success", "Listing you requested does not exist !");
        return res.redirect("/listings");  
    }
    console.log(listing);
    return res.render("listings/show.ejs", { listing }); 
});

// module.exports.createListing = (async (req, res, next)=>{
//     console.log("Location input:", req.body.listing.location);
//      let response = await geocodingClient.forwardGeocode({
//      query: req.body.listing.location,
//      limit: 1
//    })
//      .send();

//      let url = req.file.path;
//      let filename = req.file.filename;

//      const newListing = new Listing (req.body.listing);
//      newListing.owner = req.user._id;
//      newListing.image = {url,filename};
     
//      newListing.geometry = response.body.features[0].geometry;

//      let savedListing = await newListing.save();
//      console.log(savedListing);

//      req.flash("success","New Listing created")
//      res.redirect("/listings");
// });

module.exports.createListing = async (req, res, next) => {
  try {
    console.log("Location input:", req.body.listing.location);
    console.log("Mapbox token:", process.env.MAP_TOKEN);

    const geoResponse = await geocodingClient.forwardGeocode({
      query: req.body.listing.location,
      limit: 1
    }).send();

    console.log("Mapbox response:", geoResponse.body);

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = {
      url: req.file.path,
      filename: req.file.filename
    };
    newListing.geometry = geoResponse.body.features[0].geometry;

    await newListing.save();
    req.flash("success", "New Listing created");
    res.redirect("/listings");
  } catch (err) {
    console.log("🔥 ERROR CAUGHT 🔥");
    console.log("Error name:", err.name);
    console.log("Error message:", err.message);
    console.log("Error stack:", err.stack);
    req.flash("error", "Mapbox error: " + err.message);
    res.redirect("/listings/new");
  }
};

module.exports.renderEditForm = (async (req , res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("success", "Listing you requested does not exist !");
        return res.redirect("/listings"); 
    }
    let orignalImageUrl = listing.image.url;
    orignalImageUrl = orignalImageUrl.replace("/upload","/upload/w_250")
    res.render("listings/edit.ejs", { listing,orignalImageUrl});
});


module.exports.updateListing= (async(req , res)=>{
    let{id} = req.params;
     let listing =await Listing.findByIdAndUpdate(id, {...req.body.listing});
     if( typeof req.file !== "undefined"){
     let url = req.file.path;
     let filename = req.file.filename;
     listing.image = {url,filename}
     await listing.save();
     }

     req.flash("success","Listing Updated")
     return res.redirect(`/listings/${id}`);
});


module.exports.destroyListing = (async(req , res)=>{
    let {id}= req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success","Listing is Deleted")
    res.redirect("/listings");
})
