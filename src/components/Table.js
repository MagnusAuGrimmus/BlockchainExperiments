import React, {Component} from 'react';
import {BootstrapTable, TableHeaderColumn} from 'react-bootstrap-table';

class Table extends Component
{
  render() {
    return (
      <BootstrapTable data={this.props.data}>
        <TableHeaderColumn dataField='name' isKey>Name</TableHeaderColumn>
        <TableHeaderColumn dataField='votes'>Votes</TableHeaderColumn>
      </BootstrapTable>
    );
  }
}

export default Table;