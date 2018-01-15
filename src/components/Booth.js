import React, {Component} from 'react'

class Booth extends Component
{
  constructor(props) {
    super(props);
    this.state = {value: '', instance : this.props.instance, account : this.props.account};
    this.onSubmit = this.onSubmit.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  onChange(e) {
    this.setState({value: e.target.value});
  }

  onSubmit(e) {
    this.state.instance.voteForCandidate(this.state.value, {from: this.state.account})
      .catch((e) =>{
        console.log(e);
        alert("Invalid Submission");
      });
    e.preventDefault();
    this.setState({value: ''});
  }

  render() {
    return (
      <form onSubmit={this.onSubmit}>
        <label>
          Name:
          <input type="text" value={this.state.value} onChange={this.onChange} />
        </label>
        <input type="submit" value="Submit" />
      </form>
    )
  }
}

export default Booth;