'use strict';
/* eslint no-console: 0 */

import React, { Component } from 'react';
import Mapbox, { MapView } from 'react-native-mapbox-gl';
import {
  AppRegistry,
  StyleSheet,
  Text,
  StatusBar,
  View,
  TextInput,
  ScrollView
} from 'react-native';

import convertGPS from './src/api';

const accessToken = 'pk.eyJ1IjoibWFmdGFsaW9uIiwiYSI6ImNpcmllbXViZDAyMTZnYm5yaXpnMjByMTkifQ.rSrkLVyRbL3c8W1Nm2_6kA';
Mapbox.setAccessToken(accessToken);

class MapExample extends Component {

  state = {
    center: {
      latitude: 37.7836925,
      longitude: -122.4111781

    },
    zoom: 13,
    userTrackingMode: Mapbox.userTrackingMode.follow,
    annotations: []
  };


  handleStart = (input) => {
    convertGPS(input)
      .then((data) => {
        var annotations = this.state.annotations.slice();
        var index = undefined;

        annotations.forEach((feature, i) => {
          if (feature.id === 'entered location') {
            index = i;
          }
        });


        if (index) {
          annotations.splice(index, 1);
        }

        this.setState({
          start: [data.lat, data.lon],
          annotations: annotations.concat([{
            coordinates: [data.lat, data.lon],
            title: data.name,
            type: 'point',
            annotationImage: {
              source: { uri: 'https://cldup.com/7NLZklp8zS.png' },
              height: 25,
              width: 25
            },
            id: 'entered location'
          }])
        }, () => {
          if (!this.state.dest) {
            this._map.setCenterCoordinateZoomLevel(data.lat, data.lon, 15, true);
          }
          this.showRoutes();
        });
      });
  }

  handleDest = (input) => {
    convertGPS(input)
      .then((data) => {
        var annotations = this.state.annotations.slice();
        var index = undefined;

        annotations.forEach((feature, i) => {
          if (feature.id === 'entered destination') {
            index = i;
          }
        });


        if (index) {
          annotations.splice(index, 1);
        }

        this.setState({
          dest: [data.lat, data.lon],
          annotations: annotations.concat([{
            coordinates: [data.lat, data.lon],
            title: data.name,
            type: 'point',
            annotationImage: {
              source: { uri: 'https://cldup.com/7NLZklp8zS.png' },
              height: 25,
              width: 25
            },
            id: 'entered destination'
          }])
        }, () => {
          if (!this.state.start) {
            this._map.setCenterCoordinateZoomLevel(data.lat, data.lon, 15, true);
          }
          this.showRoutes();
        });
      });
  }

