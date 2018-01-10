import React, {Component} from 'react';
import {BootstrapTable, TableHeaderColumn} from 'react-bootstrap-table';



class App extends Component {
    constructor(props) {
        super(props);
        this.state = {data: [{name: 'Jose', votes: 0}, {name: 'Nick', votes: 0}, {name: 'Pedro', votes: 0}]};
    }
    render() {
        return (
            <div>
                <h1>Voting Contract DApp</h1>
                <Table data = {this.state.data} />
                <p>Vote Here</p>
                <Booth />
            </div>
        );
    }
}

class Table extends Component
{
    render() {
        return (
          <BootstrapTable data = {this.props.data}>
              <TableHeaderColumn dataField= 'name' isKey>Name</TableHeaderColumn>
              <TableHeaderColumn dataField= 'votes'>Votes</TableHeaderColumn>
          </BootstrapTable>
        );
    }
}

class Booth extends Component {
    constructor(props) {
        super(props);
        this.state = {value: ''};

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({value: event.target.value});
    }

    handleSubmit(event) {
        alert('Vote for ' + this.state.value);
        event.preventDefault();
    }

    render() {
        return (
          <form onSubmit = {this.handleSubmit}>
              <label>
                  Name:
                  <input type = "text" value = {this.state.value} onChange = {this.handleChange} />
              </label>
              <input type = "submit" value = "Submit " />
          </form>
        );
    }
}



export default App;