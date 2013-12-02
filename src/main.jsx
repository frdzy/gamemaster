/**
 * @jsx React.DOM
 */

var formatDigit = function(d) {
  return (d >= 10) ? '' + d : '0' + d;
};

var formatTime = function(t) {
  var date = new Date(t);
  var parts = [
    date.getUTCHours(),
    formatDigit(date.getUTCMinutes()),
    formatDigit(date.getUTCSeconds())
  ].filter(function(a) { return a; });
  return parts.join(':');
};

var GMTimerHeaderAddPlayer = React.createClass({
  getInitialState: function() {
    return {
      showNameEntry: false,
      nameEntry: ''
    };
  },

  onAddButtonPress: function() {
    var newState = !this.state.showNameEntry;
    this.setState({showNameEntry: newState});
    if (newState) {
      var headerTextInput = this.refs.headerTextInput.getDOMNode();
      setTimeout(function() {
        headerTextInput.focus();
      }, 0);
    }
  },

  confirmAddPlayer: function() {
    if (!this.state.nameEntry) {
      return;
    }
    this.props.onAddPlayer(this.state.nameEntry);
    this.setState({
      showNameEntry: false,
      nameEntry: '',
    });
  },

  onTextChange: function(evt) {
    this.setState({
      nameEntry: evt.target.value
    });
  },

  onKeyPress: function(evt) {
    if (evt.which === 13) {
      this.confirmAddPlayer();
    }
  },

  render: function() {
    var showNameEntry = this.state.showNameEntry;

    return (
      <li className={'dropdown' + (showNameEntry ? ' open' : '')}>
        <a href="#"
          onClick={this.onAddButtonPress}
          className="dropdown-toggle">
          Add a Player
          <b className="caret" />
        </a>
        <ul className="dropdown-menu">
          <li>
            <div>
              <span>
                <input
                  ref="headerTextInput"
                  type="text"
                  onKeyPress={this.onKeyPress}
                  onChange={this.onTextChange}
                  value={this.state.nameEntry}
                />
              </span>
            </div>
          </li>
        </ul>
      </li>
    );
  }
});

var GMTimerHeader = React.createClass({
  render: function() {
    return (
      <div className="gmTimerHeader navbar navbar-default navbar-fixed-top">
        <a className="navbar-brand" href="#">GameMaster</a>
        <ul className="nav navbar-nav">
          <GMTimerHeaderAddPlayer
            onAddPlayer={this.props.onAddPlayer}
          />
        </ul>
      </div>
    );
  }
});

var GMTimerStatus = React.createClass({

  getInitialState: function() {
    return {
      elapsedTime: 0
    };
  },

  componentWillUnmount: function() {
    this.clearTimer();
  },

  clearTimer: function() {
    this.interval && clearInterval(this.interval);
  },

  restartTimer: function() {
    this.interval = setInterval(this.tick);
  },

  tick: function() {
    var now = Date.now();
    this.setState({
      elapsedTime: now - this.props.lastNext
    });
  },

  getStatusClass: function(t) {
    if (t < 10000) {
      return 'brief';
    } else if (t < 30000) {
      return 'short';
    } else if (t < 60000) {
      return 'medium';
    } else if (t < 120000) {
      return 'long';
    }
    return 'forever';
  },

  render: function() {
    var currentPlayer = this.props.currentPlayer;
    var name = (currentPlayer)
      ? currentPlayer.name
      : '';
    var totalTime = (currentPlayer)
      ? '(' + formatTime(currentPlayer.totalTime + this.state.elapsedTime) + ')'
      : '';
    return (
      <div>
        <p>{'>'}{name + ' ' + totalTime}</p>
        <h1 className="gmStatusText">
          <span className={this.getStatusClass(this.state.elapsedTime)}>
            {formatTime(this.state.elapsedTime)}
          </span>
        </h1>
      </div>
    );
  }
});

