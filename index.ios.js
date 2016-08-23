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
  ScrollView,
  TextInput,
  TouchableWithoutFeedback
} from 'react-native';
import Button from 'react-native-button';
import convertGPS from './src/api';
import io from 'socket.io-client/socket.io'
import Buttons from './src/components/buttons'
import { RadioButtons } from 'react-native-radio-buttons'

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
    annotations: [],
    view: 1
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
          startAddress: input,
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
          destAddress: input,
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

  handleReport = () => {
    let annotations = this.state.annotations;
    let center = this.state.center;
    this.setState({
      view: 2,
      annotations: annotations.concat([{
        type: 'point',
        id: 'report',
        coordinates: [center.latitude, center.longitude],
        annotationImage: {
          source: { uri: 'https://cldup.com/7NLZklp8zS.png' },
          height: 25,
          width: 25
        }
      }])
    })
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
        console.log('responseJSON', responseJson);
        responseJson.short.forEach((el) => {
          [el[0], el[1]] = [el[1], el[0]];
        });
        responseJson.safe.forEach((el) => {
          [el[0], el[1]] = [el[1], el[0]];
        });

        var annotations = this.state.annotations.slice();
        var index = undefined;
        annotations.forEach((feature, i) => {
          if (feature.id === 'shortRoute' || feature.id === 'safeRoute') {
            index = i;
          }
        });

        if (index) {
          annotations.splice(index - 1, 2);
        }

        this.setState({
          view: 4,
          selectedRoute: undefined,
          short: responseJson.short,
          shortDist: responseJson.shortDist,
          shortDanger: responseJson.shortDanger,
          safe: responseJson.safe,
          safeDist: responseJson.safeDist,
          safeDanger: responseJson.safeDanger,
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

  returnToMap = () => {
    console.log('returning');
    this.setState({
      view: 1
    })
  }

  onRegionDidChange = (location) => {
    this.setState({
      currentZoom: location.zoomLevel,
      center: {
        latitude: location.latitude,
        longitude: location.longitude
      }
     });
    if (this.state.view === 2) {
      this.setState({
        annotations: this.state.annotations.concat([{
          type: 'point',
          id: 'report',
          coordinates: [location.latitude, location.longitude],
          annotationImage: {
            source: { uri: 'https://cldup.com/7NLZklp8zS.png' },
            height: 25,
            width: 25
          }
        }])
      });
    }
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
   const mainComponent = this;

   socket.on('appendReport', function(event) {

    console.log(event.latitude, event.longitude);
    mainComponent.setState({
       annotations: [...mainComponent.state.annotations, {
         type: 'point',
         id: `report:${event.id}`,
         coordinates: [event.latitude, event.longitude],
         annotationImage: {
           source: { uri: 'https://cldup.com/7NLZklp8zS.png' },
           height: 25,
           width: 25
         }
       }]
     });
     console.log('append incident to map', event);
   });

    //fetch street colors
    fetch('http://localhost:3000/allstreets')
      .then((response) => response.json())
      .then((responseJson) => {

        mainComponent.setState({ annotations: responseJson });

      })
      .catch((error) => {
        console.error(error);
      });

      //fetch last 24-hours of reported incidents
      fetch('http://localhost:3000/incidents')
      .then((response) => response.json())
      .then((responseJson) => {

        mainComponent.setState({
           annotations: mainComponent.state.annotations.concat(responseJson)
         });

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

  showNav() {
    if (this.state.view === 1) {
      return (
        <View>
        <TextInput
          onSubmitEditing={(event) => this.handleStart(event.nativeEvent.text) }
          style={styles.textInput}
          placeholder="Enter current location"
          placeholderTextColor="black"
          defaultValue={this.state.startAddress ? this.state.startAddress : ''}
          />
        <TextInput
          onSubmitEditing={(event) => this.handleDest(event.nativeEvent.text)}
          style={styles.textInput}
          placeholder="Enter Destination"
          placeholderTextColor="black"
          defaultValue={this.state.destAddress ? this.state.destAddress : ''}
          />
        </View>
      )
    }
  }
  renderCheckList() {
    if (this.state.view === 3) {
      const options = [
        'Theft',
        'Public Disturbance',
        'Assault/Battery',
        'Drunkenness/Drug Use',
        'Sex Offense',
        'Suspicious Behavior'
      ];
      function setSelectedOption(checkListOption){
        this.setState({
          checkListOption,
        });
      }
      function renderOption( option, selected, onSelect, index) {

        const textStyle = {
          paddingTop: 10,
          paddingBottom: 10,
          color: 'black',
          flex: 1,
          fontSize: 14,
        };
        const baseStyle = {
          flexDirection: 'row',
        };
        var style;
        var checkMark;

        if (index > 0) {
          style = [baseStyle, {
            borderTopColor: '#eeeeee',
            borderTopWidth: 1,
          }];
        } else {
          style = baseStyle;
        }

        if (selected) {
          checkMark = <Text style={{
            flex: 0.1,
            color: '#007AFF',
            fontWeight: 'bold',
            paddingTop: 8,
            fontSize: 20,
            alignSelf: 'center',
          }}>✓</Text>
        }

        return (
          <TouchableWithoutFeedback onPress={onSelect} key={index}>
          <View style={style}>
          <Text style={textStyle}>{option}</Text>
          {checkMark}
          </View>
          </TouchableWithoutFeedback>
        )
      }

      function renderContainer(options){
        return (
          <View style={{
            backgroundColor: 'white',
            paddingLeft: 20,
            borderTopWidth: 1,
            borderTopColor: '#cccccc',
            borderBottomWidth: 1,
            borderBottomColor: '#cccccc'
          }}>
          {options}
          </View>
        )
      }

      return (
        <View style={{flex: 1}}>
        <View style={{marginTop: 10, backgroundColor: 'white'}}>
        <Text style={{padding: 20, fontWeight:'bold', textAlign:'center'}}>Report Incident</Text>

        <View style={{
          backgroundColor: '#eeeeee',
          paddingTop: 5,
          paddingBottom: 5,
        }}>
        <Text style={{
          color: '#555555',
          paddingLeft: 20,
          marginBottom: 5,
          marginTop: 5,
          fontSize: 12,
          textAlign: 'center'
        }}>Categories</Text>
        <RadioButtons
        options={ options }
        onSelection={ setSelectedOption.bind(this) }
        selectedOption={ this.state.checkListOption }
        renderOption={ renderOption }
        renderContainer={ renderContainer }
        />
        </View>
        <Text style={{
          margin: 20, textAlign: 'center'
        }}>Selected: {this.state.checkListOption || 'none'}</Text>
        </View>
        <View style={[styles.bubble, {margin: 10}]}>
          <Button
          style={{textAlign: 'center'}}
          onPress={()=> this.submitIncident()}>
            Submit
          </Button>
        </View>
        </View>
      )
    }
  }

  submitIncident() {
    this.setState({view: 1})
    console.log('incident sent to backend')
    socket.emit('report', {
      category: this.state.checkListOption, 
      coords: [this.state.center.latitude, this.state.center.longitude]
    });
  }

  showButtons() {
    if (this.state.view === 1) {
      return <Buttons />
    }
  }

  showReportUI() {
    if (this.state.view === 2) {
      return (
        <View style={styles.buttonContainer}>
          <View style={styles.bubble}>
            <Button
            style={{textAlign: 'center'}}
            onPress={()=> this.reportIncindent()}>
              Report an incident
            </Button>
          </View>
        </View>
      )
    }
  }

  reportIncindent() {
    const center = this.state.center
    this.setState({view: 3})
  }

  showReportButton() {
    if (this.state.view === 1) {
      return (
        <Button
          onPress={()=> this.handleReport()}>
            <Image style={styles.reportImage} source={require('./src/assets/danger.gif')} />
        </Button>
      )
    }
  }

  renderRoutesList() {
    if (this.state.view === 4) {
      function setSelectedOption(selectedRoute) {
        // this.setState({
        //   selectedRoute: selectedRoute
        // });

        console.log('selectedRoute', typeof selectedRoute);
        var selected = JSON.parse(selectedRoute)[0];

        var annotations = this.state.annotations.slice();
        var indexShort = undefined;
        var index
        annotations.forEach((feature, i) => {
          if (feature.id === 'shortRoute' || feature.id === 'safeRoute') {
            index = i;
          }
        });

        if (index) {
          var old = annotations.splice(index - 1, 2);
        }
        console.log('old', old);

        // Have selected be drawn on top of unselected
        if ((selected === 'Short' && old[1].id === 'safeRoute') || (selected === 'Safe' && old[1].id === 'shortRoute')) {
          [old[0], old[1]] = [old[1], old[0]];
        }

        old[0].strokeWidth = 5;
        old[0].strokeAlpha = 0.7;
        old[1].strokeWidth = 8;
        old[1].strokeAlpha = 1;

        this.setState({
          view: 4,
          selectedRoute: selectedRoute,
          annotations: annotations.concat(old)
        });
      }

      function renderOption(option, selected, onSelect, index) {
        console.log('option', option);
        console.log('selected', selected, 'onSelect', onSelect, 'index', index);
        var route = JSON.parse(option);

        const textStyle = {
          paddingTop: 10,
          paddingBottom: 10,
          color: route[0] === 'Safe' ? '#5DADE2' : '#28B463',
          flex: 0.2,
          fontSize: 14,
          fontWeight: selected ? 'bold' : 'normal'
        };
        const baseStyle = {
          flexDirection: 'row',
          backgroundColor: 'white'
        };
        var style;
        // var checkMark;

        if (index > 0) {
          style = [baseStyle, {
            borderTopColor: '#eeeeee',
            borderTopWidth: 1,
          }];
        } else {
          style = baseStyle;
        }

        // if (selected) {
        //   checkMark = <Text style={{
        //     flex: 0.1,
        //     color: '#007AFF',
        //     fontWeight: 'bold',
        //     paddingTop: 8,
        //     fontSize: 20,
        //     alignSelf: 'center',
        //   }}>✓</Text>
        // }

        return (
          <TouchableWithoutFeedback onPress={onSelect} key={index}>
            <View style={style}>
              <Text style={textStyle}>{route[0] + '  \t\t'} Distance: {(route[2] / 1000).toFixed(1) + ' km    \t'} Danger: {route[3].toFixed(2)}</Text>
            </View>
          </TouchableWithoutFeedback>
        )
      }

      function renderContainer(options){
        return (
          <View style={{
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'stretch',
            backgroundColor: 'white',
            paddingLeft: 20,
            borderTopWidth: 1,
            borderTopColor: '#cccccc',
            borderBottomWidth: 1,
            borderBottomColor: '#cccccc'
          }}>
          {options}
          </View>
        )
      }

      return (
        <View style={{flex: 1}}>
          <View>
            <View style={{
              // backgroundColor: '#eeeeee',
              backgroundColor: 'rgba(238,238,238,0.8)',
              // backgroundColor: 'rgba(255,0,0,0.4)',
              paddingTop: 0,
              paddingBottom: 0,
            }}>
            <Text style={{
              color: '#555555',
              paddingBottom: 5,
              paddingTop: 5,
              fontSize: 12,
              textAlign: 'center',
              fontWeight: 'bold'
            }}>Select Route</Text>
            <RadioButtons
            options={ [
              JSON.stringify(['Safe', this.state.safe, this.state.safeDist, this.state.safeDanger]),
              JSON.stringify(['Short', this.state.short, this.state.shortDist, this.state.shortDanger])
            ] }
            onSelection={ setSelectedOption.bind(this) }
            selectedOption={ this.state.selectedRoute }
            renderOption={ renderOption }
            renderContainer={ renderContainer }
            />
            </View>
            <TouchableWithoutFeedback onPress={this.returnToMap}>
              <View style={{backgroundColor: 'rgba(238,238,238,0.8)'}}>
                <Text style={{
                  color: '#b10026',
                  textAlign: 'center',
                  paddingTop: 3,
                  paddingBottom: 3
                }}>Close</Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
      )
    }
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
                {this.showNav()}
                {this.showReportUI()}
                <View style={{opacity: 0.9}}>
                  <ScrollView style={{backgroundColor: '#eeeeee'}}>
                    {this.renderCheckList()}
                  </ScrollView>
                </View>
              </View>
              {this.showButtons()}
          </View>
          <View>
            <ScrollView>
              {this.renderRoutesList()}
            </ScrollView>
          </View>
          <View style={styles.reportButton}>
            {this.showReportButton()}
          </View>
        </View>
    )
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
  },
  buttonContainer: {
    position:'absolute',
    left: 5,
    right: 5,
    top: 500,
    flexDirection: 'row',
    marginVertical: 20,
    backgroundColor: 'transparent',
  },
  bubble: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
  }
});

AppRegistry.registerComponent('whimsicleBugle', () => MapExample);
