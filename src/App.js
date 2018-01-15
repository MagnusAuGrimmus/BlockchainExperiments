import React, {Component} from 'react';
import {BootstrapTable, TableHeaderColumn} from 'react-bootstrap-table';
import VotingContract from '../build/contracts/Voting.json'
import getWeb3 from './utils/getWeb3'



class App extends Component {
    constructor(props) {
        super(props);
        this.state = {data: [{name: 'Jose', votes: 0},
                {name: 'Nick', votes: 0},
                {name: 'Pedro', votes: 0}], value: '', instance: null, accounts: null, web3: null, electionRunning: true};

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.updateBoard = this.updateBoard.bind(this);

    }

    componentWillMount() {
        getWeb3.then(results => {this.setState({web3: results.web3}); this.initializeContract()})
            .catch((e) => {
                console.log("Error finding web3.");
                console.log(e);
        });
    }

    initializeContract() {
        const contract = require("truffle-contract");
        const Voting = contract(VotingContract);
        Voting.setProvider(this.state.web3.currentProvider);


        this.state.web3.eth.getAccounts((error, accounts) => {
           Voting.deployed().then((instance) => {
               this.setState({instance : instance, accounts: accounts});
           });
        });
    }

    handleChange(event) {
        this.setState({value: event.target.value});
    }

    handleSubmit(event)
    {
        this.state.instance.voteForCandidate(this.state.value, {from: this.state.accounts[0]})
            .then((result) => {
                result.logs.forEach((log) => {
                   if(log.event === 'ElectionWinner') {
                       let name = this.state.web3.toUtf8(log.args._candidate);
                       this.setState({electionRunning: false, winner: name});
                   }
                });
                this.updateBoard();
            })
            .catch((e) => {
                alert("Invalid Submission");
            });
        this.setState({value : ''});
        event.preventDefault();
    }

    updateBoard()
    {
        var board = Object.assign([], this.state.data);
        for(let i = 0; i < board.length; i++) {
            this.state.instance.totalVotesFor.call(board[i].name).then((result) => {
                board[i].votes = result;
                this.setState({data: board});
            });
        }
    }

    render() {
        return (
            <div>
                <h1>Voting Contract DApp</h1>
                <Table data={this.state.data} />
                <p>Vote Here</p>
                <div>
                    {this.state.electionRunning ? (
                        <form onSubmit={this.handleSubmit}>
                            <label>
                                Name:
                                <input type="text" value={this.state.value} onChange={this.handleChange} />
                            </label>
                            <input type="submit" value="Submit " />
                        </form>
                    ) : (
                        <h2>Election has ended! The winner is : {this.state.winner}</h2>
                    )}
                </div>
            </div>
        );
    }
}

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



export default App;