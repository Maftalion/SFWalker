var express = require('express');
var app = express();

//transforms nodes from interhashScores.json into array of objects expected by MapBox annotations, in order to draw street colors 
var generatePathColors = require('./pathColors');

var port = 3000;

generatePathColors
.then(function(result){

	app.get('/allstreets', function(req, res) {
		res.type('application/json');
		res.send(result);
	});

	app.listen(port);
	console.log('Listening on port ' + port);

})
.catch(function(e) {
    console.log(e);
});




