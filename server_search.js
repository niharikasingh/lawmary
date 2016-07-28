var express = require('express');
var casedict = require('./public/js/casedict.json');
var keys = Object.keys(casedict);

var app = express();

app.get('/nodesearch', function (req, res) {
  console.log("STARTING SEARCH: " + JSON.stringify(req.query));
  var searchJSON = req.query;
  var q = searchJSON["query"];
  var respstr = 'callbackDisplay({"results":';
  var resparr = [];
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if ((key.length >= q.length) && (key.indexOf(q) > -1)) {
        var links = casedict[key];
        resparr.push(links);
    }
  }
  respstr += JSON.stringify(resparr);
  respstr += "});"
  res.send(respstr);
  console.log("ENDING SEARCH: " + respstr);
});

app.listen(8080);