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
  AsyncStorage,
  TextInput
} from 'react-native';
import Button from 'apsl-react-native-button';
import Swipeable from 'react-native-swipeable-row';

class ListItem extends React.PureComponent {

  constructor(props){
    super(props);
    this.state = ({
      item : this.props.item,
      lineLength: (JSON.parse(this.props.item).members).length});

    /* MARK TO DO: FIX HARD CODED NAME IN APP

    AsyncStorage.getItem("username").then((username) => {
      this.setState({"username": username});
    });*/
  };
 
  handleUserBeganScrollingParentView() {
    this.swipeable.recenter();
  }

  _onPress = () => {

    this.swipeable.recenter();
    if (JSON.parse(this.props.item).owner.username == "ryan.dines@gmail.com") {
      this.props.onPressItem(this.props.item, this.props.index, "DELETE");
    }else{
      this.props.onPressItem(this.props.item, this.props.index, "QUIT");
    }
  };
  
  render() {
    return (
      <Swipeable 
        onRef={ref => this.swipeable = ref}
        rightButtons={
          // I FUCKING LOVE TERNARIES:   ifOwnership ? DeleteMode : QuitMode
          (JSON.parse(this.props.item).owner.username == "ryan.dines@gmail.com") ? 
          ([
            <View style={{width:80}}>
            <Button 
              style={{
                backgroundColor: 'red',
                borderRadius:0, 
                borderColor: "red", 
                height: 1+this.state.lineLength*24
              }}
              textStyle={{
                fontSize: 18, 
                color: 'white', 
                fontWeight: 'bold'
              }}
              onPress={this._onPress}> Delete </Button>
            </View>]) : (
          [
            <View style={{width:80}}>
            <Button 
              style={{
                backgroundColor: '#FFBB00', 
                borderRadius:0, 
                borderColor: "#FFBB00", 
                height: 4+this.state.lineLength*23}}
              textStyle={{
                fontSize: 18, 
                color: 'black', 
                fontWeight: 'bold'}}
              onPress={this._onPress}> Quit </Button>
            </View>
          ])}>
        <View style={styles.textContainer}>
         <Text style={styles.labels}>{JSON.parse(this.props.item).name}</Text>
         <Text style={styles.items}>{ JSON.parse(this.props.item).members.map((member)=>{return member.username + ", "})}</Text>
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
    .then(username => this.setState({
        "username": username,
        "projectURL":"https://seniordevops.com/project/list/?username=" + username }))
    .then(this._getProjects)  // must set username first
    .then(this._getUsers)
    .done();
    this.setState({
      currentProjectName: "Projects Overview", 
      projectMode: true,
      currentProject: '{"name": "Projects Overview"}',
      textBox: 'New project name',
      buttonText: 'New Project'});
  }

  _keyExtractor = (item, index) => String(index);

  _renderItem = ({item, index }) => (
    
    <ListItem
      item={JSON.stringify(item)}
      index={index}
      onPressItem={this._onPressItem}/>
  );
  /* List item props passed here 
     Deletes or Quits Project and then makes API calls to update UI */
  _onPressItem = ((item, index, buttonType) => {
    if(buttonType == "DELETE"){
      const deleteURL = "https://seniordevops.com/project/delete/" + JSON.parse(item).name + "/";
      fetch(deleteURL, {
        method: 'DELETE',
        headers: this.headers(),
        credentials: 'include',
      })
      .then(()=>{
        this._getProjects();
        this._getUsers();
      })  // reload picker and table after deletion
      .catch( (error) => {alert(JSON.stringify(error))});
    }else{
      var myProjects = {};
      this.state.projects.forEach(function(project){
          myProjects[project.name] = project.id;
      });
      delete(myProjects[JSON.parse(item).name]);
      var projectList = Object.values(myProjects);
      this.updateProjectSet(projectList, this.state.username);
    }
  });
  _getProjects = () => {
    fetch(this.state.projectURL, {
      method: 'GET',
      headers: this.headers(),
      credentials: 'include',
    })
    .then(response => response.json())
    .then((responseJson) => {this.setState({ projects: responseJson });})
    .catch( (error) => {alert(JSON.stringify(error))});
  };
  _getUsers = () => {
    this.setState({isLoading: true});
    var myUrl = 'https://seniordevops.com/project/members/?username=ryan.dines%40gmail.com';
    fetch(myUrl, {
      method: 'GET',
      headers: this.headers(),
      credentials: 'include',
    })
    .then(response => response.json())
    .then((responseJson)=>{
      this.setState({
        members:responseJson,
        isLoading:false});
      })
    .catch( (error) => {
      this.setState({members:[],isLoading:false});
    });
  };
  _newProject = () => {
    if(this.state.projectMode){
      var myUrl = 'https://seniordevops.com/project/new/';
      AsyncStorage.getItem("user")
      .then(user => {
        this.setState({user: user});
        var data = JSON.stringify({
          "owner": Number(user), 
          "name": this.state.newItem
          });
        fetch(myUrl, {
          method: 'POST',
          headers: this.headers(),
          credentials: 'include',
          body: data,
          dataType: "json",
          })
        .then(response => response.json())
        .then(responseJson => {
          var projectList = this.state.projects.map((project)=>{ return project.id });
          projectList.push(responseJson.id);
          this.updateProjectSet(projectList, this.state.username);
        })
        .then(()=>{this.setState({newItem: ""})})
        .catch( (error) => {alert(JSON.stringify(error))});
      })
    }else{
      this.setState({isLoading: true});
      var myURL = "https://seniordevops.com/project/list/?username=" + encodeURIComponent(this.state.newItem);
      fetch(myURL, {
      method: 'GET',
      headers: this.headers(),
      credentials: 'include',
      })
      .then(response => response.json())
      .then((responseJson) => {
        var myProjects = [];
        responseJson.forEach(function(project){
            myProjects.push(project.id);
        });
        myProjects.push(this.state.currentProjectID); // ADDS THE NEW PROJECT ID TO THE ARRAY OF OLD ONES
        this.updateProjectSet(myProjects, this.state.newItem);
      })
      .catch( (error) => {alert(JSON.stringify(error))});
    }
  }
  updateProjectSet=(projectList, username)=>{
    var myUrl = 'https://seniordevops.com/project/update/' +  encodeURIComponent(username) + '/';
    var data = { "project_set": projectList };
    fetch(myUrl, {
        method: 'PUT',
        headers: this.headers(),
        credentials: 'include',
        body: JSON.stringify(data),
        dataType: "json",
        })
    .then(response => response.json()) // pull bits off of the buffer,
    .then(()=>{this._getProjects()})  //  the response data isnt useful, but did it to ensure syncronous behavior
    .then(()=>{this._getUsers()})     // reload picker and table after insertion
    .catch(error => {alert(JSON.stringify(error));})
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
  pickedProject = (itemValue, itemIndex) => {
    if (JSON.parse(itemValue).name == "Projects Overview"){
      this.setState({
        projectMode: true, 
        textBox: 'New project name',
        buttonText: 'New Project'});
    }else{
      this.setState({
        projectMode: false,
        textBox: 'email address',
        buttonText: 'Invite'});
    }
    this.setState({ 
      currentProject: itemValue,
      currentProjectName: JSON.parse(itemValue).name,
      currentProjectID: JSON.parse(itemValue).id});
  };

  render() {
    const spinner = this.state.isLoading ?
      <ActivityIndicator size='large'/> : null;
    return (
      <View style={{flex:2, paddingBottom:25}}>
        <View style={{flexDirection: "row", justifyContent:"space-evenly"}}>
          <Text style={styles.welcome}>Hi, {this.state.first_name}</Text>
          <Image source={require('./Resources/seniorDevops2.png')} style={styles.thumb}/>
          <Picker
            selectedValue={this.state.currentProject} // MUST SET STATE 
            onValueChange={this.pickedProject}
            style={styles.picker}>
            <Picker.Item label="All" value='{"name": "Projects Overview"}' />
            { // I FUCKING LOVE TERNARIES:   ifProjectsExists ? mapTheirValues : justChillWithNull
              this.state.projects ?  
                this.state.projects.map((myProject) => {
                    return (<Picker.Item 
                        label={myProject.name} 
                        value={JSON.stringify(myProject)}
                        key={myProject.id}
                    />)}
              ) : null }
          </Picker> 
        </View>
        {spinner}
        <Text style={styles.project}>{this.state.currentProjectName}</Text>
        <FlatList
          data={this.state.members}
          keyExtractor={this._keyExtractor}
          renderItem={this._renderItem}
          ListHeaderComponent={this.renderHeader}
        />
        <Text style={styles.clockinStatus}>{this.state.clockedIn}</Text>
        <TextInput
          style={styles.newItem}
          value={this.state.newItem}
          placeholder={this.state.textBox}
          onChangeText={(value) => this.setState({newItem: value})}/>
        <View style={{flex:1, marginTop: 0, flexDirection: "row", justifyContent: 'space-evenly' }}>
          <Button 
            style={styles.projectButton} 
            textStyle={{fontSize: 18, color: 'white', fontWeight: 'bold' }}
            onPress={this._newProject}
            >{this.state.buttonText}
          </Button>
        </View>
      </View>
    );
  }
}
const styles = StyleSheet.create({
  welcome: {
    fontSize: 22,
    height: 50,
    margin:15,
    textAlign: 'center',
    width: 180,
  },
  project: {
    fontSize: 27,
    height: 50,
    margin:15,
    textAlign: 'center',
    width: 220,
    color: '#15b232',
  },
  thumb: {
    width: 80,
    height: 80},
  picker: {
    height: 50, 
    width: 100, 
    marginTop: -30},
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
  deleteButton: {
    flexDirection: "column",
    flex:1,
    justifyContent:"center",
    backgroundColor: "red",},
  projectButton: {
    backgroundColor: '#3371FF',
    borderColor: '#2959C6',
    width:300, 
    height: 51,
    borderRadius: 27,},
  newItem: {
    height: 36,
    width: 240,
    padding: 4,
    marginBottom: 10,
    fontSize: 18,
    borderWidth: 1,
    color: '#1081f2',
    borderRadius: 8,
    borderColor: '#15b232',
    textAlign: 'center',
    justifyContent: 'center',
    alignSelf: 'center'},
  items: {
    fontSize: 20,
    color: 'black',
    marginLeft: 20,
    justifyContent: 'flex-start',
    width: 220}
});