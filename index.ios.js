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
  TouchableWithoutFeedback,
  Modal
} from 'react-native';
import Button from 'react-native-button';
import convertGPS from './src/api';

import io from 'socket.io-client/socket.io';
import Buttons from './src/components/buttons';
import { RadioButtons } from 'react-native-radio-buttons';
import Sound from 'react-native-sound';

var socket = io('https://sfwalker.herokuapp.com', { transports: ['websocket'] } );

const accessToken = 'pk.eyJ1IjoibWFmdGFsaW9uIiwiYSI6ImNpcmllbXViZDAyMTZnYm5yaXpnMjByMTkifQ.rSrkLVyRbL3c8W1Nm2_6kA';
Mapbox.setAccessToken(accessToken);

class MapExample extends Component {

  state = {
    uber: {
      time: '',
      price: ''
    },
    center: {
      latitude: 37.7836925,
      longitude: -122.4111781
    },
    zoom: 14,
    userTrackingMode: Mapbox.userTrackingMode.follow,
    annotations: [],
    view: 1,
    reportModalVisible: false
  };

  setReportModalVisible(visible) {
    this.setState({reportModalVisible: visible});
  }

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
        id: 'newReportPointer',
        coordinates: [center.latitude, center.longitude]
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
        responseJson.short.forEach((el) => {
          [el[0], el[1]] = [el[1], el[0]];
        });
        responseJson.safe.forEach((el) => {
          [el[0], el[1]] = [el[1], el[0]];
        });
        responseJson.ptShort.forEach((el) => {
          [el[0], el[1]] = [el[1], el[0]];
        });
        responseJson.ptSafe.forEach((el) => {
          [el[0], el[1]] = [el[1], el[0]];
        });

        var annotations = this.state.annotations.slice();
        var index = undefined;
        annotations.forEach((feature, i) => {
          if (feature.id === 'shortRoute' || feature.id === 'safeRoute' || feature.id === 'ptShortRoute' || feature.id === 'ptSafeRoute') {
            index = i;
          }
        });

        if (index) {
          annotations.splice((this.state.pt ? index - 3 : index - 1), (this.state.pt ? 4 : 2));
        }

        var ptDiff = responseJson.shortDist !== responseJson.ptShortDist ||
                     responseJson.shortDanger !== responseJson.ptShortDanger ||
                     responseJson.safeDist !== responseJson.ptSafeDist ||
                     responseJson.safeDanger !== responseJson.ptSafeDanger;

