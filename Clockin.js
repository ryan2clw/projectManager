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
  ActivityIndicator
} from 'react-native';
import {Button as NavButton} from 'react-native';
import Button from 'apsl-react-native-button';

class ListItem extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = ({
      item : this.props.item,
      totalHours: 0.0,
      localFinish: ""
    });
    if (!this.state.item.finished)
      /* If finished is null, set the parent states currentProject to the items project for picker */
      this.props.parentMethod(this.state.item.project, this.state.item.id);
  };

  _onPress = () => {
    this.props.onPressItem(this.props.index);
  }
  doubleDigit=(i)=> {
    if (i < 10) {i = "0" + i};      // add zero in front of numbers < 10
      return i;
  }
  americanizeTime = (timeString) => {
    if (timeString == "active"){
      return "active";
    }
    var today = new Date(timeString);
    var h = today.getHours();
    var m = today.getMinutes();
    var s = today.getSeconds();
    var ampm = h >= 12 ? 'pm' : 'am';
    h = h % 12;
    h = h ? h : 12;                // the hour '0' should be '12'
    m = this.doubleDigit(m);
    s = this.doubleDigit(s);
    return (h + ":" + m + ":" + s + " " + ampm);
  }
  totalHours = (timeDelta) => {
    var item = this.state.item;
    var startDate = new Date(item.started);
    var startTime = startDate.getTime(); /* timestamp for delta comparison */
    var finishDate = new Date(item.finished);
    var finishTime = finishDate.getTime();
    if(this.state.item.finished){
      return parseFloat(Math.round(((finishTime - startTime)/3600000) * 100) / 100).toFixed(2);
    }else{
      return "0.00";
    }
  }
  render() {
    return (
      <TouchableHighlight
        onPress={this._onPress}
        underlayColor='#dddddd'>
        <View>
          <View style={styles.rowContainer}>
            <View style={styles.textContainer}>
              <Text style={styles.labels}>{this.americanizeTime(this.props.item.started)}</Text>
              <Text style={styles.labels} numberOfLines={1}>{
                  this.americanizeTime(this.props.item.finished ? this.props.item.finished : "active")}
                </Text>
              <Text style={styles.labels}>{this.totalHours()}</Text>
            </View>
          </View>
          <View style={styles.separator}/>
        </View>
      </TouchableHighlight>
    );
  }
}
export default class Clockin extends Component<{}> {

constructor(props) {
  super(props);
  this.state = {
    currentProject : "",
    currentHour: 0,
    user: 0,
    projects : [],
    hours: [],
    clockedIn: (false, "Not Clocked In"),
    clockButtonText: "Clock In",
    isLoading: false 
  };
 }

componentDidMount() {
  this._setProjectState = this._setProjectState.bind(this);                      /* closure keeps a reference to this */
  this._getProjects();                                                           /* sets pickers initial values */
  this.setState({ hours: this.props.intervals, user: this.props.user});          /* sets initial values from segue */
}

  _keyExtractor = (item, index) => String(index);

  _renderItem = ({item, index }) => (
    <ListItem
      item={item}
      index={index}
      onPressItem={this._onPressItem}
      parentMethod={this._setProjectState}                        /* pass function to child as a prop */
    />
  );

  _onPressItem = (index) => {
    console.log("Pressed row: "+index);
  };

  /* API Calls  */
  
