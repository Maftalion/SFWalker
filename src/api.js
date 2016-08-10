
module.exports = function(address) {
  var url = 'https://api.mapbox.com/mapbox.places/' + address + '?access_token=pk.eyJ1IjoibWFmdGFsaW9uIiwiYSI6ImNpcmllbXViZDAyMTZnYm5yaXpnMjByMTkifQ.rSrkLVyRbL3c8W1Nm2_6kA'

  fetch(url)
    .then(function(data){
      return data.json();
    })
      .then(function(response){
        return {
          lat: response.features.center[0],
          lon: response.features.center[1]
        }
      })
}
