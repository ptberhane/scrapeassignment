var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var Comment = require("./models/Comment.js");
var Article = require("./models/Article.js");
var request = require("request");
var cheerio = require("cheerio");
var exphbs = require("express-handlebars");
mongoose.Promise = Promise;


var app = express();
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

// Make public a static dir
app.use(express.static("public"));

// Database configuration with mongoose
mongoose.connect("mongodb://localhost/week18scrapeassignment");
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});


// Routes
// ======

// A GET request to scrape the echojs website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  request("http://allafrica.com/list/group/main/main/cat/petroleum.html", function(error, response, html) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(html);
    // Now, we grab every h2 within an article tag, and do the following:
    $("div.top-story").each(function(i, element) {

      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this).children("h2").text();
      result.link = $(this).children("h2").attr("href");

      var entry = new Article(result);


   

      entry.save(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        // Or log the doc
        else {
          console.log(doc);
        }
      });

    });
  });

  res.send("Scrape Complete");
});

app.get("/articles", function(req, res) {
    Article.find({}, function(error,doc){
      if(error){
        console.log(error);
      }
      else {
        res.json(doc);
      }


       });

});

   /* .populate("articles")
    .exec(function(error,doc){
      if(error){
        res.send(error);
      }
      else{
        res.send(doc);
      }*/
 

app.get("/articles/:id", function(req, res) {

    Article.findOne({ "_id":req.params.id})
    .populate("comments")
    .exec(function(error,doc){
      if(error){
        res.send(error);
      }
      else{
        res.send(doc);
      }
    });


});

app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  var newComment = new Note(req.body);

  // And save the new note the db
  newComment.save(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      // Use the article id to find and update it's note
      Article.findOneAndUpdate({ "_id": req.params.id }, { "comment": doc._id })
      // Execute the above query
      .exec(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        else {
          // Or send the document to the browser
          res.send(doc);
        }
      });
    }
  });
});




app.listen(3000, function() {
  console.log("App running on port 3000!");
});
