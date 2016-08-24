// var hash = require(__dirname + '/crime/sfinterhashScores.json');
// var hash = require(__dirname + '/crime/sfinterhashScoresCrimeDistance.json');
var hash = require(__dirname + '/crime/sfRoadsInterhashScoresCrimeDistance.json');
var PriorityQueue = require(__dirname + '/util/priorityQueue.js');
var Incident = require(__dirname + '/models/model');
var fs = require('fs');
var _ = require('underscore');

// var start1 = '[-122.4034972,37.7879652]';
// var dest1 = '[-122.4035912,37.7884358]';
// var start = '[-122.42204,37.7884789]';
// var dest = '[-122.402768,37.7857093]';
var inf = Number.MAX_VALUE;
var boundDistance = 0.25  // km
var boundDistanceDegrees = 0.25 / 111.045;  // Latitude Degrees
// var attr = 'crimeDistance';

Number.prototype.toRadians = function () {
  return this * Math.PI / 180;
};

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

var binarySearch = function(array, pointLat) {
  var lo = 0,
    hi = array.length - 1,
    mid,
    element;
  while (lo <= hi) {
    mid = Math.floor((lo + hi) / 2, 10);
    element = array[mid];
    if (element.lat > pointLat - boundDistanceDegrees && element.lat < pointLat + boundDistanceDegrees) {
      return mid;
    }
    else if (element.lat < pointLat) {
      lo = mid + 1;
    } else { // (element > point)
      hi = mid - 1;
    }
  }
  return -1;
}

