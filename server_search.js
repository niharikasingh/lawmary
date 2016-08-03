var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

var app = express();
app.use(express.static(__dirname + "/public"));
//app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// SEARCH FUNCTION

app.get('/nodesearch', function (req, res) {
  console.log("STARTING SEARCH: " + JSON.stringify(req.query));
  // get query string
  var searchJSON = req.query;
  var q = searchJSON["query"];
  // use find function
  var CaseCollection = mongoose.model('casedict');
  var r = new RegExp(q,'i');
  CaseCollection.find({name: {$regex:r}}, null, {sort:{name:1}}, function(err, cases){
    var respstr = 'callbackDisplay({"results":[';
    var resparr = [];
    var prevName = "";
    for (var i = 0; i < cases.length; i++) {
      var caseRes = cases[i];
      // add name only to beginning of array
      if (prevName != caseRes.name) {
        if (resparr.length > 0){
          respstr += JSON.stringify(resparr);
          respstr += ",";
        } 
        resparr = [];
        resparr.push(caseRes.name);
        prevName = caseRes.name;
      }
      resparr.push(caseRes.link);
    }
    respstr += JSON.stringify(resparr);
    respstr += "]});";
    res.send(respstr);
    console.log("ENDING SEARCH: " + respstr);
  });
});


// INITIALIZE DATABASE

mongoose.connect('mongodb://lawmaryruler:hotpics9@ds139715.mlab.com:39715/lawmary');
var db = mongoose.connection;
db.on( 'error', console.error.bind( console, 'connection error:' ) );

// once the connection is established we define our schemas
db.once( 'open', function callback() {

    // independent schema
    var CaseSchema = new mongoose.Schema( {
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
// NOT YET IMPLEMENTED

// READ
app.get('/casedict', function(req, res) {
  var CaseCollection = mongoose.model('casedict');
  CaseCollection.find({link: req.body.link}, function(err, caseRes){
    if (err) return res.send(err); 
    res.send(caseRes.examMode);
  });
});

// UPDATE
app.post('/casedict', function(req, res) {
  console.log("STARTING CASEDICT POST: " + JSON.stringify(req.body));
  reqJSON = req.body;
  var CaseCollection = mongoose.model('casedict');
  CaseCollection.findOne({link: reqJSON["link"]}, function(err, caseRes){
    if (err) return res.send(err);
    else {
      console.log("IN CASEDICT FINDRESULT: " + JSON.stringify(caseRes));
      caseRes.visited += 1;
      if (caseRes.examMode.length == 0) {
          caseRes.examMode = new Array(reqJSON["senLength"]);
      }
      for (i=0; i<reqJSON["examMode"].length; i++) {
          if(reqJSON["examMode"][i] == true) {
            if (caseRes.examMode[i] == null) caseRes.examMode[i] = 1;
            else caseRes.examMode[i] += 1;
          } 
      }
    }
    caseRes.save(function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log('Updated', caseRes);
        }
      });
  });
});

// DELETE
// not yet implemented

app.listen(process.env.PORT || 8080);