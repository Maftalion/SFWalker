var Promise = require('bluebird');
var readFile = Promise.promisify(require("fs").readFile);

module.exports = readFile(__dirname + '/crime/interhashScores.json', 'utf-8').then( function(rawNodes) { 

    var parsedNodes = JSON.parse(rawNodes);
    var paths = [];
    var path;
    var streetColors = { 
      yellow: '#feb24c', 
      orange: '#fc4e2a', 
      red: '#b10026'
    };

    var counter = 0;

    for (var key in parsedNodes) {
    	
    	node = parsedNodes[key];

    	if (node.edges) {
	      for (var edge = 0; edge < node.edges.length; edge++) {
	        counter++;
	        if(node.edges[edge].walkDangerScore >= 3.85) {
	          var edgePoint = JSON.parse(node.edges[edge].node);
	          var temp = edgePoint[0];
	          edgePoint[0] = edgePoint[1]
	          edgePoint[1] = temp;

	          path = {
	            coordinates: [[node.y, node.x], edgePoint],
	            type: 'polyline',
	            strokeWidth: 4,
	            strokeAlpha: 0.4,
	            id: counter.toString()
	          };

	          if (node.edges[edge].walkDangerScore < 23.2) {
	            path.strokeColor = streetColors.yellow;
	          } else if (node.edges[edge].walkDangerScore < 98.1) {
	            path.strokeColor = streetColors.orange;
	          } else {
	            path.strokeColor = streetColors.red;
	          }
	          paths.push(path);
	        }

	      }
    	}
    }
    return paths;
});