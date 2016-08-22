// var hash = require(__dirname + '/crime/sfinterhashScores.json');
// var hash = require(__dirname + '/crime/sfinterhashScoresCrimeDistance.json');
var hash = require(__dirname + '/crime/sfRoadsInterhashScoresCrimeDistance.json');
var PriorityQueue = require(__dirname + '/util/priorityQueue.js');
var fs = require('fs');

// var start1 = '[-122.4034972,37.7879652]';
// var dest1 = '[-122.4035912,37.7884358]';
// var start = '[-122.42204,37.7884789]';
// var dest = '[-122.402768,37.7857093]';
var inf = Number.MAX_VALUE;
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
        console.log('x', hash[s[x]].edges);
        // Traverse all edges from node, in case two different roads connect two nodes.
        for (var y = 0; y < hash[s[x]].edges.length; y++) {
          console.log('y', hash[s[x]].edges[y].node, s[x + 1]);
          if (hash[s[x]].edges[y].node === s[x + 1] && (!intermediatePath || hash[s[x]].edges[y][attr] < edgeWeight)) {
            console.log('writing');
            intermediatePath = hash[s[x]].edges[y].path;
            edgeWeight = hash[s[x]].edges[y][attr];
            intermediateDist = hash[s[x]].edges[y].distance;
            intermediateDanger = hash[s[x]].edges[y].walkDangerScore;
            console.log('inter', intermediatePath, edgeWeight, intermediateDist, intermediateDanger);
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
}
