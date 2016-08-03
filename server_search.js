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
  console.log("STARTING CASEDICT GET: " + JSON.stringify(req.query));
  reqJSON = req.query;
  var CaseCollection = mongoose.model('casedict');
  CaseCollection.findOne({link: reqJSON["link"]}, function(err, caseRes){
    if (err) return res.send(err);
    else {
      console.log("IN CASEDICT FINDRESULT: " + JSON.stringify(caseRes));
      var tempArray = caseRes.examMode;
      if ((tempArray.length == 0) || (Math.max.apply(null, tempArray) >= 10)) {
        res.send(tempArray);
      }
      else res.send(null);
    }  
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
      var tempArray = [];
      if (caseRes.examMode.length != reqJSON["senLength"]) {
        tempArray = new Array(reqJSON["senLength"]);
          for (var i=0; i<reqJSON["senLength"]; i++) {
              tempArray[i] = 0;
          }
      }
      else tempArray = caseRes.examMode;
      for (var i=0; i<reqJSON["examMode"].length; i++) {
          if(reqJSON["examMode"][i] == true) {
            tempArray[i] += 1;
          } 
      }
      caseRes.examMode = tempArray;
      caseRes.markModified('examMode');
      console.log("IN CASEDICT UPDATEDRESULT: " + JSON.stringify(caseRes));
      caseRes.save(function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log('Updated', caseRes);
        }
      });
    }  
  });
});

// DELETE
// not yet implemented

app.listen(process.env.PORT || 8080);