  _getProjects = () => {
    fetch('https://seniordevops.com/clockin/projects/', {
      method: 'GET',
      headers: this.headers(),
      credentials: 'include',
    })
    .then(response => response.json())
    .then(responseJson => this.setState({projects: responseJson}))
    .catch(error =>
      this.setState({
        isLoading: false,
        message: 'Something bad happened ' + error,
    }));
  }
  _getHours = (currentProject) => {
    this.setState({currentProject: currentProject, isLoading: true, hours: []});
    var myProject = '';
    this.state.projects.map((aProject) => {
      if (aProject.id == currentProject){
        myProject += aProject.name;
      }
    });
    fetch('https://seniordevops.com/clockin/list/?project=' + myProject, {
      method: 'GET',
      headers: this.headers(),
      credentials: 'include',
    })
    .then(response => response.json())
    .then(responseJson => this.setState({ hours: responseJson, isLoading: false}))
    .catch(error =>
      this.setState({
        isLoading: false,
        message: 'Something bad happened ' + error
    }));
  }
  _clockOut = () => {
    this.setState({isLoading: true});
    var rightNow = new Date().toISOString();
    fetch('https://seniordevops.com/clockin/update/' + this.state.currentHour + '/', {
        method: 'PUT',
        headers: this.headers(),
        credentials: 'include',
        body: JSON.stringify({
            user: this.state.user,
            comments: "comments were made",
            finished: rightNow,
            project: this.state.currentProject
        }),
        dataType: "json",
      })
      .then(response => response.json())
      .then((responseJson) => {
        this.setState({clockedIn: (false, "Not Clocked In"), clockButtonText: "Clock In"});
        this._getHours(this.state.currentProject);
        this.setState({isLoading: false});
      })
      .catch(error =>
        this.setState({
          isLoading: false,
          message: 'Something bad happened ' + error
      }))
    return null;
  }
  _clockIn = () => {
    if (this.state.clockedIn == (true, "Clocked In")){
      this._clockOut();
      return null;
    }
    var myProject = 0;
    this.state.projects.map((aProject) => {
      if (aProject.id == this.state.currentProject){
        myProject += aProject.id;
      }
    });
    if (myProject == 0){
      alert("You must select a project before clocking in.");
      return;
    }
    this.setState({isLoading: true});
    fetch('https://seniordevops.com/clockin/new/', {
        method: 'POST',
        headers: this.headers(),
        credentials: 'include',
        body: JSON.stringify({
            user: this.state.user,
            paid: false,
            project: myProject
        }),
        dataType: "json",
      })
      .then(response => {
          var responseJson = response.json();
          var myHours = this.state.hours;
          myHours.push(responseJson);
          this.setState({hours: myHours, isLoading: false});
          this._getHours(this.state.currentProject);
      }).catch(error =>
        this.setState({
          isLoading: false,
          message: 'Something bad happened ' + error
      }));
  }
  _setProjectState = (myProject, myHour) => {        /* your function is declared in the parent but called with childs params */
    this.setState({ 
      clockButtonText: "Clock Out", 
      currentProject: myProject, 
      clockedIn: (true, "Clocked In"),
      currentHour: myHour
    });
  }

  renderHeader = () => {
    return (
      <View style={styles.header}>
        <Text style={styles.title}>Started</Text>
        <Text style={styles.title}>Finished</Text>
        <Text style={styles.title}>Hours</Text>
      </View>
    )
  };
  headers() {
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
  static navigationOptions = {
      title: "Clock In",
      headerStyle: {
        backgroundColor: '#EAEAEA',
      },
      headerTintColor: '#000',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
      headerRight: (
        <NavButton
          onPress={() => alert('This is a button!')}
          title="Projects"
          color="#000"
        />
      ),
    };

  render() {
    const spinner = this.state.isLoading ?
      <ActivityIndicator size='large'/> : null;
    return (
      <View style={{flex:1}}>
        <View style={{flexDirection: "row", justifyContent:"space-evenly"}}>
          <Text numberOfLines={2} style={styles.welcome}>Hi, King Ryan the Great</Text>
          <Image source={require('./Resources/seniorDevops2.png')} style={styles.thumb}/>
          <Picker
            selectedValue={this.state.currentProject}
            style={{ height: 50, width: 100, marginTop: -30 }}
            onValueChange={(itemValue, itemIndex) => {
              if(this.state.clockedIn == "Clocked In"){
                alert("You must clock out before switching projects");
                this.setState({ currentProject: this.state.currentProject});
              }else{
                this.setState({ currentProject: itemValue});
                this._getHours(itemValue);
              }
            }}>
            <Picker.Item label="All" value="all" />
            {
              this.state.projects.map((myProject) => {
                return (<Picker.Item 
                label={myProject.name} 
                value={myProject.id}
                key={myProject.id}
              />) 
            })}
          </Picker>
        </View>
        {spinner}        
        <FlatList
          data={this.state.hours} /* initial property set by previous view controller */
          keyExtractor={this._keyExtractor}
          renderItem={this._renderItem}
          ListHeaderComponent={this.renderHeader}
          style={{ marginTop: 70 }}
        />
        <Text style={styles.clockinStatus}>{this.state.clockedIn}</Text>
        <View style={{flex:1, marginTop: 0, flexDirection: "row", justifyContent: 'space-evenly' }}>
          <Button 
            style={{backgroundColor: '#3371FF', width:300, height: 51, borderRadius: 30}} 
            textStyle={{fontSize: 18, color: 'white', fontWeight: 'bold' }}
            onPress={this._clockIn}
            >
            {this.state.clockButtonText}
          </Button>
        </View>
      </View>
    );
  }
}
const styles = StyleSheet.create({
  clockinStatus: {
    fontSize: 22,
    flex: 0.5, 
    margin: 0,
    alignSelf: 'stretch',
    textAlign: 'center'
  },
  clockinButton: {
    color: "#FFFFFF",
  },
  thumb: {
    width: 90,
    height: 90,
    marginRight: 10,
    marginTop: 30,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  header: {
    flex: 1,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#D3D3D3',
    justifyContent: 'space-around'
  },
  separator: {
    height: 1,
    backgroundColor: '#dddddd'
  },
  labels: {
    fontSize: 20,
    color: 'black',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3371FF',
  },
  welcome: {
    fontSize: 24,
    marginLeft:70,
    marginRight:150,
    marginTop: 30,
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  rowContainer: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center'
  },
});