var express = require('express');
var parser = require('body-parser');
var app = express();

var generatePathColors = require('./pathColors');

module.exports = app;

app.use(parser.json());

//transforms nodes from interhashScores.json into array of objects expected by MapBox annotations, in order to draw street colors 

var port = 3000;

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
  
})


