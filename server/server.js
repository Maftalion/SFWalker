var express = require('express');
var parser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Incident = require('./models/model');

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
  
    //create new object to write to postgres
    var newIncident = {
      category: data.category,
      datetime: new Date(),
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
