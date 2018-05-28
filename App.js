'use strict';

import React, { Component } from 'react';
import {
  StyleSheet,
  NavigatorIOS,
  Button
} from 'react-native';
import { createStackNavigator } from 'react-navigation';

import LoginPage from './LoginPage';
import Clockin from './Clockin';
import ProjectPage from './ProjectPage';

const RootStack = createStackNavigator(
  {
    Login: LoginPage,
    Clockin: Clockin,
    Project: ProjectPage
  },
  {
    initialRouteName: 'Login',
  }
);
export default class App extends React.Component {
  render() {
    return <RootStack />;
  }
}
