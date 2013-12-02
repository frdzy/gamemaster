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

var GMTimerHeaderAddPlayer = React.createClass({displayName: 'GMTimerHeaderAddPlayer',
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
      React.DOM.li( {className:'dropdown' + (showNameEntry ? ' open' : '')}, 
        React.DOM.a( {href:"#",
          onClick:this.onAddButtonPress,
          className:"dropdown-toggle"}, 
" Add a Player ",          React.DOM.b( {className:"caret"} )
        ),
        React.DOM.ul( {className:"dropdown-menu"}, 
          React.DOM.li(null, 
            React.DOM.div(null, 
              React.DOM.span(null, 
                React.DOM.input(
                  {ref:"headerTextInput",
                  type:"text",
                  onKeyPress:this.onKeyPress,
                  onChange:this.onTextChange,
                  value:this.state.nameEntry}
                )
              )
            )
          )
        )
      )
    );
  }
});

var GMTimerHeader = React.createClass({displayName: 'GMTimerHeader',
  render: function() {
    return (
      React.DOM.div( {className:"gmTimerHeader navbar navbar-default navbar-fixed-top"}, 
        React.DOM.a( {className:"navbar-brand", href:"#"}, "GameMaster"),
        React.DOM.ul( {className:"nav navbar-nav"}, 
          GMTimerHeaderAddPlayer(
            {onAddPlayer:this.props.onAddPlayer}
          )
        )
      )
    );
  }
});

var GMTimerStatus = React.createClass({displayName: 'GMTimerStatus',

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
      React.DOM.div(null, 
        React.DOM.p(null, '>',name + ' ' + totalTime),
        React.DOM.h1( {className:"gmStatusText"}, 
          React.DOM.span( {className:this.getStatusClass(this.state.elapsedTime)}, 
            formatTime(this.state.elapsedTime)
          )
        )
      )
    );
  }
});

var GMTimerNext = React.createClass({displayName: 'GMTimerNext',
  render: function() {
    var buttonClass =
      'btn btn-primary btn-lg' +
      (this.props.disabled ? ' disabled' : '');
    return this.transferPropsTo(
      React.DOM.a( {className:buttonClass}, 
        this.props.started ? 'Next' : 'Start'
      )
    );
  }
});

var GMTimerHistory = React.createClass({displayName: 'GMTimerHistory',
  render: function() {
    var rows = this.props.players.map(function(player) {
      return (
        React.DOM.tr(null, 
          React.DOM.td(null, player.name),
          React.DOM.td(null, formatTime(player.totalTime))
        )
      );
    });
    return (
      React.DOM.table( {className:"table"}, 
        React.DOM.thead(null, 
          React.DOM.tr(null, 
            React.DOM.th(null, "Name"),
            React.DOM.th(null, "Total Time")
          )
        ),
        React.DOM.tbody( {className:".table-striped"}, 
          rows
        )
      )
    );
  }
});

var GMTimerApp = React.createClass({displayName: 'GMTimerApp',
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
  },

  render: function() {
    return (
      React.DOM.div( {className:"gmTimerApp"}, 
        GMTimerHeader(
          {onAddPlayer:this.onAddPlayer}
        ),
        React.DOM.div( {className:"container"}, 
          GMTimerStatus(
            {ref:"gmTimer",
            lastNext:this.state.lastNext,
            currentPlayer:this.getCurrentPlayer()}
          ),
          GMTimerNext(
            {started:this.state.started,
            disabled:!this.state.players.length,
            onClick:this.next}
          ),
          GMTimerHistory(
            {players:this.state.players,
            currentIndex:this.state.currentIndex}
          )
        )
      )
    );
  }
});

React.renderComponent(
  GMTimerApp(null ),
  document.getElementById('gmStage')
);
