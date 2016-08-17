var express = require('express');
var parser = require('body-parser');
var app = express();
var Incident = require('./models/model');

var generatePathColors = require('./pathColors');
var getRoutes = require('./dijkstra.js');

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
  var short = getRoutes(req.body.start, req.body.dest, 'distance');
  var safe = getRoutes(req.body.start, req.body.dest, 'crimeDistance');

  res.type('application/json');
  res.status(200);
  res.send(JSON.stringify({
    short: short,
    safe: safe
  }));
})

app.get('/incident', function(req, res) {
  console.log('/incident get route');
  Incident.findAll({
    where: {
      datetime: {
        //filter for incidents where datetime greater than or equal to the past 24 hours
        $gte: new Date(new Date() - 24 * 60 * 60 * 1000)
      }
    }
  }).then( function (incidents) {
    console.log(incidents);
    res.type('application/json');
    res.status(200);
    res.send(JSON.stringify(incidents));
  });

});

app.post('/incident', function(req, res) {
  console.log('/incident post route');
  //need to parse JSON from req.body

  Incident.create({ category: 'robbery', datetime: new Date(), latitude: 37.7836925, longitude: -122.4111781 }).then(function(incident) {
    console.log('new incident saved');
  });
});
