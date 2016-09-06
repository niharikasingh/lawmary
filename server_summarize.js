var kue = require('kue');
var redis = require('kue/node_modules/redis');
var pythonShell = require('python-shell');
var url = require('url');

kue.redis.createClient = function() {
    var redisUrl = url.parse(process.env.REDIS_URL || "redis://h:p6baq7eutej9n043d5cdg1vv8nm@ec2-54-163-236-235.compute-1.amazonaws.com:22159")
      , client = redis.createClient(redisUrl.port, redisUrl.hostname);
    if (redisUrl.auth) {
        client.auth(redisUrl.auth.split(":")[1]);
    }
    return client;
};
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