var express = require('express');
var parser = require('body-parser');
var app = express();

var generatePathColors = require('./pathColors');
// var getRoutes = require('./dijkstra.js');

module.exports = app;

app.use(parser.json());

//transforms nodes from interhashScores.json into array of objects expected by MapBox annotations, in order to draw street colors 

var port = 3000;

app.listen(process.env.PORT || port, function() {
  console.log('Listening on port ' + port);
})

app.get('/allstreets', function(req, res) {
  generatePathColors
  .then(function(result){
    res.type('application/json');
    res.status(200);
    res.send(result);
  })
  .catch(function(e) {
      console.log(e);
      res.sendStatus(500);
  });
});

app.post('/routes', function(req, res) {
  console.log('receiving');
  // var short = getRoutes(req.body.start, req.body.dest, 'distance');
  // var safe = getRoutes(req.body.start, req.body.dest, 'crimeDistance');
  var short = require('./dijkstra.js')(req.body.start, req.body.dest, 'distance');
  var safe = require('./dijkstra.js')(req.body.start, req.body.dest, 'crimeDistance');

  var latSW, lonSW, latNE, lonNE;

  var lonSort = short.concat(safe).sort(function(a, b) { return b[0] - a[0]; });
  var latSort = lonSort.sort(function(a, b) { return b[1] - a[1]; });

  res.type('application/json');
  res.status(200);
  res.send(JSON.stringify({
    short: short,
    safe: safe,
    latSW: latSort[0],
    lonSW: lonSort[0],
    latNE: latSort[latSort.length - 1],
    lonNE: lonSort[lonSort.length - 1]
  }));
})


