

module.exports = function(query) {
  var url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=pk.eyJ1IjoibWFmdGFsaW9uIiwiYSI6ImNpcmllbXViZDAyMTZnYm5yaXpnMjByMTkifQ.rSrkLVyRbL3c8W1Nm2_6kA`

  return fetch(url)
    .then(function(data){
      return data.json();
    })
      .then(function(response){
        return {
          name: response.query.join(' ').titleize(),
          lat: response.features[0].center[1],
          lon: response.features[0].center[0]
        }
      })
}


String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}
String.prototype.titleize = function() {
    var string_array = this.split(' ');
    string_array = string_array.map(function(str) {
       return str.capitalize();
    });

    return string_array.join(' ');
}
