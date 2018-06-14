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
  Modal,
  TextInput
} from 'react-native';
import {Button as NavButton} from 'react-native';
import Button from 'apsl-react-native-button';

class ListItem extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = ({item : this.props.item});
    /* If finished is null, this routine sets the parents currentProject to the list items project for the pickers state */
    if (!this.state.item.finished){
      this.props.parentMethod(this.state.item.project, this.state.item.id);
    }
  }
  _onPressItem = (index => alert("Pressed row: " + index));
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
      isLoading: false,
      first_name: "", 
      modalVisible: false
    };
  }
  componentDidMount(){
    this._setProjectState = this._setProjectState.bind(this);                      /* closure keeps a reference to this */
    this._getProjects();                                                           /* sets pickers initial values */
    this.setState({                                                             /* Navigation sets initial values during segue */
      hours: this.props.navigation.state.params.intervals, 
      user: this.props.navigation.state.params.user,
      first_name: this.props.navigation.state.params.first_name,
      username: this.props.navigation.state.params.username
    });          
  }
  setModalVisible(visible) {
    this.setState({modalVisible: visible});
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
  /* API Calls  */
  
  _getProjects = () => {
    fetch('https://seniordevops.com/clockin/projects/', {
      method: 'GET',
      headers: this.headers(),
      credentials: 'include',
    })
    .then(response => response.json())
    .then(responseJson => {
      this.setState({projects: responseJson})
      AsyncStorage.setItem("projects", JSON.stringify(responseJson));
    })
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
  _closeModal = () => {
    this.setModalVisible(false);
  }
  _clockOut = () => {
    this.setModalVisible(false);
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
            project: this.state.currentProject,
            comments: this.state.comments
        }),
        dataType: "json",
      })
      .then(response => response.json())
      .then((responseJson) => {
        this.setState({clockedIn: (false, "Not Clocked In"), clockButtonText: "Clock In"});
        if(this.state.keepGoing){
          alert("KEPT GOING");
          this._clockIn();
          this.setState({keepGoing:false});
          return;
        }
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
  _commentPressed = () => {
    this.setState({keepGoing: true});
    this._clockInOrOutPressed();
  }
  _clockInOrOutPressed = () => {
    if (this.state.clockedIn == (true, "Clocked In")){
      this.setModalVisible(true);
      return null;
    }
    this._clockIn();
  }
  _clockIn = () => {
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
  static navigationOptions = ({navigation}) => ({
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
        onPress={() => navigation.navigate('Project', { user_id: 1 })}
        title="Projects"
        color="#000"
      />
    ),
  });
  render() {
    const firstName = this.state.first_name
    const spinner = this.state.isLoading ?
      <ActivityIndicator size='large'/> : null;
    return (
    <View style={{flex:1}}>
      <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.modalVisible}
          onRequestClose={() => {
            alert('Modal has been closed.');
          }}>
          <View style={styles.modalContent}>
            <Text style={styles.welcome}>Enter your comments below</Text>
            <View style={styles.textAreaContainer} >
              <TextInput
                style={styles.textArea}
                underlineColorAndroid="transparent"
                placeholder={"Comments go here"}
                placeholderTextColor={"grey"}
                onChangeText={(comments) => this.setState({comments})}
                numberOfLines={10}
                multiline={true}
              />
            </View>
            <View style={styles.buttonContainer}>
              <Button 
                style={styles.saveButton} 
                textStyle={styles.saveText}
                onPress={this._clockOut}>
                SAVE CHANGES
              </Button>
              <Button 
                style={styles.closeButton} 
                textStyle={styles.saveText}
                onPress={this._closeModal}>
                CLOSE
              </Button>
            </View>
          </View>
        </Modal>
        <View style={styles.topHalf}>
          <View style={styles.logoView}>
            <View style={styles.labelView}>
              <Text numberOfLines={3} style={styles.welcome}>Hi, {this.state.first_name}</Text>
              <Text style={styles.clockinStatus}>{this.state.clockedIn}</Text>
              <View style={styles.buttonContainerTwo}>
                <Button 
                  style={styles.clockinButton} 
                  textStyle={{fontSize: 18, color: 'white', fontWeight: 'bold' }}
                  onPress={this._clockInOrOutPressed}>
                  {this.state.clockButtonText}
                </Button>
                {
                  (this.state.clockedIn == "Clocked In") ? 
                    (<Button 
                      style={styles.clockinButton} 
                      textStyle={{fontSize: 18, color: 'white', fontWeight: 'bold' }}
                      onPress={this._commentPressed}>
                      Comment
                    </Button>) : null
                }
              </View>
            </View>
            <Image source={require('./Resources/seniorDevopsSmall.png')} style={styles.thumb}/>
          </View>
          <View>
          <Picker
            selectedValue={this.state.currentProject}
            style={styles.picker}
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
        </View>
        {spinner}        
        <FlatList
          data={this.state.hours} /* initial property set by previous view controller */
          keyExtractor={this._keyExtractor}
          renderItem={this._renderItem}
          ListHeaderComponent={this.renderHeader}
          style={styles.flatList}/>
      </View>);
  }
}
const styles = StyleSheet.create({
  topHalf: {
    flexDirection: "row",
    flex: .3,
    justifyContent:"flex-start",
    marginTop:10,
    //backgroundColor: "#AEAEAE",
    alignItems: "flex-start"
  },
  logoView: {
    flex:1, 
    flexDirection:'row', 
    //backgroundColor:'gray',
    margin: 7
  },
  welcome: {
    fontSize: 23,
    textAlign: 'center',
    marginBottom: 3
  },
  labelView: {
    flex: 0.69,
    flexDirection: 'column',
    //backgroundColor:'orange',
    height: 130,
    width: 60,
    justifyContent: 'space-evenly'
  },
  thumb: {
    marginTop: -10,
    marginRight: -10,
    width: 50,
    height: 90,
    margin: 1,
    flex: 0.38,
    transform: [{scaleX: 0.69}, {scaleY: 0.69}],
    alignItems: 'center',
    //backgroundColor: 'yellow',
    flexDirection: 'column'
  },
  picker: {
    height: 150, 
    width: 100, 
    flex: 0.26,
    flexDirection: 'column',
    //backgroundColor: 'green',
    marginTop: -40
  },
  flatList: {
    marginTop:45,
    flex: 1
  },
  header: {
    flex: 1,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#D3D3D3',
    justifyContent: 'space-around',
    marginLeft: 15
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3371FF',
  },
  rowContainer: {
    flexDirection: 'row',
    padding: 5,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  labels: {
    fontSize: 20,
    color: 'black',
    marginLeft: 20,
    justifyContent: 'flex-start',
    width: 120
  },
  separator: {
    height: 1,
    backgroundColor: '#dddddd'
  },
  clockinStatus: {
    fontSize: 22,
    //backgroundColor: 'red',
    textAlign: 'center',
    marginBottom: 14,
    marginTop:7
  },
  buttonContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-evenly'
  },
  buttonContainerTwo: {
    //backgroundColor: 'red',
    flexDirection: 'row',
    flex: 8,
    width: 260,
    justifyContent: 'space-evenly',
    alignItems: 'center'
  },
  saveButton: {
    backgroundColor: '#3371FF', 
    width:130, 
    height: 51,
    borderRadius: 30,
    borderWidth: 0.5,
    marginTop: 20,
    marginRight: 10
  },
  closeButton: {
    width:130, 
    height: 51,
    borderRadius: 30,
    borderWidth: 0.5,
    marginTop: 20,
    backgroundColor: '#7c889b'
  },
  saveText: {
    fontSize: 14, 
    color: 'white', 
    fontWeight: 'bold' 
  },
  clockinButton: {
    backgroundColor: '#3371FF', 
    width:110, 
    height: 51,
    borderRadius: 30,
    borderWidth: 0.5,
    margin: 5
  },
  modalContent: {
    flex: 0.5,
    marginTop: 60,
    padding: 28,
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 10,
    borderWidth:0.5,
    borderColor: 'black',
    backgroundColor: '#E8E5E5'},
  textAreaContainer: {
    borderColor: "black",
    borderRadius: 10,
    borderWidth: 1,
    padding: 5,
    width: 300,
    flex:2.8,
    marginTop: 10
  },
  textArea: {
    justifyContent: "flex-start",
    flex:2
  }
});