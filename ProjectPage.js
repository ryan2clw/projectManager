'use strict';

import React, { Component } from 'react'
import {
  StyleSheet,
  Image,
  View,
  TouchableHighlight,
  FlatList,
  Text,
  Picker,
  ActivityIndicator,
  AsyncStorage
} from 'react-native';
import Button from 'apsl-react-native-button';
import Swipeable from 'react-native-swipeable-row';

class ListItem extends React.PureComponent {

  constructor(props){
    super(props);
    this.state = ({
      name : JSON.parse(this.props.item).name,
      members: JSON.parse(this.props.item).members,
      lineLength: (JSON.parse(this.props.item).members).length,
      owner: JSON.parse(this.props.item).owner});
    this.lineLength = this.state.lineLength;
    AsyncStorage.getItem("username").then(username => this.setState({"username": username}))
  };
  _onPress = (isOwner) => {
    this.props.onPressItem(this.props.index);
    if(this.state.owner.username == this.state.username){
        alert("OWNER");
    }else{
        alert("NOT");
    }
  };
  render() {
    const lineLength = 4+this.lineLength*23;
    const members = this.state.members.map((member)=>{return member.username + ", "});
    var rightButtons = [];
    if (this.state.owner.username == this.state.username){
        rightButtons = [
        <View style={{width:80}}>
        <Button 
            style={{backgroundColor: 'red', borderRadius:0, borderColor: "red", height: lineLength}}
            textStyle={{fontSize: 18, color: 'white', fontWeight: 'bold'}}
            onPress={this._onPress}
            >Delete
          </Button>
        </View>];
    }else{
        rightButtons = [
        <View style={{width:80}}>
        <Button 
            style={{backgroundColor: '#FFBB00', borderRadius:0, borderColor: "#FFBB00", height: lineLength}}
            textStyle={{fontSize: 18, color: 'black', fontWeight: 'bold'}}
            onPress={this._onPress}
            >Quit
          </Button>
        </View>];
    }
    return (
      <Swipeable 
        rightButtons={rightButtons}>
        <View style={styles.textContainer}>
         <Text style={styles.labels}>{this.state.name}</Text>
         <Text style={styles.items}>{members}</Text>
        </View>
        <View style={styles.separator}></View>
      </Swipeable>);
  }
}
export default class ProjectPage extends Component<{}> {

constructor(props) {
  super(props);
  this.state = {
    isLoading: false ,
    username: ""
  };
 }
  static navigationOptions = ({navigation}) => ({
    title: "Projects",
  });
  componentDidMount(){
    AsyncStorage.getItem("first_name").then(first_name => this.setState({"first_name": first_name})).done();
    AsyncStorage.getItem("username")
    .then(username => this.setState({"username": username}))
    .then(this._getProjects)  // must set username first
    .then(this._getUsers)
    .done();
  }

  _keyExtractor = (item, index) => String(index);

  _renderItem = ({item, index }) => (
    
    <ListItem
      item={JSON.stringify(item)}
      index={index}
      onPressItem={this._onPressItem}/>
  );
  _onPressItem = (index => console.log("Pressed row: " + index));
  _getProjects = () => {
    var myUrl = 'https://seniordevops.com/project/list/?username=' + this.state.username;
    fetch(myUrl, {
      method: 'GET',
      headers: this.headers(),
      credentials: 'include',
    })
    .then(response => response.json())
    .then(responseJson => this.setState({ projects: responseJson }))
    .catch(error =>
      this.setState({
        isLoading: false,
        message: 'Something bad happened ' + error,
    }));
  };
  _getUsers = () => {
    var myUrl = 'https://seniordevops.com/project/members/?username=ryan.dines%40gmail.com';
    fetch(myUrl, {
      method: 'GET',
      headers: this.headers(),
      credentials: 'include',
    })
    .then(response => response.json())
    .then((responseJson)=>{
        this.setState({members:responseJson});
        })
    .catch(error =>
      this.setState({
        isLoading: false,
        message: 'Something bad happened ' + error,
    }));
  };
  _newProject = () => {
    var myUrl = 'https://seniordevops.com/project/members/?username=ryan.dines%40gmail.com';
    fetch(myUrl, {
      method: 'GET',
      headers: this.headers(),
      credentials: 'include'})
    .then(response => response.json())
    .then(responseJson => this.setState({members:responseJson}))
    .catch(error =>
      this.setState({
        isLoading: false,
        message: 'Something bad happened ' + error,
    }));
  };
  _deleteProject = () => {
      alert("DELETE PROJECT");
  };
  renderHeader = () => {
    return (
      <View style={styles.header}>
        <Text style={styles.title}>Project</Text>
        <Text style={styles.title}>Members</Text>
      </View>
    )
  };
  headers(){
    var base64 = require('base-64');
    var utf8 = require('utf8');
    var text = 'ryan.dines@gmail.com:Rfd362436!';
    var bytes = utf8.encode(text);
    var encoded = 'Basic '+ base64.encode(bytes);
    return {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Authorization': encoded, 
          };
  };