        this.setState({
          view: 4,
          selectedRoute: undefined,
          pt: ptDiff,
          short: responseJson.short,
          shortDist: responseJson.shortDist,
          shortDanger: responseJson.shortDanger,
          safe: responseJson.safe,
          safeDist: responseJson.safeDist,
          safeDanger: responseJson.safeDanger,
          ptShort: ptDiff ? responseJson.ptShort : undefined,
          ptShortDist: ptDiff ? responseJson.ptShortDist : undefined,
          ptShortDanger: ptDiff ? responseJson.ptShortDanger : undefined,
          ptShortInstructions: ptDiff ? responseJson.ptShortInstructions : undefined,
          ptSafe: ptDiff ? responseJson.ptSafe : undefined,
          ptSafeDist: ptDiff ? responseJson.ptSafeDist : undefined,
          ptSafeDanger: ptDiff ? responseJson.ptSafeDanger : undefined,
          ptSafeInstructions: ptDiff ? responseJson.ptSafeInstructions : undefined,
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
          }]).concat(ptDiff ? [{
            coordinates: responseJson.ptShort,
            type: 'polyline',
            strokeColor: '#2A0CEA',
            strokeWidth: 5,
            strokeAlpha: 0.7,
            id: 'ptShortRoute'
          }, {
            coordinates: responseJson.ptSafe,
            type: 'polyline',
            strokeColor: '#B428A1',
            strokeWidth: 5,
            strokeAlpha: 0.7,
            id: 'ptSafeRoute'
          }] : [])
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

          console.log('ptdiff', this.state);
        });
      });
    }
  }

  calculateFromCurrentLocation = () => {
    this.setReportModalVisible(false);
    navigator.geolocation.getCurrentPosition((position) => {
      fetch('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + position.coords.latitude + ',' + position.coords.longitude + '&key=AIzaSyB_qAJhc4T9bjShAitFLJlm7_8RvO5qooM')
      .then((response) => response.json())
      .then((responseJson) => {
        this.setState({
          startAddress: responseJson.results[0].formatted_address,
          start: [position.coords.latitude, position.coords.longitude]
        }, () => {
          this.handleStart(this.state.startAddress);
        });
      });
    });
  }

  returnToMap = () => {
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
          id: 'newReportPointer',
          coordinates: [location.latitude, location.longitude]
        }])
      });
    }
  }

  onChangeUserTrackingMode = (userTrackingMode) => {
    this.setState({ userTrackingMode });
  }

  componentDidMount() {
    const mainComponent = this;

    //initialize map to current position
    navigator.geolocation.getCurrentPosition((position) => {
      mainComponent.setState({ center: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
      });
    });

    var bugle = new Sound('bugle.mp3', Sound.MAIN_BUNDLE, (e) => {
      if (e) {
        console.log('error', e);
      } else {
        console.log('duration', bugle.getDuration());
        this.setState({ sound: bugle })
      }
    });

    socket.on('appendReport', function(event) {
      mainComponent.setState({
        annotations: [...mainComponent.state.annotations, {
          type: 'point',
          id: `report:${event.id}`,
          coordinates: [event.latitude, event.longitude],
          title: event.category,
          subtitle: event.datetime
        }]
      }, () => {
        if (mainComponent.state.safe) {
          fetch('http://localhost:3000/routes', {
            method: 'post',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              start: [mainComponent.state.start[1], mainComponent.state.start[0]],
              dest: [mainComponent.state.dest[1], mainComponent.state.dest[0]]
            })
          })
          .then((response) => response.json())
          .then((responseJson) => {
            var newSafe = responseJson.safe;
            newSafe.forEach((el) => {
              [el[0], el[1]] = [el[1], el[0]];
            });
            var deepEquals = mainComponent.state.safe.length === newSafe.length;
            if (deepEquals) {
              for (var i = 0; i < newSafe.length; i++) {
                if (newSafe[i][0] !== mainComponent.state.safe[i][0] || newSafe[i][1] !== mainComponent.state.safe[i][1]) {
                  deepEquals = false;
                }
              }
            }
            if (!deepEquals) {
              mainComponent.setReportModalVisible(true);
            }
          });
        }
      });
      console.log('append incident to map', event);
      mainComponent.state.sound.play();
    });

    //fetch street colors
    fetch('http://localhost:3000/allstreets')
    .then((response) => response.json())
    .then((responseJson) => {
      mainComponent.setState({ annotations: responseJson }, () => {
        // fetch last 24-hours of reported incidents
        fetch('http://localhost:3000/incidents')
        .then((response) => response.json())
        .then((responseJson) => {
          mainComponent.setState({
            annotations: mainComponent.state.annotations.concat(responseJson)
          });
        })
        .catch((error) => {
          console.error(error);
        })
      })
    })
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

  handleUber = () => {
    var comp = this;
  if (this.state.start && this.state.dest){
    fetch(`https://api.uber.com/v1/estimates/price?start_latitude=${this.state.start[0]}&start_longitude=${this.state.start[1]}&end_latitude=${this.state.dest[0]}&end_longitude=${this.state.dest[1]}&server_token=nP5afwPL5UTYxy39rQmVL8T0EKBEuVbhSUzQEnUt`)
    .then((response) => response.json())
    .then((uber) => {
      comp.setState({
        uber: {
          time: uber.prices[1].duration /60,
          price: uber.prices[1].estimate
        }
      })
    })
    .catch((error) => {
      console.error(error);
    });
  }
}

  submitIncident() {
    // this.setState({view: 1})
    socket.emit('report', {
      category: this.state.checkListOption,
      coords: [this.state.center.latitude, this.state.center.longitude]
    });
    var annotations = this.state.annotations.slice();
    for (var i = 0; i < annotations.length; i++) {
      if (annotations[i].id === 'newReportPointer') {
        annotations.splice(i, 1);
        i--;
      }
    }
    this.setState({
      view: 1,
      annotations: annotations
    });
  }

  // showButtons() {
  //   if (this.state.view === 1) {
  //     return (
  //       <Buttons/>
  //     )
  //   }
  // }

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
        // // this.setState({
        // //   selectedRoute: selectedRoute
        // // });

        // console.log('selectedRoute', typeof selectedRoute);
        // var selected = JSON.parse(selectedRoute)[0];

        // var annotations = this.state.annotations.slice();
        // var indexShort = undefined;
        // var index;
        // annotations.forEach((feature, i) => {
        //   if (feature.id === 'shortRoute' || feature.id === 'safeRoute' || feature.id === 'ptShortRoute' || feature.id === 'ptSafeRoute') {
        //     index = i;
        //   }
        // });

        // console.log(this.state.pt ? index - 3 : index - 1, this.state.pt ? 4 : 2);

        // if (index) {
        //   var old = annotations.splice((this.state.pt ? index - 3 : index - 1), (this.state.pt ? 4 : 2));
        //   // var old = annotations.splice(6834, 4)
        // }
        // console.log('old1', old);
        // const ids = {
        //   Short: 'shortRoute',
        //   Safe: 'safeRoute',
        //   PTShort: 'ptShortRoute',
        //   PTSafe: 'ptSafeRoute'
        // }

        // var last = old[old.length - 1] ? old.length - 1 : old.length - 2;

        // // Have selected be drawn on top of unselected
        // // if ((selected === 'Short' && old[1].id !== 'shortRoute') || (selected === 'Safe' && old[1].id !== 'shortRoute')) {
        // if (old[last].id !== ids[selected]) {
        //   var selectedIndex;
        //   for (var k = 0; k < old.length; k++) {
        //     if (old[k].id === selected) {
        //       selectedIndex = k;
        //     }
        //   }
        //   [old[k], old[last]] = [old[last], old[k]];
        // }

        // for (var k = 0; k < last; k++) {
        //   old[k].strokeWidth = 5;
        //   old[k].strokeAlpha = 0.7;
        // }
        // // old[0].strokeWidth = 5;
        // // old[0].strokeAlpha = 0.7;
        // console.log('old2', old);
        // old[last].strokeWidth = 8;
        // old[last].strokeAlpha = 1;

        // this.setState({
        //   view: 4,
        //   selectedRoute: selectedRoute,
        //   annotations: annotations.concat(old)
        // });
      }

      function renderOption(option, selected, onSelect, index) {
        var route = JSON.parse(option);

        const colors = {
          Safe: '#5DADE2',
          Short: '#28B463',
          PTSafe: '#B428A1',
          PTShort: '#2A0CEA',
        }

        const textStyle = {
          paddingTop: 10,
          paddingBottom: 10,
          color: colors[route[0]],
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

        return (
          <TouchableWithoutFeedback onPress={onSelect} key={index}>
            <View style={style}>
              <Text style={textStyle}>{route[0] + (route[0].length <= 5 ? '  \t\t' : '   \t')} Distance: {(route[2] / 1000).toFixed(1) + ' km    \t'} Danger: {route[3].toFixed(2) + '\n' + (route[4] ? route[4] : '')}</Text>
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
              backgroundColor: 'rgba(238,238,238,0.8)',
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
            ].concat(this.state.pt ? [
              JSON.stringify(['PTSafe', this.state.ptSafe, this.state.ptSafeDist, this.state.ptSafeDanger, this.state.ptSafeInstructions]),
              JSON.stringify(['PTShort', this.state.ptShort, this.state.ptShortDist, this.state.ptShortDanger, this.state.ptShortInstructions])
            ] : []) }
            onSelection={ setSelectedOption.bind(this) }
            selectedOption={ this.state.selectedRoute }
            renderOption={ renderOption }
            renderContainer={ renderContainer }
            />
            </View>
            <TouchableWithoutFeedback>
              <View>
                <Text>{'\t Uber' + '  \t'} Estimated Time: {this.state.uber.time + ' \t'} Price: {this.state.uber.price}</Text>
              </View>
            </TouchableWithoutFeedback>
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
    this.handleUber();
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
              <View style={{marginTop: 22}}>
                <Modal
                  animationType={'fade'}
                  transparent={true}
                  visible={this.state.reportModalVisible}
                  onRequestClose={this.closeReportModal}
                  >
                  <View style={{
                    flex: 1,
                    justifyContent: 'center',
                    padding: 20
                  }}>
                    <View style={{
                      alignItems: 'center',
                      backgroundColor: '#fff',
                      borderRadius: 10,
                      padding: 10,
                    }}>
                      <Text style={{
                        margin: 10
                      }}>
                        An incident has been reported on your route.
                      </Text>
                      <Button onPress={() => {
                          this.setReportModalVisible(false);
                          this.showRoutes();
                        }}
                        containerStyle={styles.modalButtonContainer}
                        style={styles.modalButton}
                        >
                        Recalculate with same endpoints
                      </Button>
                      <Button onPress={this.calculateFromCurrentLocation.bind(this)}
                        containerStyle={styles.modalButtonContainer}
                        style={styles.modalButton}
                        >
                        Recalculate from current location
                      </Button>
                      <Button onPress={this.setReportModalVisible.bind(this, false)}
                        containerStyle={styles.modalButtonContainer}
                        style={styles.modalButton}
                        >
                        Close
                      </Button>
                    </View>
                  </View>
                </Modal>
              </View>
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
    left: 160
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
    borderColor: 'lightgrey',
    borderWidth: 1,
    borderRadius: 15,
    marginHorizontal: 8,
    marginTop: 2,
    backgroundColor: 'rgba(255,255,255,0.7)',
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
  },
  modalButtonContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 2,
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: '#007aff'
  },
  modalButton: {
    color: 'white'
  }
});

AppRegistry.registerComponent('whimsicleBugle', () => MapExample);
