var express = require('express');
var parser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Incident = require('./models/model');
var _ = require('underscore');
var Promise = require('bluebird');
var moment = require('moment')
var generatePathColors = require('./pathColors');
var getRoutes = require('./dijkstra.js');

module.exports = app;

app.use(parser.json());

//transforms nodes from interhashScores.json into array of objects expected by MapBox annotations, in order to draw street colors

var port = process.env.PORT || 3000;

http.listen(port, function() {
  console.log('Listening on port ' + port);
})

io.on('connection', function(socket){
  console.log('a user connected!');

  socket.on('report', function (data) {
    console.log('incident recieved on backend')
    var time = moment().format('MMMM Do YYYY, h:mm:ss a');
    //create new object to write to postgres
    var newIncident = {
      category: data.category,
      datetime: time,
      latitude: data.coords[0],
      longitude: data.coords[1]
    };

    //write to postgres
    Incident.create(newIncident).then(function(incident) {
      console.log('new incident saved');

      //emit incident back to all users
      socket.emit('appendReport', incident);
    });
  });
});

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
  Promise.all([getRoutes(req.body.start, req.body.dest, 'distance', false), 
               getRoutes(req.body.start, req.body.dest, 'crimeDistance', false),
               getRoutes(req.body.start, req.body.dest, 'distance', true),
               getRoutes(req.body.start, req.body.dest, 'crimeDistance', true)])
  .then(function(values) {
    // console.log(values);
    res.type('application/json');
    res.status(200);
    res.send(JSON.stringify({
      short: values[0].path,
      shortDist: values[0].dist,
      shortDanger: values[0].danger,
      safe: values[1].path,
      safeDist: values[1].dist,
      safeDanger: values[1].danger,
      ptShort: values[2].path,
      ptShortDist: values[2].dist,
      ptShortDanger: values[2].danger,
      ptShortInstructions: values[2].instructions,
      ptSafe: values[3].path,
      ptSafeDist: values[3].dist,
      ptSafeDanger: values[3].danger,
      ptSafeInstructions: values[3].instructions
    }));
  });
});

app.get('/incidents', function(req, res) {
  console.log('/incident get route');
  Incident.findAll({
    where: {
      datetime: {
        //filter for incidents where datetime greater than or equal to the past 24 hours
        $gte: new Date(new Date() - 24 * 60 * 60 * 1000)
      }
    }
  }).then( function (incidents) {

    var data = [];
    _.each(incidents, function(incident){
      var obj = {
        type: 'point',
        id: 'report:'+incident.id.toString(),
        coordinates: [incident.latitude, incident.longitude],
        annotationImage: {
           source: { uri: 'https://cldup.com/7NLZklp8zS.png' },
           height: 25,
           width: 25
         }
      }
      data.push(obj);

    });
    res.type('application/json');
    res.status(200);
    res.send(data);
  });

});
