#!/usr/bin/env nodejs
var http = require('./http.js');
var config = require('./config.json');
var promise = require('promise');

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
});

// First get a list of all the databases
http.get(config.sourceDb + '/_all_dbs').then(function(res) {
      var dbList = JSON.parse(res);

      console.log('Databases set for replication: ' + dbList.join(', '));

      var promiseList = [];

      for (var db in dbList) {
        var dbName = dbList[db];
        // exclude _ and test databases
        if (dbName.substr(0, 1) == '_' || dbName.substr(0, 10) == 'test_suite') {continue;}

        promiseList.push(replicateDb(dbName));
      }

      return promises.all(promiseList);
    }, function(err) { console.log(err); }
);

function buildLoginUrl(base, user, pass) {
  var urlParts = base.split('//');
  return urlParts[0] + '//' + user + ':' + pass + '@' + urlParts[1];
}

function replicateDb(dbName) {
  var loginUrl = buildLoginUrl(config.sourceDb, config.sourceDbUserName, config.sourceDbPassword);
  var targetLoginUrl = buildLoginUrl(config.targetDb, config.targetDbUserName, config.targetDbPassword);
  return http.post(loginUrl + '/_replicate', {
    'source': dbName,
    'target': targetLoginUrl + '/' + dbName,
    'create_target': true
  }).then(function(res) {
       handleReplicateResponse(dbName, res);
  }, function(err) { console.log(err); });
}

function handleReplicateResponse(dbName, res) {
  if (res.ok) {
    if (config.logLevel == 'debug') {
      console.log(dbName + ': ' + res);
    } else {
      var logRes = {
        database: dbName,
        changes: (res.no_changes == undefined),
        docs_written: res.history[0].docs_written,
        doc_write_failures: res.history[0].doc_write_failures
      };
      console.log('Database replicated successfully: ' + JSON.stringify(logRes));
    }
  } else {
    console.log(res);
  }
}