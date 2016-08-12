//This file outputs a file containing only the danger scores of each node.
//Used for score distribution analysis.

var fs = require('fs');
var _ = require('underscore');

fs.readFile('./interhashScores.json', 'utf8', function(err, rawNodes) {
	
	var data = JSON.parse(rawNodes);
	var result = [];

	_.each(data, function(node) {
		
		_.each(node.edges, function(edge) {
			result.push(edge.walkDangerScore);
		});
	});

	fs.writeFile('./scores.txt', JSON.stringify(result), function(err) {
		console.log('completed');
	})

});