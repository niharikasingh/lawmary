var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var request = require('request');
var kue = require('kue');
var redis = require('kue/node_modules/redis');
var url = require('url');

// INITIALIZE DATABASE

mongoose.connect('mongodb://ruler:hotpics@ds139715.mlab.com:39715/lawmary');
var db = mongoose.connection;
db.on( 'error', console.error.bind( console, 'connection error:' ) );

// INITIALIZE KUE
console.log("REDIS_URL: " + process.env.REDIS_URL);
var redisConfig = {
    redis: process.env.REDIS_URL
};

redis.createClient = function() {
    console.log("Inside kue redis function");
    var redisUrl = url.parse(process.env.REDIS_URL);
    var client = redis.createClient(redisUrl, {port: redisUrl.port}, {host: redisUrl.hostname});
    if (redisUrl.auth) {
        client.auth(redisUrl.auth.split(":")[1]);
    }
    return client;
};
var jobs = kue.createQueue(redisConfig);

// once the connection is established we define our schemas
db.once( 'open', function callback() {

    // independent schema
    var CaseSchema = new mongoose.Schema( {
        name: String,
        link: String,
        tags: [String],
        visited: Number,
        examMode: [Number]
    }, {
        versionKey: false 
    });

    // create Mongoose models from our schemas
    var CaseCollection = mongoose.model('casedict', CaseSchema);

});

var app = express();
app.use(express.static(__dirname + "/public"));
//app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(kue.app);

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
      if (Math.max.apply(null, tempArray) >= 10) {
        res.send(JSON.stringify(tempArray));
      }
      else res.send(JSON.stringify([]));
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

var cleanText = function(text) {
    // replace all html tags
    text = text.replace(/<.*?>/g, "");
    // replace newline characters
    text = text.replace(/\\n/g, "");
    return text;
}

// TEST SECTION
app.get('/test', function(req, res) {
    var caseName = "";
    // Send request to CourtListener for case ID number
    request({
        url: 'https://www.courtlistener.com/api/rest/v3/search/', 
        qs: {"citation": "477 U.S. 242"}, 
        method: 'GET', 
        json: true,
        headers: { 
            'Authorization': 'Token 1725c13be1d7607d790ce749ca23a368fce0388e',
            'Accept': 'application/json'
        }
    }, function(error, response, body){
        if(error) {
            console.log(error);
        } else if (body["results"].length > 0) {
            console.log(response.statusCode, body);
            var id = body["results"][0]["id"];
            caseName = body["results"][0]["caseName"];
            if (Number(id) != NaN) {
                // Send request to CourtListener for case ID number
                request({
                    url: 'https://www.courtlistener.com/api/rest/v3/opinions/', 
                    qs: {"id": id}, 
                    method: 'GET', 
                    json: true,
                    headers: { 
                        'Authorization': 'Token 1725c13be1d7607d790ce749ca23a368fce0388e',
                        'Accept': 'application/json'
                    }
                }, function(error2, response2, body2){
                    // extract text
                    var text = "";
                    if ((body2["results"][0]["plain_text"] != null) && (body2["results"][0]["plain_text"].length > 0)) text = body2["results"][0]["plain_text"];
                    else if ((body2["results"][0]["html"] != null) && (body2["results"][0]["html"].length > 0)) text = body2["results"][0]["html"];
                    else if ((body2["results"][0]["html_lawbox"] != null) && (body2["results"][0]["html_lawbox"].length > 0)) text = body2["results"][0]["html_lawbox"];
                    else if ((body2["results"][0]["html_columbia"] != null) && (body2["results"][0]["html_columbia"].length > 0)) text = body2["results"][0]["html_columbia"];
                    text = cleanText(text);
                    // create job to summarize
                    var job = jobs.create('summarize', {
                        textToSummarize: text,
                        amount: 0.5
                    });
                    job.on('complete', function(){
                        res.send(job.result);
                    }).on('failed', function(){
                        res.send("Job failed");
                    });
                    job.save();
                });
            }
        }
    });
});

app.listen(process.env.PORT || 8080);