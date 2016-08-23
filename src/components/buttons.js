import React,{ Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';
import Button from 'react-native-button';

export default class Buttons extends Component {
  render() {
    return(
      <View style={styles.buttonContainer}>
        <Button>
        <Image style={styles.button} source={require('./../assets/walk.gif')}/>
        </Button>
        <Button>
        <Image style={[styles.button, {opacity: .5}]} source={require('./../assets/bike.gif')}/>
        </Button>
        <Button onPress={() => this.props.handleUber()}>
        <Image style={[styles.button, {opacity: .5}]} source={require('./../assets/taxi.gif')}/>
        </Button>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    margin: 5
  },
  buttonContainer: {
    justifyContent: 'space-around',
    flexDirection: 'row'
  }
})
