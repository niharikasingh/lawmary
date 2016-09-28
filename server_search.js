var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var request = require('request');
var kue = require('kue');
var redis = require('kue/node_modules/redis');
var url = require('url');
var pythonShell = require('python-shell');

// INITIALIZE DATABASE

mongoose.connect('mongodb://ruler:hotpics@ds139715.mlab.com:39715/lawmary');
var db = mongoose.connection;
db.on( 'error', console.error.bind( console, 'connection error:' ) );

// INITIALIZE REDIS
console.log("REDIS_URL: " + process.env.REDIS_URL);
var client = redis.createClient(process.env.REDIS_URL);
// INITIALIZE KUE
var redisConfig = {
    redis: process.env.REDIS_URL
};
var jobs = kue.createQueue(redisConfig);
// INITIALIZE PYTHON
jobs.process('summarize', function(job, done) {
    var text = "";
    var pythonOptions = {
      mode: 'text',
      args: [job.data.textToSummarize, job.data.amount]
    };
    var summaryFunction = new pythonShell('public/py/CleanAndExtract.py', pythonOptions, function (err, results) {
      if (err) console.log(err);
      console.log('PYTHONSHELL results: %j', results);
      text = results;
      return done(null, text);
    });
    
    var output = [];
    summaryFunction.on('message', function (message) {
        //console.log("PYTHONSHELL message: %s", message);
        output.push(message);
    }).end(function (err) {
        console.log("PYTHONSHELL ending function");
        if (err) console.log(err);
        text = output.join('\n');
        // expire after 5 minutes
        client.set(""+job.data.req_id, text, 'NX', 'EX', 300);
        client.get(""+job.data.req_id, function (err, reply) {
            console.log("PYTHONSHELL saved:\n", reply.toString()); 
        });
        return done(null, text);
    }); 
});

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
            res.send('No case could be found.');
        } else if (body["results"].length > 0) {
            var id = body["results"][0]["id"];
            caseName = body["results"][0]["caseName"];
            console.log("Received case metadata: ", caseName);
            if (Number(id) != NaN) {
                // Send id to user for polling
                res.send(''+id);
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
                    console.log("Received case raw text.");
                    // extract text
                    var text = "";
                    if ((body2["results"][0]["plain_text"] != null) && (body2["results"][0]["plain_text"].length > 0)) text = body2["results"][0]["plain_text"];
                    else if ((body2["results"][0]["html"] != null) && (body2["results"][0]["html"].length > 0)) text = body2["results"][0]["html"];
                    else if ((body2["results"][0]["html_lawbox"] != null) && (body2["results"][0]["html_lawbox"].length > 0)) text = body2["results"][0]["html_lawbox"];
                    else if ((body2["results"][0]["html_columbia"] != null) && (body2["results"][0]["html_columbia"].length > 0)) text = body2["results"][0]["html_columbia"];
                    text = cleanText(text);
                    // create job to summarize
                    console.log("Sending to job.");
                    var job = jobs.create('summarize', {
                        textToSummarize: text,
                        amount: 0.05,
                        req_id: id
                    });
                    job.on('complete', function(){
                        console.log("Job completed: %s", job.result);
                    }).on('failed', function(){
                        console.log("Job failed.");
                    });
                    job.save();
                });
            }
            else {
                res.send('No case could be found.');
            }
        }
    });
});

app.listen(process.env.PORT || 8080);