  showRoutes = () => {
    if (this.state.start && this.state.dest) {
      fetch('http://localhost:3000/routes', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          start: [this.state.start[1], this.state.start[0]],
          dest: [this.state.dest[1], this.state.dest[0]]
        })
      })
      .then((response) => response.json())
      .then((responseJson) => {
        console.log(responseJson);
        responseJson.short.forEach((el) => {
          var temp = el[0];
          el[0] = el[1];
          el[1] = temp;
        });
        responseJson.safe.forEach((el) => {
          var temp = el[0];
          el[0] = el[1];
          el[1] = temp;
        });
        console.log(responseJson);
        var annotations = this.state.annotations.slice();
        var index = undefined;

        annotations.forEach((feature, i) => {
          if (feature.id === 'shortRoute') {
            index = i;
          }
        });
        console.log(index);
        if (index) {
          annotations.splice(index, 2);
        }

        this.setState({
          short: responseJson.short,
          safe: responseJson.safe,
          annotations: annotations.concat([{
            coordinates: responseJson.short,
            type: 'polyline',
            strokeColor: '#28B463',
            strokeWidth: 5,
            strokeAlpha: 0.7,
            id: 'shortRoute'
          }, {
            coordinates: responseJson.safe,
            type: 'polyline',
            strokeColor: '#5DADE2',
            strokeWidth: 5,
            strokeAlpha: 0.7,
            id: 'safeRoute'
          }])
        }, () => {
          // console.log('zoom', this.getBoundsZoomLevel(this.state.start, this.state.dest));
          // this._map.setCenterCoordinateZoomLevel(
          //   (this.state.start[0] + this.state.dest[0]) / 2, 
          //   (this.state.start[1] + this.state.dest[1]) / 2, 
          //   this.getBoundsZoomLevel(this.state.start, this.state.dest),
          //   true
          // );
          // var latSW = Math.min(this.state.start[0], this.state.dest[0]);
          // var lonSW = Math.max(this.state.start[1], this.state.dest[1]);
          // var latNE = Math.max(this.state.start[0], this.state.dest[0]);
          // var lonNE = Math.min(this.state.start[1], this.state.dest[1]);
          // var spanLat = latNE - latSW;
          // var spanLon = lonSW - lonNE;

          // this._map.setVisibleCoordinateBounds(
          //   latSW - 0.1 * spanLat,
          //   lonSW + 0.1 * spanLon,
          //   latNE + 0.1 * spanLat,
          //   lonNE - 0.1 * spanLon
          // );

          // var lonSort = this.state.short.concat(this.state.safe).sort(function(a, b) { return b[1] - a[1]; });
          // var latSort = lonSort.sort(function(a, b) { return b[0] - a[0]; });

          // var latSW = latSort[0][0];
          // var lonSW = lonSort[0][1];
          // var latNE = latSort[latSort.length - 1][0];
          // var lonNE = lonSort[lonSort.length - 1][1];
          // var spanLat = latNE - latSW;
          // var spanLon = lonNE - lonSW;

          var nodes = this.state.short.concat(this.state.safe).concat([this.state.start, this.state.safe]);
          var latSW = nodes[0][0]; var latNE = nodes[0][0]; var lonSW = nodes[0][1]; var lonNE = nodes[0][1];

          nodes.forEach(function(node) {
            if (node[0] > latNE) { latNE = node[0]; }
            if (node[0] < latSW) { latSW = node[0]; }
            if (node[1] > lonNE) { lonNE = node[1]; }
            if (node[1] < lonSW) { lonSW = node[1]; }
          });

          var spanLat = latNE - latSW;
          var spanLon = lonNE - lonSW;

          console.log(latSW, lonSW, latNE, lonNE, spanLat, spanLon);

          this._map.setVisibleCoordinateBounds(
            latSW - 0.1 * spanLat,
            lonSW - 0.1 * spanLon,
            latNE + 0.1 * spanLat,
            lonNE + 0.1 * spanLon
          );

          console.log(this.state.annotations);
          console.log('map', this._map, this._map.fitBounds);
        });
      });
    }
  }

  getBoundsZoomLevel(start, end) {
    var WORLD_DIM = { height: 256, width: 256 };
    var ZOOM_MAX = 21;

    var latRad = (lat) => {
      var sin = Math.sin(lat * Math.PI / 180);
      var radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
      return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
    }

    var zoom = (mapPx, worldPx, fraction) => {
      return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
    }

    var ne = {lat: Math.max(start[0], end[0]), lng: Math.min(start[1], end[1])};
    var sw = {lat: Math.min(start[0], end[0]), lng: Math.max(start[1], end[1])};

    console.log('ne', ne, 'sw', sw);

    var latFraction = (latRad(ne.lat) - latRad(sw.lat)) / Math.PI;

    var lngDiff = ne.lng - sw.lng;
    var lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

    var latZoom = zoom(this.state.height, WORLD_DIM.height, latFraction);
    var lngZoom = zoom(this.state.width, WORLD_DIM.width, lngFraction);
    console.log(latFraction, lngDiff, lngFraction, latZoom, lngZoom);
    return Math.min(latZoom, lngZoom, ZOOM_MAX);
  }

  getDimensions(layout) {
    console.log(layout);
    this.setState({
      width: layout.width,
      height: layout.height
    });
  }

  onRegionDidChange = (location) => {
    this.setState({ currentZoom: location.zoomLevel });
    console.log('onRegionDidChange', location);
  }

  onChangeUserTrackingMode = (userTrackingMode) => {
    this.setState({ userTrackingMode });
    console.log('onChangeUserTrackingMode', userTrackingMode);
  }

  componentWillMount() {
    this._offlineProgressSubscription = Mapbox.addOfflinePackProgressListener(progress => {
      console.log('offline pack progress', progress);
    });
    this._offlineMaxTilesSubscription = Mapbox.addOfflineMaxAllowedTilesListener(tiles => {
      console.log('offline max allowed tiles', tiles);
    });
    this._offlineErrorSubscription = Mapbox.addOfflineErrorListener(error => {
      console.log('offline error', error);
    });
  }

  componentDidMount() {

    var mainComponent = this;

    fetch('http://localhost:3000/allstreets')
      .then((response) => response.json())
      .then((responseJson) => {

        mainComponent.setState({ annotations: responseJson });

        //return responseJson;
      })
      .catch((error) => {
        console.error(error);
      });
  }

  componentWillUnmount() {
    this._offlineProgressSubscription.remove();
    this._offlineMaxTilesSubscription.remove();
    this._offlineErrorSubscription.remove();
  }

  render() {
    return (
        <View
        style={styles.container}
        onLayout={ (event) => this.getDimensions(event.nativeEvent.layout) }>
          <MapView
            ref={map => { this._map = map }}
            style={styles.map}
            initialCenterCoordinate={this.state.center}
            initialZoomLevel={this.state.zoom}
            initialDirection={0}
            rotateEnabled={true}
            scrollEnabled={true}
            zoomEnabled={true}
            showsUserLocation={true}
            userTrackingMode={this.state.userTrackingMode}
            annotations={this.state.annotations}
            annotationsAreImmutable
            onChangeUserTrackingMode={this.onChangeUserTrackingMode}
            onRegionDidChange={this.onRegionDidChange}
          />
          <View style={{opacity: 5}}>
            <TextInput
            onSubmitEditing={(event) => this.handleStart(event.nativeEvent.text) }
              style={styles.textInput}
              placeholder="Enter current location"
              />
              <TextInput
              onSubmitEditing={(event) => { console.log('submitted'); this.handleDest(event.nativeEvent.text); }}
                style={styles.textInput}
                placeholder="Enter Destination"
                />
          </View>
        </View>
    );
  }
}

const styles = StyleSheet.create({
  textInput: {
    height: 30,
    textAlign: 'center',
    borderColor: 'black',
    borderWidth: 1,
  },
  container: {
    flex: 1,
    alignItems: 'stretch'
  },
  map: {
    flex: 1
  },
  scrollView: {
    flex: 1
  }
});

AppRegistry.registerComponent('whimsicleBugle', () => MapExample);
