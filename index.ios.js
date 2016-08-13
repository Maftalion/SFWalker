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
  Image,
  TextInput,
} from 'react-native';
import Button from 'react-native-button';
import convertGPS from './src/api';

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
        this.setState({
          annotations: this.state.annotations.concat([{
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
        })
        this._map.setCenterCoordinateZoomLevel(data.lat, data.lon, 15, true);
      });
  };

  handleDest = (input) => {
    convertGPS(input)
      .then((data) => {
        this.setState({
          annotations: this.state.annotations.concat([{
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
        })
        this._map.setCenterCoordinateZoomLevel(data.lat, data.lon, 15, true);
      });
  };

  onRegionDidChange = (location) => {
    this.setState({ currentZoom: location.zoomLevel });
    console.log('onRegionDidChange', location);
  };
  onChangeUserTrackingMode = (userTrackingMode) => {
    this.setState({ userTrackingMode });
    console.log('onChangeUserTrackingMode', userTrackingMode);
  };

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
        <View style={styles.container}>
          <View style={{flex: 1}} />
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
          <View style={{justifyContent: 'space-around', flexDirection: 'row', backgroundColor: 'black'}}>
            <Button>
            <Image style={{width: 40, height: 40, margin: 5}} source={require('./assets/walk.gif')}/>
            </Button>
            <Button>
            <Image style={{width: 40, height: 40, margin: 5, opacity: 0.5}} source={require('./assets/bike.gif')}/>
            </Button>
            <Button>
            <Image style={{width: 40, height: 40, margin: 5, opacity: 0.5}} source={require('./assets/taxi.gif')}/>
            </Button>
          </View>
          <View>
            <TextInput
              style={styles.textInput}
              placeholder="Enter current location"
              />
              <TextInput
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
    flex: 30
  },
  scrollView: {
    flex: 1
  }
});

AppRegistry.registerComponent('whimsicleBugle', () => MapExample);
