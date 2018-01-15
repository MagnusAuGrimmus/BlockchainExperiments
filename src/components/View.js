import React, {Component} from 'react';
import Table from './Table';

class View extends Component
{
  render() {
    return (
      <div>
        <h1>Voting Contract DApp</h1>
        <Table data={this.props.data} />
        <p>Vote Here</p>
      </div>
    );
  }
}

export default View;