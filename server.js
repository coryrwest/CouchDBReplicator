var http = require('./http.js');
var config = require('./config.json');

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
});

// First get a list of all the databases
http.get(config.sourceDb + '/_all_dbs').then(function(res) {
      var dbList = JSON.parse(res);

      console.log('Databases set for replication: ' + dbList.join(', '));

      for (var db in dbList) {
        // exclude _ and test databases
        if (dbList[db].substr(0, 1) == '_' || dbList[db].substr(0, 10) == 'test_suite') {continue;}

        var loginUrl = buildLoginUrl(config.sourceDb, config.sourceDbUserName, config.sourceDbPassword);
        var targetLoginUrl = buildLoginUrl(config.targetDb, config.targetDbUserName, config.targetDbPassword);
        http.post(loginUrl + '/_replicate', {
          'source': dbList[db],
          'target': targetLoginUrl + '/' + dbList[db]
        }).then(function(res) {
          if (res.ok) {
            if (config.logLevel == 'debug') {
              console.log(dbList[db] + ': ' + res);
            } else {
              var logRes = {
                database: dbList[db],
                changes: (res.no_changes == undefined),
                docs_written: res.history[0].docs_written,
                doc_write_failures: res.history[0].doc_write_failures
              };
              console.log('Database replicated successfully: ' + JSON.stringify(logRes));
            }
          } else {
            console.log(res);
          }
        }, function(err) { console.log(err); });
      }
    }, function(err) { console.log(err); }
);

function buildLoginUrl(base, user, pass) {
  var urlParts = base.split('//');
  return urlParts[0] + '//' + user + ':' + pass + '@' + urlParts[1];
}