module.exports = function(start, dest, attr) {
  // Find closest nodes to start and dest
  console.log('dijkstra', start, dest, attr);
  var closestStart, closestDest;
  var startDist = destDist = Number.MAX_VALUE;

  for (var key in hash) {
    var coords = JSON.parse(key);
    
    var curStartDist = computeHaversine(start, coords);
    if (curStartDist < startDist) {
      closestStart = coords;
      startDist = curStartDist;
    }

    var curDestDist = computeHaversine(dest, coords);
    if (curDestDist < destDist) {
      closestDest = coords;
      destDist = curDestDist;
    }
  }

  start = closestStart;
  dest = closestDest;
  console.log('closest', start, dest);

  return Incident.findAll({
    where: {
      datetime: {
        //filter for incidents where datetime greater than or equal to the past 24 hours
        $gte: new Date(new Date() - 24 * 60 * 60 * 1000)
      }
    }
  })
  .then(function (incidents) {
    var nodeArray = [];
    _.each(hash, function(node, key) {
      nodeArray.push({
        key: key,
        long: node.x,
        lat: node.y
      });
    });

    nodeArray.sort(function(a, b) {
      return a.lat - b.lat;
    });

    for (var inc = 0; inc < incidents.length; inc++) {
      closestNode = undefined;
      closestDistance = inf;
      incidentPoint = [parseFloat(incidents[inc].longitude), parseFloat(incidents[inc].latitude)];
      incidentLat = incidentPoint[1];

      // Find closest Node
      var searchIndex = binarySearch(nodeArray, incidentLat);
      if (searchIndex > -1) {
        var checkPointer = searchIndex;
        while (checkPointer < nodeArray.length && nodeArray[checkPointer].lat > incidentLat - boundDistanceDegrees && nodeArray[checkPointer].lat < incidentLat + boundDistanceDegrees) {
          haversineDistance = computeHaversine(incidentPoint, [nodeArray[checkPointer].long, nodeArray[checkPointer].lat]);
          if (haversineDistance < closestDistance) {
            closestDistance = haversineDistance;
            closestNode = hash[nodeArray[checkPointer].key];
          }
          checkPointer++;
        }
        checkPointer = searchIndex--;
        while (checkPointer >= 0 && nodeArray[checkPointer].lat > incidentLat - boundDistanceDegrees && nodeArray[checkPointer].lat < incidentLat + boundDistanceDegrees) {
          haversineDistance = computeHaversine(incidentPoint, [nodeArray[checkPointer].long, nodeArray[checkPointer].lat]);
          if (haversineDistance < closestDistance) {
            closestDistance = haversineDistance;
            closestNode = hash[nodeArray[checkPointer].key];
          }
          checkPointer--;
        }
      }

      // Find closest edge
      eligibleEdges = [];
      var nodeEdgeDistance;
      var incidentEdgeDistance;

      var closestEdgeDistance = Number.MAX_VALUE;
      var closestEdge;

      if (closestNode) {
        _.each(closestNode.edges, function(edge) {
          nodeEdgeDistance = computeHaversine([closestNode['x'], closestNode['y']], JSON.parse(edge.node) );
          incidentEdgeDistance = computeHaversine(incidentPoint, JSON.parse(edge.node));

          //determine if edge is eligible (distance from crime to edge is less than or equal to distance from node to edge)
          if (hash[edge.node] && incidentEdgeDistance <= nodeEdgeDistance) {
            eligibleEdges.push([edge.node,incidentEdgeDistance]);
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

          console.log('incident mapped', incidents[inc], key, closestEdge.node);
          //increment danger scores and crime count of nearest edge
          _.each(closestNode.edges, function(edge) {
            if (edge.node === closestEdge) {
              edge['walkDangerScore'] += 100;
              edge['bikeDangerScore'] += 100;
              edge['crimeDistance'] += 100;
            }
          });

          //Update corresponding edge for symmetry (edges are bi-directional)
          _.each(hash[closestEdge].edges, function(edge) {
            if(edge.node === JSON.stringify([closestNode['x'], closestNode['y']]) ) {
              edge['walkDangerScore'] += 100;
              edge['bikeDangerScore'] += 100;
              edge['crimeDistance'] += 100;
            }
          });
        }
      }
    }

    var q = new PriorityQueue(
      function(element) { return element.distSource; },
      function(element) { return element.key; },
      'distSource'
    );

    var keycount = 0;
    for (var key in hash) {
      keycount++;
      var distSource = inf;
      if (key === JSON.stringify(start)) {
        distSource = 0;
      }
      hash[key].distSource = distSource;
      q.push({key: key, distSource: distSource});
    }

    var count = 0;
    while (q.size() > 0) {

      count++;
      cur = q.pop();
      // console.log('cur', count, keycount, cur);

      if (cur.key === JSON.stringify(dest)) {
        console.log('dest reached');
        var s = [];
        var u = cur.key;
        while (hash[u].prev) {
          s.unshift(u);
          u = hash[u].prev;
        }
        s.unshift(u);

        // var jsonPath = [];
        // for (var x = 0; x < s.length - 1; x++) {
        //   jsonPath.push({
        //     type: 'Feature',
        //     properties: {},
        //     geometry: {
        //       type: 'LineString',
        //       coordinates: [JSON.parse(s[x]), JSON.parse(s[x + 1])]
        //     }
        //   });
        // }
        // console.log(JSON.stringify(jsonPath));

        var path = [];
        var pathDist = 0;
        var pathDanger = 0;
        for (var x = 0; x < s.length - 1; x++) {
          path.push(JSON.parse(s[x]));
          var intermediatePath = undefined;
          var intermediateDist = 0;
          var intermediateDanger = 0;
          // console.log('x', hash[s[x]].edges);
          // Traverse all edges from node, in case two different roads connect two nodes.
          for (var y = 0; y < hash[s[x]].edges.length; y++) {
            // console.log('y', hash[s[x]].edges[y].node, s[x + 1]);
            if (hash[s[x]].edges[y].node === s[x + 1] && (!intermediatePath || hash[s[x]].edges[y][attr] < edgeWeight)) {
              // console.log('writing');
              intermediatePath = hash[s[x]].edges[y].path;
              edgeWeight = hash[s[x]].edges[y][attr];
              intermediateDist = hash[s[x]].edges[y].distance;
              intermediateDanger = hash[s[x]].edges[y].walkDangerScore;
              // console.log('inter', intermediatePath, edgeWeight, intermediateDist, intermediateDanger);
            }
          }
          path = path.concat(intermediatePath);
          pathDist += intermediateDist;
          pathDanger += intermediateDanger;

        }
        path.push(JSON.parse(s[s.length - 1]));

        console.log('lengths', s.length, path.length);

        console.log(JSON.stringify(path));
        for (var key in hash) {
          hash[key].prev = undefined;
        }
        return { path: path, dist: pathDist, danger: pathDanger };
      }

      for (var i = 0; i < hash[cur.key].edges.length; i++) {
        var nextkey = hash[cur.key].edges[i].node;

        if (hash[nextkey]) {
          var alt = cur.distSource + parseInt(hash[cur.key].edges[i][attr]);
          // console.log('alt', alt, 'nextDistSource', hash[nextkey].distSource)
          if (alt < hash[nextkey].distSource) {
            // console.log('in overwrite');
            hash[nextkey].distSource = alt;
            hash[nextkey].prev = cur.key;
            q.decreaseKey(nextkey, alt);
          }
        }
      }
    }
  });
}
