/*jshint unused:false */
var UserImage = React.createClass({
  usernameToImg: function (user) {
    var re = new RegExp("^(fb:)?"),
      userSplit = user.split(re),
      type, src, username;

    if (userSplit.length > 1) {
      //we have a match
      //grab the end piece
      type = userSplit[userSplit.length - 2];
      username = userSplit[userSplit.length - 1];
    } else {
      username = user;
      type = 'gravatar';
    }

    if (type && type === 'fb:') {
      src = 'https://graph.facebook.com/' + username + '/picture?type=square';
    } else {
      var emailhash = md5(username.toLowerCase());
      src = 'http://www.gravatar.com/avatar/' + emailhash + '?d=retro&s=18';
    }

    return {
      src: src,
      username: username
    };
  },
  render: function () {
    var imgOutput = this.usernameToImg(this.props.username);
    var name = this.props.useName ? imgOutput.username + ': ' : null;
    return React.DOM.span(null,
      [React.DOM.img({src: imgOutput.src, className: 'userimg', title: imgOutput.username, ref: 'userImage'}, null),
        name]);
  }
});

var UserDisplay = React.createClass({
  signoutUser: function () {
    $(window).trigger('SignoutUser');
  },
  handleClick: function (event) {
    event.preventDefault();
    this.signoutUser();
  },
  render: function () {

    return React.DOM.div(null,
      [React.createElement(UserImage, {username: this.props.username, useName: true}),
        React.DOM.a({href: '#', onClick: this.handleClick}, 'Sign out')]);
  }
});

var UserLogin = React.createClass({
  addUser: function (user) {
    $(window).trigger('AddUser', user);
  },
  handleBlur: function (event) {
    var val = event.target.value;
    if (val !== '') {
      this.addUser(val);
    }
  },
  render: function () {
    return React.DOM.input({
      id: 'login',
      type: 'text',
      placeholder: 'fb:username or gravatar',
      onBlur: this.handleBlur
    }, null);
  }
});

var LoginForm = React.createClass({
  componentWillMount: function(){
    this.boundNewUser = this.newUser.bind(this);
    $(window).on('NewUser.React', this.boundNewUser);
  },
  getInitialState: function(){
    return {
      user: this.props.user
    };
  },
  processUser: function (user) {
    var loggedIn = (user !== undefined && user !== null),
      newUser = null;

    if (loggedIn) {
      newUser = user;
    }

    return {
      loggedIn: loggedIn,
      user: newUser
    };
  },
  newUser: function(e, user){
    this.setState({user: user});
  },
  componentWillUnmount: function () {
    $(window).off('NewUser.React', this.boundNewUser);
  },
  render: function () {
    var processState = this.processUser(this.state.user);
    var userComponent = processState.loggedIn ? React.createElement(UserDisplay, {username: this.state.user.username})
      : React.createElement(UserLogin, null);
    return React.DOM.div(null,
      [userComponent]);
  }
});

var RestaurantWell = React.createClass({
  restaurantSearch: function (search) {
    $(window).trigger('RestaurantSearch', search);
  },
  clearRestaurantSearch: function () {
    $(window).trigger('ClearRestaurantSearch');
  },
  searchClickHandler: function (event) {
    event.preventDefault();
    var val = this.refs['restSearch'].getDOMNode().value;
    if (val !== '') {
      this.restaurantSearch(val);
    } else {
      this.restaurantSearch('restaurant');
    }
  },
  clearClickHandler: function (event) {
    event.preventDefault();
    this.clearRestaurantSearch();
    this.refs['restSearch'].getDOMNode().value = '';
  },
  render: function () {
    return React.DOM.form({className: 'form-search', onSubmit: this.searchClickHandler},
      [React.DOM.input({
        type: 'text',
        className: 'input-medium search-query',
        placeholder: 'search or leave blank',
        ref: 'restSearch'
      }, null),
        React.DOM.button({
          className: 'btn',
          onClick: this.searchClickHandler
        }, React.DOM.i({className: 'icon-search'}, null)),
        React.DOM.button({
          className: 'btn',
          onClick: this.clearClickHandler
        }, React.DOM.i({className: 'icon-remove'}, null))]);
  }
});

var RestaurantDisplay = React.createClass({
  vote: function (fs) {
    $(window).trigger('Vote', fs);
  },
  handleClick: function (event) {
    event.preventDefault();
    this.vote(this.props.fs);
  },
  render: function () {
    var fs = this.props.fs;
    var img, phone, menu, votes, users = [];
    if (fs.categories.length > 0) {
      img = React.DOM.img({src: fs.categories[0].icon.prefix + 'bg_32' + fs.categories[0].icon.suffix}, null);
    } else {
      img = React.DOM.img({src: 'images/marker.png'}, null);
    }

    if (fs.phone !== undefined) {
      phone = React.DOM.div(null, fs.phone);
    } else {
      phone = null;
    }

    if (fs.menu !== undefined) {
      menu = React.DOM.div(null, React.DOM.a({href: fs.menu.url, target: '_blank'}, 'Menu'));
    } else {
      menu = null;
    }

    if (fs.user !== undefined) {
      votes = React.DOM.div(null, 'Votes: ' + fs.user.length);
      users = fs.user.slice();
    } else {
      votes = React.DOM.div(null, 'Votes: 0');
    }

    return React.DOM.div(null,
      [React.DOM.h3(null, img, fs.name),
        phone,
        menu,
        votes,
        React.DOM.div(null,
          users.map(function (u) {
            return React.createElement(UserImage, {username: u.username, useName: false});
          })
        ),
        React.DOM.button({className: "btn", onClick: this.handleClick}, 'Vote for ' + fs.name)
      ]);
  }
});

var VoteDisplay = React.createClass({
  showRestaurant: function (fsid) {
    $(window).trigger('ShowRestaurant', fsid);
  },
  handleClick: function (e, index) {
    this.showRestaurant(this.props.votes[index][2]);
  },
  render: function () {
    var partialHandle = function (fn, index) {
      return function (e) {
        return fn(e, index);
      };
    };

    return React.DOM.ul({id: 'votes'},
      this.props.votes.map(function (vote, index) {
          return React.DOM.li(null,
            [React.DOM.div({onClick: partialHandle(this.handleClick, index)}, vote[3].length + ' for ' + vote[0]),
              vote[3].map(function (user) {
                return React.createElement(UserImage, {username: user.username, useName: false});
              })]
          );
        }.bind(this)
      )
    );
  }
});

var ActivityDisplay = React.createClass({
  componentWillMount: function () {
    this.boundAddVote = this.addVote.bind(this);
    $(window).on('ServerVote.React', this.boundAddVote);
  },
  getInitialState: function () {
    return {
      votes: []
    };
  },
  addVote: function (event, data) {
    var newState = this.state.votes.slice();
    newState.push(data);
    this.setState({votes: newState});
  },
  showRestaurant: function (fsid) {
    $(window).trigger('ShowRestaurant', fsid);
  },
  handleClick: function (index) {
    this.showRestaurant(this.state.votes[index].id);
  },
  componentWillUnmount: function () {
    $(window).off('ServerVote.React', this.boundAddVote);
  },
  render: function () {
    return React.DOM.ul({id: 'acts'},
      this.state.votes.map(function (vote, index) {
          return React.DOM.li({key: index},
            [React.DOM.div({onClick: this.handleClick.bind(this, index)},
              React.createElement(UserImage, {username: vote.user.username, useName: false}),
              vote.user.username + ' voted for ' + vote.name),
              React.DOM.hr(null, null)
            ]);
        }.bind(this)
      ));
  }
});
