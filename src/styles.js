'use strict'
import {StyleSheet} from 'react-native';

module.export = StyleSheet.create({
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