var GMTimerNext = React.createClass({
  render: function() {
    var buttonClass =
      'btn btn-primary btn-lg' +
      (this.props.disabled ? ' disabled' : '');
    return this.transferPropsTo(
      <a className={buttonClass}>
        {this.props.started ? 'Next' : 'Start'}
      </a>
    );
  }
});

var GMTimerHistory = React.createClass({
  render: function() {
    var rows = this.props.players.map(function(player) {
      return (
        <tr>
          <td>{player.name}</td>
          <td>{formatTime(player.totalTime)}</td>
        </tr>
      );
    });
    return (
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Name</th>
            <th>Total Time</th>
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
    );
  }
});

var GMTimerDie = React.createClass({
  render: function() {
    return (
      <a href="#" class="btn btn-success btn-lg">
        {this.props.value}
      </a>
    );
  }
});

var GMTimerDice = React.createClass({
  makeRand: function(max) {
    return Math.floor(Math.random() * max) + 1;
  },

  makeRands: function(max) {
    return [
      this.makeRand(this.props.max),
      this.makeRand(this.props.max)
    ];
  },

  roll: function(max) {
    this.setState({
      values: this.makeRands(this.props.max)
    });
  },

  getInitialState: function() {
    return {
      values: this.makeRands(this.props.max)
    };
  },

  render: function() {
    return (
      <div>
        <div>
          {
            this.state.values.map(function(v) {
              return <GMTimerDie value={v} />;
            })
          }
        </div>
        <h3>
          Roll:
          {
            this.state.values.reduce(function(a, b) {
              return a + b;
            }, 0)
          }
        </h3>
      </div>
    );
  }
});

var GMTimerApp = React.createClass({
  getInitialState: function() {
    return {
      started: false,
      lastNext: -1,
      players: [],
      currentIndex: -1
    };
  },

  getCurrentPlayer: function() {
    var currentIndex = this.state.currentIndex;
    if (currentIndex === -1) {
      return null;
    }
    return this.state.players[currentIndex];
  },

  onAddPlayer: function(name) {
    var players = this.state.players.slice();
    players.push({
      name: name,
      totalTime: 0
    });
    this.setState({
      players: players
    });
  },

  startGame: function() {
    if (!this.state.players.length) {
      return;
    }
    this.setState({
      started: true,
      lastNext: Date.now()
    });
    this.refs.gmTimer.restartTimer();
  },

  floor1000: function(t) {
    return 1000 * Math.floor(t / 1000);
  },

  updateTotalTimes: function() {
    var currentIndex = this.state.currentIndex;
    var nextIndex = (currentIndex + 1) % this.state.players.length;
    var now = Date.now();
    var players = this.state.players.slice();
    var oldPlayer = this.getCurrentPlayer();
    if (oldPlayer) {
      var totalTime = this.floor1000(
        oldPlayer.totalTime + now - this.state.lastNext
      );
      players[currentIndex] = {
        name: oldPlayer.name,
        totalTime: totalTime
      };
    }
    this.setState({
      lastNext: now,
      players: players,
      currentIndex: nextIndex
    });
  },

  next: function() {
    if (!this.state.started) {
      if (!this.state.players.length) {
        return;
      }
      this.startGame();
    }
    this.updateTotalTimes();
    this.refs.gmDice.roll();
  },

  render: function() {
    return (
      <div className="gmTimerApp">
        <GMTimerHeader
          onAddPlayer={this.onAddPlayer}
        />
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <GMTimerStatus
                ref="gmTimer"
                lastNext={this.state.lastNext}
                currentPlayer={this.getCurrentPlayer()}
              />
              <GMTimerNext
                started={this.state.started}
                disabled={!this.state.players.length}
                onClick={this.next}
              />
            </div>
            <div className="col-md-6">
              { (this.state.started)
                ? <GMTimerDice
                    ref="gmDice"
                    max={6}
                  />
                : null
              }
            </div>
            <div className="col-md-12">
              <GMTimerHistory
                players={this.state.players}
                currentIndex={this.state.currentIndex}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
});

React.renderComponent(
  <GMTimerApp />,
  document.getElementById('gmStage')
);
