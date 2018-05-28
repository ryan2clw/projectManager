'use strict';

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Button,
  ActivityIndicator,
  Image,
} from 'react-native';
import Clockin from './Clockin';

export default class LoginPage extends Component<{}> {

  static navigationOptions = {
      headerStyle: {
        backgroundColor: '#3371FF',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
      headerRight: (
        <Button
          onPress={() => alert('This is a button!')}
          title="Projects"
          color="#fff"
        />
      )
  };

  constructor(props) {
    super(props);
    this.state = {
      workHours: [],
      isLoading: false,
      message: '',
      username: 'ryan.dines@gmail.com',
      password: 'Rfd362436!',
      token: '',
    };
  }
  componentDidMount() {
    this._getToken();
  }
  _headers(){
    var base64 = require('base-64');
    var utf8 = require('utf8');
    var text = this.state.username + ':' + this.state.password;
    var bytes = utf8.encode(text);
    var encoded = 'Basic '+ base64.encode(bytes);
    return {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Authorization': encoded, 
          };
  }
  _getToken = () => {
    fetch('https://seniordevops.com/api-token-auth/', {
        method: 'POST',
        headers: this._headers(),
        credentials: 'include',
        body: JSON.stringify({
            username: 'ryan.dines@gmail.com',
            password: 'Rfd362436!',
        }),
        dataType: "json",
      })
      .then(response => response.json())
      .then((responseJson) => {
        this.setState({ user_id : responseJson.user_id, 
                        token : responseJson.token
        });

      })
      .catch(error =>
        this.setState({
          isLoading: false,
          message: 'Something bad happened ' + error
      }));
  }

  _getHours = () => {
    this.setState({ isLoading: true });
    fetch('https://seniordevops.com/clockin/list/', {
        method: 'GET',
        headers: this._headers(),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(responseJson => {
      this.setState({ 
        isLoading: false , 
      });
      this.props.navigation.navigate('Clockin', { 
        intervals: responseJson, 
        username: this.state.username, 
        password: this.state.password, 
        user: this.state.user_id, 
        token: this.state.token
      });
      /*this.props.navigator.push({
        title: 'Work Hours',
        component: Clockin,
        passProps: {
          intervals: responseJson, 
          username: this.state.username, 
          password: this.state.password, 
          user: this.state.user_id, 
          token: this.state.token}
      });*/
    })
    .catch(error =>
      this.setState({
        isLoading: false,
        message: 'Something bad happened ' + error
    }));
  }
  static navigationOptions = {
    title: 'Login',
  };
  render() {
  	const spinner = this.state.isLoading ? <ActivityIndicator size='large'/> : null;
    return (
      <View style={styles.container}>
        <Text style={styles.description}>
          Please sign in
        </Text>
        <Image source={require('./Resources/seniorDevops2.png')} style={styles.image}/>
        {spinner}
        <View style={styles.flowRight}>
          <TextInput
            style={styles.searchInput}
            value={this.state.username}
            placeholder='Email address'
            onChangeText={(value) => this.setState({username: value})}/>
          <TextInput
            style={styles.searchInput}
            value={this.state.password}
            placeholder='Password'
            onChangeText={(value) => this.setState({password: value})}/>
          <Button
            onPress={this._getHours}
            color='#15b232'
            title='SIGN IN'
          />
        </View>
        <Text style={styles.description}>{this.state.message}</Text>
      </View>
    );
  }
}
const styles = StyleSheet.create({
  description: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: 28,
    textAlign: 'center',
    color: '#1081f2'
  },
  container: {
    padding: 30,
    marginTop: -25,
    alignItems: 'center'
  },
  flowRight: {
    flexDirection: 'column',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  searchInput: {
    height: 36,
    width: 240,
    padding: 4,
    marginBottom: 10,
    marginRight: 5,
    flexGrow: 1,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#1081f2',
    borderRadius: 8,
    color: '#1081f2',
    textAlign: 'center'
  },
  image: {
    width: 120,
    height: 120,
  },
});