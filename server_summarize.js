var kue = require('kue');
var redis = require('kue/node_modules/redis');
var pythonShell = require('python-shell');

kue.redis.createClient = redis.createClient(process.env.REDIS_URL);
var jobs = kue.createQueue();

jobs.process('summarize', function(job, done) {
    var text = "";
    var pythonOptions = {
      mode: 'text',
      args: [job.data.textToSummarize, job.data.amount]
    };
    pythonShell.run('public/py/CleanAndExtract.py', pythonOptions, function (err, results) {
      if (err) console.log(err);
      console.log('PYTHONSHELL results: %j', results);
      text = results;
    });
    done(null, text);
});