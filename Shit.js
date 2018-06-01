
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