  render() {
    const spinner = this.state.isLoading ?
      <ActivityIndicator size='large'/> : null;
    return (
      <View style={{flex:1}}>
        <View style={{flexDirection: "row", justifyContent:"space-evenly"}}>
          <Text style={styles.welcome}>Hi, {this.state.first_name}</Text>
          <Image source={require('./Resources/seniorDevops2.png')} style={styles.thumb}/>
          <Picker
            selectedValue={this.state.currentProject} // MUST SET STATE 
            onValueChange={(itemValue, itemIndex) => {
              alert("Switching to " + itemValue);
              this.setState({ currentProject: itemValue});
            }}style={styles.picker}>
            <Picker.Item label="All" value="all" />
            { // I FUCKING LOVE TERNARIES:   ifProjectsExists ? mapTheirValues : justChillWithNull
              this.state.projects ?  
                this.state.projects.map((myProject) => {
                    return (<Picker.Item 
                        label={myProject.name} 
                        value={myProject.id}
                        key={myProject.id}
                    />)}
              ) : null}
          </Picker>
        </View>
        {spinner}        
        <FlatList
          data={this.state.members} /* initial property set by previous view controller */
          keyExtractor={this._keyExtractor}
          renderItem={this._renderItem}
          ListHeaderComponent={this.renderHeader}
        />
        <Text style={styles.clockinStatus}>{this.state.clockedIn}</Text>
        <View style={{flex:1, marginTop: 0, flexDirection: "row", justifyContent: 'space-evenly' }}>
          <Button 
            style={{backgroundColor: '#3371FF', width:300, height: 51, borderRadius: 30}} 
            textStyle={{fontSize: 18, color: 'white', fontWeight: 'bold' }}
            onPress={this._newProject}
            >New Project
          </Button>
        </View>
      </View>
    );
  }
}
const styles = StyleSheet.create({
  welcome: {
    fontSize: 24,
    height: 155,
    margin:15,
    textAlign: 'center',
  },
  thumb: {
    width: 80,
    height: 80,
    marginRight: 10,},
  header: {
    flex: 1, flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#D3D3D3',
    justifyContent: 'space-around',},
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex:0.45,
    color: '#3371FF',},
  rowContainer: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center'},
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',},
  labels: {
    fontSize: 20,
    color: 'black',},
  separator: {
    height: 1,
    backgroundColor: '#dddddd'},
  clockinStatus: {
    fontSize: 22,
    flex: 0.5, 
    margin: 0,
    alignSelf: 'stretch',
    textAlign: 'center'},
  clockinButton: {
    color: "#FFFFFF",},
  picker: {
    height: 50, 
    width: 100, 
    marginTop: -30,},
  deleteButton: {
    flexDirection: "column",
    flex:1,
    justifyContent:"center",
    backgroundColor: "red",},
  items: {
    fontSize: 20,
    color: 'black',
    marginLeft: 20,
    justifyContent: 'flex-start',
    width: 220}
});