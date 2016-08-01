var express = require('express');
var casedict = require('./public/js/casedict.json');
var mongoose = require('mongoose');

// SEARCH FUNCTION

var app = express();
app.use(express.static(__dirname + "/public"));

app.get('/nodesearch', function (req, res) {
  console.log("STARTING SEARCH: " + JSON.stringify(req.query));
  // get query string
  var searchJSON = req.query;
  var q = searchJSON["query"];
  // use find function
  var CaseCollection = mongoose.model('casedict');
  var r = new RegExp(q,'i');
  CaseCollection.find({name: {$regex:r}},function(err, cases){
    var respstr = 'callbackDisplay({"results":';
    var resparr = [];
    for (var i = 0; i < cases.length; i++) {
      var caseRes = cases[i];
      if (i == 0) {
        resparr.push(caseRes.name);
      }
      var link = caseRes.link;
      resparr.push(link);
    }
    respstr += JSON.stringify(resparr);
    respstr += "});";
    res.send(respstr);
    //console.log("ENDING SEARCH: " + respstr);
  });
});


// INITIALIZE DATABASE

mongoose.connect('mongodb://lawmaryruler:hotpics9@ds139715.mlab.com:39715/lawmary');
var db = mongoose.connection;
db.on( 'error', console.error.bind( console, 'connection error:' ) );

// once the connection is established we define our schemas
db.once( 'open', function callback() {

    // independent schema
    var CaseSchema = new Schema( {
        name: String,
        link: String,
        tags: [String],
        visited: Number,
        examMode: [Number]
    });

    // create Mongoose models from our schemas
    var CaseCollection = mongoose.model('casedict', CaseSchema);

});

// CREATE
app.post('/casedict', function(req, res) {
  var CaseCollection = mongoose.model('casedict');
  // Create a new instance 
  var newCase = new CaseCollection();

  // Set the properties that came from the POST data
  newCase.name = req.body.name;
  newCase.link = req.body.link;
  newCase.tags = req.body.tags;
  newCase.visited = req.body.visited;
  newCase.examMode = req.body.examMode;

  // Save the beer and check for errors
  newCase.save(function(err) {
  if (err) res.send(err);
  });
});

// READ
app.get('/casedict', function(req, res) {
  var CaseCollection = mongoose.model('casedict');
  CaseCollection.find({link: req.body.link}, function(err, caseRes){
    if (err) return res.send(err); 
    res.send(caseRes.examMode);
  });
});

// UPDATE
app.put('/casedict', function(req, res) {
  var CaseCollection = mongoose.model('casedict');
  CaseCollection.find({link: req.body.link}, function(err, caseRes){
    if (err) return res.send(err);
    else {
      caseRes.visited += 1;
      if (caseRes.examMode.length == 0) {
          caseRes.examMode = new Array(req.body.senLength);
      }
      for (i=0; i<caseRes.examMode.length; i++) {
          if(req.body.examMode[i] == true) {
            if (caseRes.examMode[i] == null) caseRes.examMode = 0;
            else caseRes.examMode += 1;
          } 
      }
    }
    caseRes.save();
  });
});

// DELETE
// not yet implemented

app.listen(process.env.PORT || 8080);