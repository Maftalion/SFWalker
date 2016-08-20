var Promise = require('bluebird');
var readFile = Promise.promisify(require("fs").readFile);

// module.exports = readFile(__dirname + '/crime/interhashScores.json', 'utf-8').then( function(rawNodes) { 
  // module.exports = readFile(__dirname + '/crime/sfinterhashScores.json', 'utf-8').then( function(rawNodes) { 
  module.exports = readFile(__dirname + '/crime/sfRoadsInterhashScoresCrimeDistance.json', 'utf-8').then( function(rawNodes) { 

    var parsedNodes = JSON.parse(rawNodes);
    var paths = [];
    var path;
    var streetColors = { 
      yellow: '#feb24c', 
      orange: '#fc4e2a', 
      red: '#b10026'
    };

    var edgeTracker = {};

    var counter = 0;

    for (var key in parsedNodes) {
    	
    	node = parsedNodes[key];

    	if (node.edges) {
	      for (var edge = 0; edge < node.edges.length; edge++) {
          var ends = [key, node.edges[edge].node];
          if (!edgeTracker[JSON.stringify(ends)] && !edgeTracker[JSON.stringify(ends.reverse())]) {
  	        counter++;
  	        if (node.edges[edge].walkDangerScore >= 2.55) {
              var curEdge = node.edges[edge];
  	          var edgePoint = JSON.parse(curEdge.node);
              
              var formattedPath = [];
              for (var i = 0; i < curEdge.path.length; i++) {
                formattedPath.push([curEdge.path[i][1], curEdge.path[i][0]]);
              }
              formattedPath.unshift([node.y, node.x]);
              formattedPath.push([edgePoint[1], edgePoint[0]]);


  	          path = {
  	            coordinates: formattedPath,
  	            type: 'polyline',
  	            strokeWidth: 4,
  	            strokeAlpha: 0.8,
  	            id: counter.toString()
  	          };

  	          if (curEdge.walkDangerScore < 6.45) {
  	            path.strokeColor = streetColors.yellow;
  	          } else if (curEdge.walkDangerScore < 42.95) {
  	            path.strokeColor = streetColors.orange;
  	          } else {
  	            path.strokeColor = streetColors.red;
  	          }
  	          paths.push(path);
              edgeTracker[JSON.stringify([key, curEdge.node])] = true;
  	        }

  	      }
        }
    	}
    }
    console.log('counter', counter);
    return paths;
});