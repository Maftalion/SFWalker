'use strict';
/* eslint no-console: 0 */

import React, { Component } from 'react';
import Mapbox, { MapView } from 'react-native-mapbox-gl';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
} from 'react-native';
import Button from 'react-native-button';
import convertGPS from './src/api';
import io from './socket.io'

var socket = io('http://localhost:3000', { transports: ['websocket'] } );

const accessToken = 'pk.eyJ1IjoibWFmdGFsaW9uIiwiYSI6ImNpcmllbXViZDAyMTZnYm5yaXpnMjByMTkifQ.rSrkLVyRbL3c8W1Nm2_6kA';
Mapbox.setAccessToken(accessToken);

class MapExample extends Component {

  state = {
    center: {
      latitude: 37.7836925,
      longitude: -122.4111781
    },
    zoom: 14,
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
        responseJson.short.forEach((el) => {
          [el[0], el[1]] = [el[1], el[0]];
        });
        responseJson.safe.forEach((el) => {
          [el[0], el[1]] = [el[1], el[0]];
        });

        var annotations = this.state.annotations.slice();
        var index = undefined;
        annotations.forEach((feature, i) => {
          if (feature.id === 'shortRoute') {
            index = i;
          }
        });

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
          var nodes = this.state.short.concat(this.state.safe, [this.state.start, this.state.dest]);
          var latSW = nodes[0][0]; var latNE = nodes[0][0]; var lonSW = nodes[0][1]; var lonNE = nodes[0][1];

          nodes.forEach(function(node) {
            if (node[0] > latNE) { latNE = node[0]; }
            if (node[0] < latSW) { latSW = node[0]; }
            if (node[1] > lonNE) { lonNE = node[1]; }
            if (node[1] < lonSW) { lonSW = node[1]; }
          });

          var spanLat = latNE - latSW;
          var spanLon = lonNE - lonSW;

          this._map.setVisibleCoordinateBounds(
            latSW - 0.1 * spanLat,
            lonSW - 0.1 * spanLon,
            latNE + 0.1 * spanLat,
            lonNE + 0.1 * spanLon
          );
        });
      });
    }
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

    

    //initialize colored paths on map
    var mainComponent = this;
    fetch('http://localhost:3000/allstreets')
      .then((response) => response.json())
      .then((responseJson) => {

        mainComponent.setState({ annotations: responseJson });

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
        <View style={styles.container}>
          <MapView
            ref={map => { this._map = map }}
            style={styles.map}
            initialCenterCoordinate={this.state.center}
            initialZoomLevel={this.state.zoom}
            initialDirection={0}
            rotateEnabled={true}
            scrollEnabled={true}
            zoomEnabled={true}
            logoIsHidden={true}
            showsUserLocation={true}
            userTrackingMode={this.state.userTrackingMode}
            annotations={this.state.annotations}
            onChangeUserTrackingMode={this.onChangeUserTrackingMode}
            onRegionDidChange={this.onRegionDidChange}
            />
          <View>
            <View>
              <Text style={styles.topMargin} />
            </View>
            <View style={styles.textContainer}>
              <TextInput
              onSubmitEditing={(event) => this.handleStart(event.nativeEvent.text) }
                style={styles.textInput}
                placeholder="Enter current location"
                placeholderTextColor="black"
                />
                <TextInput
                onSubmitEditing={(event) => this.handleDest(event.nativeEvent.text)}
                  style={styles.textInput}
                  placeholder="Enter Destination"
                  placeholderTextColor="black"
                  />
            </View>
            <View style={styles.buttonContainer}>
              <Button>
              <Image style={styles.button} source={require('./assets/walk.gif')}/>
              </Button>
              <Button>
              <Image style={styles.button} source={require('./assets/bike.gif')}/>
              </Button>
              <Button>
              <Image style={styles.button} source={require('./assets/taxi.gif')}/>
              </Button>
            </View>
          </View>
          <View style={styles.reportButton}>
            <Button>
            <Image style={styles.reportImage} source={require('./assets/danger.gif')}/>
            </Button>
          </View>
        </View>
    );
  }
}

const styles = StyleSheet.create({
  reportImage: {
    width: 50,
    height: 50,
    margin: 2
  },
  reportButton: {
    position: 'absolute',
    bottom: 0,
    right: 0
  },
  button: {
    width: 40,
    height: 40,
    margin: 5
  },
  buttonContainer: {
    justifyContent: 'space-around',
    flexDirection: 'row'
  },
  textContainer: {
    marginHorizontal: 5
  },
  topMargin: {
    height: 20
  },
  textInput: {
    height: 30,
    textAlign: 'center',
    borderColor: 'grey',
    borderWidth: 1,
    borderRadius: 15,
    marginHorizontal: 8,
    marginTop: 2,
    backgroundColor: '#d3d3d3',
    opacity: .7
  },
  container: {
    flex: 1,
    alignItems: 'stretch'
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  }
});

AppRegistry.registerComponent('whimsicleBugle', () => MapExample);
