
                    <Picker
            style={styles.picker}>
            <Picker.Item label="All" value="all" />
            { // I FUCKING LOVE TERNARIES:   ifProjectsExists ? mapTheirValues : justChillWithNull
              this.state.projects ?  
                this.state.projects.map((myProject) => {
                    return (<Picker.Item 
                        label={myProject.name} 
                        value={myProject.id}
                        key={myProject.name}
                    />)}
              ) : null}
          </Picker>

          /*
    var myProjects = {}
    this.state.projects.forEach((project)=>{
      myProjects[project.name] = project.id;
    });
    const projectIDinRow = myProjects[JSON.parse(item).name]);*/
    //var projectList = this.state.projects.map(project=>project.id);
    const newMembers = this.state.members.pop(index);
    alert(JSON.stringify(newMembers));
    //this.setState({members: newMembers});
    /*