var fs = require('fs');
var _ = require('underscore');

Number.prototype.toRadians = function () {
	return this * Math.PI / 180;
};

//Computes great circle distance between two points on a sphere. Inputs for each point must be arrays of latitude and longitude.
var computeHaversine = function (startPoint, endPoint) {
    var R = 6371e3; // metres
    var φ1 = startPoint[1].toRadians();
    var φ2 = endPoint[1].toRadians();
    var Δφ = ( endPoint[1] - startPoint[1] ).toRadians();
    var Δλ = (endPoint[0]-startPoint[0]).toRadians();

    var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    var d = R * c;
    return d;
};

console.time('t');
fs.readFile('./interhash.json', 'utf8', function(err, rawNodes) {

     var nodes = JSON.parse(rawNodes);
     //626 nodes for tenderloin area.

     _.each(nodes, function(node){

          //initialize crimeCount to 0 for each node
          node['crimeCount'] = 0;

          //initialize counts for each edge
          _.each(node.edges, function(edge) {
               edge['walkDangerScore'] = 0;
               edge['bikeDangerScore'] = 0;
               edge['crimeCount'] = 0;
               edge['chrisDistance'] = computeHaversine([node['x'], node['y']], JSON.parse(edge.node) );

          });
     });

     var testNode = nodes['[-122.4091399,37.7834292]'];
     //Turk St. & Mason St. Outside Hack reactor

     var testNode2 = nodes['[-122.4090994,37.7832013]']; 
     //just south of testNode

     fs.readFile('./filteredCrimes.json', 'utf8', function(error, rawCrimes) {

          //sets bounds on which nodes to calculate haversine distance on
          var boundDistance = 0.25 //km
          var boundDistanceDegrees = 0.25/111.045 //latitude degrees
          var haversineDistance;

          var crimePoint;
          var crimeLat;
          var currentPoint;
          var currentLat;
          var closestNode;
          var closestDistance;
          var eligibleEdges;

          //counts for testing and tracking purposes of which crimes get matched to nodes
          var unmatched = 0;
          var matched = 0;

          var crimes = JSON.parse(rawCrimes);

          _.each(crimes, function(crime) {
               closestNode = undefined;
               closestDistance = 1000000;
               crimePoint = [crime['X'], crime['Y']];
               crimeLat = crimePoint[1];

               //the goal of this loop is to identify the closest node
               _.each(nodes, function(node) {
                    currentPoint = [node['x'], node['y']];
                    currentLat = currentPoint[1];

                    //if currentPoint is estimated to be within 0.25km by Lat of the crime. This condition helps reduce expensive haversine calculations.
                    if (currentLat > crimeLat - boundDistanceDegrees && currentLat < crimeLat + boundDistanceDegrees) {

                        haversineDistance = computeHaversine(crimePoint, currentPoint);
                         if (haversineDistance < closestDistance) {
                              closestDistance = haversineDistance;
                              closestNode = node;
                         }   
                    }
               });


               eligibleEdges = [];
               var nodeEdgeDistance;
               var crimeEdgeDistance;

               var closestEdgeDistance = 1000000;
               var closestEdge;

               //if closestNode was found, the goal of this if block is to match the crime to an edge linked to closestNode.
               if (closestNode) {
                    //iterate through closestNode's edges
                    _.each(closestNode.edges, function(edge) {
                         nodeEdgeDistance = computeHaversine([closestNode['x'], closestNode['y']], JSON.parse(edge.node) );
                         crimeEdgeDistance = computeHaversine(crimePoint, JSON.parse(edge.node));

                         //determine if edge is eligible (distance from crime to edge is less than or equal to distance from node to edge)
                         if (crimeEdgeDistance <= nodeEdgeDistance) {
                              eligibleEdges.push([edge.node,crimeEdgeDistance]);
                         }
                    });

                    if (eligibleEdges.length > 0) {

                         //determine nearest edge in eligible edges array
                         _.each(eligibleEdges, function(edge) {
                              if (edge[1] < closestEdgeDistance) {
                                   closestEdgeDistance = edge[1];
                                   closestEdge = edge[0];
                              }
                         });

                         //increment danger scores and crime count of nearest edge
                         _.each(closestNode.edges, function(edge) {
                              if (edge.node === closestEdge) {
                                   edge['walkDangerScore'] += crime['walkweight'];
                                   edge['bikeDangerScore'] += crime['bikeweight'];
                                   edge['crimeCount']++;
                              }
                         });

                         //Update corresponding edge for symmetry (edges are bi-directional)
                         _.each(nodes[closestEdge].edges, function(edge) {
                              if(edge.node === JSON.stringify([closestNode['x'], closestNode['y']]) ) {
                                   edge['walkDangerScore'] += crime['walkweight'];
                                   edge['bikeDangerScore'] += crime['bikeweight'];
                                   edge['crimeCount']++;                              
                              }
                         });

                    }

                    matched++;
                    closestNode['crimeCount']++;

               } else {
                    unmatched++;
               }
          });
          
          console.log('test node: ' + JSON.stringify(testNode));
          console.log('test node2: ' + JSON.stringify(testNode2));
          console.log('matched: ' + matched);
          console.log('unmatched: ' + unmatched);
          console.timeEnd('t');

          //writes results to file
          fs.writeFile('interhashScores.json', JSON.stringify(nodes) , (err) => {
            if (err) throw err;
            console.log('saved');
          });

     });
});
