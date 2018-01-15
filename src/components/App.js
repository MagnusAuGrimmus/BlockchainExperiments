import React, {Component} from 'react';
import VotingContract from '../../build/contracts/Voting.json';
import View from './View';
import Booth from './Booth'
import getWeb3 from '../utils/getWeb3';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {data: [{name: 'Jose', votes: 0},
                {name: 'Nick', votes: 0},
                {name: 'Pedro', votes: 0}], instance: null, accounts: null, web3: null, winner: null};

        this.updateBoard = this.updateBoard.bind(this);
        this.initializeContract = this.initializeContract.bind(this);
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

               var events = instance.allEvents();
               var convert = this.state.web3.toUtf8;
               var update = this.updateBoard
               const setWinner = (winner) => this.setState({winner: winner});

             events.watch((err, result) => {
               if(err) {
                 console.log(err);
                 return;
               }
               if(result.event === 'Vote') {
                 update(convert(result.args._candidate));
               }
               else if(result.event === 'Winner') {
                 setWinner(convert(result.args._candidate));
               }
             });
           });
        });
    }


    updateBoard(name)
    {
        var board = Object.assign([], this.state.data);
        for(let i = 0; i < board.length; i++) {
            if(board[i].name === name) {
              board[i].votes++;
              break;
            }
        }
        this.setState({data: board});
    }

    render() {
      if(this.state.accounts && this.state.instance) {
        return (
          <div>
            <View data={this.state.data}/>
            <div>
              {this.state.winner === null ? (
                <Booth instance={this.state.instance} account={this.state.accounts[0]}/>
              ) : (
                <h2>Election has ended! The winner is : {this.state.winner}</h2>
              )}
            </div>
          </div>
        );
      }
      else {
        return <h3>Rendering</h3>
      }
    }
}


export default App;