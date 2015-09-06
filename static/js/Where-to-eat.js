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
      [React.DOM.img({src: imgOutput.src, className: 'userimg', title: imgOutput.username }, null),
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

//for jsLint these are defined in other files
//except Josh that is here in the self executing functions

/*global L:true Josh:true md5:true io: true */

(function (Josh) {
  "use strict";
  Josh.Cookie = {};
  Josh.Cookie.createCookie = function (name, value, days) {
    var expires;
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toGMTString();
    }
    else {
      expires = "";
    }
    document.cookie = name + "=" + value + expires + "; path=/";
  };

  Josh.Cookie.readCookie = function (name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }
    return null;
  };

  Josh.Cookie.eraseCookie = function (name) {
    Josh.Cookie.createCookie(name, "", -1);
  };
})(window.Josh = window.Josh || {});

(function (Josh, $) {
  "use strict";
  var sock,
    listeners = [];

  Josh.Socket = function (socket) {
    return init(socket);
  };

  var init = function (socket) {
    //DI
    sock = socket;

    var addEvent = function (name, obj) {
      var proxy = function (d) {
        $(obj).trigger(name, d);
      };
      sock.on(name, proxy);
      listeners.push({name: name, func: proxy});
    };

    var addUser = function (username, area, cb) {
      sock.emit('add', username, area, function () {
        cb();
      });
    };

    var addVote = function (fs) {
      //make a copy of the object to send to the server
      //we only need basic info as the rest will be
      //built client side
      var fsSend = $.extend(true, {}, fs);
      //delete what we don't need
      delete fsSend.marker;
      delete fsSend.user;
      sock.emit('addVote', fsSend);
    };

    var getUsers = function () {
      sock.emit('get');
    };

    var getVotes = function () {
      sock.emit('getVotes');
    };

    var removeListeners = function () {
      for (var i = 0; i < listeners.length; i++) {
        sock.removeListener(listeners[i].name, listeners[i].func);
      }
    };

    return {
      addEvent: addEvent,
      addUser: addUser,
      addVote: addVote,
      getUsers: getUsers,
      getVotes: getVotes,
      removeListeners: removeListeners
    };
  };
})(window.Josh = window.Josh || {}, window.jQuery);

(function (Josh) {
  "use strict";
  Josh.User = function (username) {
    this.username = username;
  };
})(window.Josh = window.Josh || {});

(function (Josh, $) {
  "use strict";
  //privates
  var actsUl,
    alertDiv,
    area,
    clearButt,
    loginDiv,
    locError,
    markerDiv,
    RestIcon,
    restaurantDiv,
    search,
    searchText,
    socket,
    stamen,
    tab1,
    tab2,
    This,
    titleh,
    votesUl;

  Josh.Map = function (id) {
    //init private variables
    locError = function () {
    };
    markerDiv = document.getElementById('fsRest');
    actsUl = document.getElementById('acts');
    votesUl = document.getElementById('votes');
    loginDiv = document.getElementById('loginArea');
    search = document.getElementById('search');
    searchText = $('#searchText');
    socket = new Josh.Socket(io.connect('//' + location.host + '/users'));//new Josh.Socket('http://' + location.host + '/users');
    stamen = new L.StamenTileLayer("toner-lite");
    clearButt = document.getElementById('clear');
    titleh = $('#title');
    alertDiv = $('#alert');
    restaurantDiv = document.getElementById('restSearch');
    tab1 = document.getElementById('tab1');
    tab2 = document.getElementById('tab2');
    This = this;

    RestIcon = L.Icon.extend({
      options: {
        shadowUrl: null,
        iconSize: new L.Point(32, 32)
      }
    });

    //init public variables
    this.currentFSID = null;
    this.currentUser = null;
    this.location = null;
    this.map = new L.Map(id, {zoomAnimation: true});
    this.map.addLayer(stamen);
    this.searchFs = {};
    this.searchLayer = null;
    this.voteFs = new Josh.Votes();

    //get loc
    navigator.geolocation.getCurrentPosition(function (location) {
      This.centerLoc(location);
    }, locError, {timeout: 10000});

    //wire events
    $(window).on('Vote.Map', function (e, fs) {
      if (This.currentUser !== null) {
        socket.addVote(fs);
      } else {
        This.addAlert('You must be logged in!');
      }
    });

    $(window).on('ShowRestaurant.Map', function (e, fsid) {
      This.showRest(fsid);
    });

    $(window).on('AddUser.Map', function (e, user) {
      This.addUser(user);
    });

    $(window).on('SignoutUser.Map', function (e) {
      This.removeUser();
    });

    $(window).on('RestaurantSearch.Map', function (e, search) {
      This.addAlert('Searching for Restaurants');
      This.findRests(search);
      This.removeAlert();
    });

    $(window).on('ClearRestaurantSearch.Map', function (e) {
      This.addSearchLayer({});
    });

    alertDiv.on('click', function () {
      This.removeAlert();
    });

    $(this.voteFs).on('removeLayer', function (e, d) {
      This.removeLayer(d);
    });

    window.addEventListener("hashchange", function () {
      window.location.reload();
    });

    //socket events
    socket.addEvent('serverError', this);

    $(this).on('serverError', function (e, d) {
      this.addAlert(d.message);
    });

    socket.addEvent('vote', this);

    $(this).on('vote', function (e, d) {
      //first check to see if it exists in the vote db
      if (this.voteFs.votes[d.fs.id] === undefined) {
        var marker = this.addMarker(d.fs);
        d.fs.marker = marker;
      }
      var votingUser = new Josh.User(d.username);
      d.fs.user = [votingUser];

      $(window).trigger('ServerVote', {name: d.fs.name, user: votingUser, id: d.fs.id});
      this.voteFs.addVote(d.fs);
      this.showVotes();
    });

    //see if we have a hash area
    if (window.location.hash) {
      area = String(window.location.hash).slice(1);
      titleh.html(area);
    } else {
      //set to default
      area = 'default';
    }

    //render user login
    React.render(React.createElement(LoginForm, null), $(loginDiv)[0]);

    //check the cookies for a current user
    var myusername = Josh.Cookie.readCookie('username');
    if (myusername !== null) {
      this.addUser(myusername);
    }

    //render React and get location
    React.render(React.createElement(RestaurantWell, null), restaurantDiv);
    React.render(React.createElement(ActivityDisplay, null), tab2);
  };

  Josh.Map.prototype = {
    addAlert: function (message) {
      alertDiv.removeClass('none');
      alertDiv.html(message);
    },

    addMarker: function (fs, layeradd) {
      layeradd = typeof layeradd !== 'undefined' ? layeradd : true;

      var icon;
      if (fs.categories.length > 0) {
        icon = new RestIcon({iconUrl: fs.categories[0].icon.prefix + 'bg_32' + fs.categories[0].icon.suffix});
      } else {
        icon = new L.Icon({iconUrl: 'images/marker.png'});
      }

      var markerLocation = new L.LatLng(fs.location.lat, fs.location.lng);
      var marker = new L.Marker(markerLocation, {icon: icon, title: fs.name});
      marker.fsid = fs.id;
      marker.img = icon.iconUrl;
      marker.on('click', this.showRestProxy.bind(this));
      if (layeradd) {
        this.map.addLayer(marker);
      }

      return marker;
    },

    addSearchFs: function (fs) {
      this.searchFs[fs.id] = fs;
    },

    addSearchLayer: function (rests) {
      if (this.searchLayer !== null) {
        //remove all the current restaurants
        this.removeLayer(this.searchLayer);
      }
      this.searchLayer = new L.LayerGroup();

      for (var id in rests) {
        this.addSearchFs(rests[id]);
        var marker = this.addMarker(rests[id], false);
        this.searchLayer.addLayer(marker);
      }

      this.map.addLayer(this.searchLayer);

    },

    addUser: function (username) {
      if (username === '') {
        return;
      }

      //add cookie for user
      Josh.Cookie.createCookie('username', username);
      this.currentUser = new Josh.User(username);

      $(window).trigger('NewUser', this.currentUser);

      socket.addUser(username, area, function () {
        socket.getVotes();
      });

    },

    centerLoc: function (loc) {
      this.location = loc;
      var hull = new L.LatLng(this.location.coords.latitude, this.location.coords.longitude);
      this.map.setView(hull, 13);
    },

    findFs: function (fsid) {
      if (this.voteFs.votes[fsid]) {
        return this.voteFs.votes[fsid];
      } else {
        return this.searchFs[fsid];
      }
    },

    findRests: function (query) {
      if (query !== '') {
        query = encodeURI(query);
      } else {
        query = encodeURI('restaurant');
      }

      var foursquare = $.getJSON('/foursquare?lat=' + this.location.coords.latitude + '&lon=' + this.location.coords.longitude + '&query=' + query);

      foursquare.done(function (data) {
        var rests = data.response.venues;
        this.addSearchLayer(rests);
      }.bind(this));
    },

    removeAlert: function () {
      alertDiv.addClass('none');
    },

    removeLayer: function (arg) {
      if (arg.getLayers !== undefined) {
        var layers = arg.getLayers();
        for (var i = 0; i < layers.length; i++) {
          this.removeMarker(layers[i]);
        }
      }
      this.map.removeLayer(arg);
    },

    removeMarker: function removeMarker(marker) {
      marker.clearAllEventListeners();
    },

    removeUser: function () {
      Josh.Cookie.eraseCookie('username');
      Josh.Cookie.eraseCookie('img');
      this.currentUser = null;
      $(window).trigger('NewUser', this.currentUser);
    },

    showRest: function (fsid) {
      var fs = this.findFs(fsid);
      this.currentFSID = fsid;
      React.render(React.createElement(RestaurantDisplay, {fs: fs}), markerDiv);
    },

    showRestProxy: function showRestProxy(e) {
      this.showRest(e.target.fsid);
    },

    showVotes: function () {
      var voteArray = [];
      for (var r in this.voteFs.votes) {
        voteArray.push([this.voteFs.votes[r].name, this.voteFs.votes[r].user.length, this.voteFs.votes[r].id, this.voteFs.votes[r].user]);
      }
      voteArray.sort(function (a, b) {
        return b[1] - a[1];
      });
      for (var i = 0; i < voteArray.length; i++) {
        if (this.currentFSID === voteArray[i][2]) {
          this.showRest(voteArray[i][2]);
        }
      }

      React.render(React.createElement(VoteDisplay, {votes: voteArray}), tab1);
    }
  };

})(window.Josh = window.Josh || {}, window.jQuery);


(function (Josh, $) {
  "use strict";
  Josh.Votes = function () {
    this.votes = {};
    this.users = {};
  };

  Josh.Votes.prototype = {
    addVote: function (vote) {
      var userVote = this.findByUser(vote.user[0].username);

      if (userVote !== undefined) {
        var fsVote = this.findByFs(userVote);

        fsVote.user = this.removeFromArray(vote.user[0].username, fsVote.user);
      }

      this.users[vote.user[0].username] = vote.id;

      var newVote = this.findByFs(vote.id);
      if (newVote === undefined) {
        this.votes[vote.id] = vote;
        newVote = vote;
      } else {
        newVote.user.push(vote.user[0]);
      }

      this.cleanUpRestaurants();
    },

    cleanUpRestaurants: function () {
      for (var i in this.votes) {
        if (this.votes[i].user.length === 0) {
          $(this).trigger('removeLayer', this.votes[i].marker);
          delete this.votes[i];
        }
      }
    },

    findByFs: function (fsid) {
      return this.votes[fsid];
    },

    findByUser: function (username) {
      return this.users[username];
    },

    removeFromArray: function (username, users) {
      var newArray = [];
      for (var i = 0; i < users.length; i++) {
        if (users[i].username !== username) {
          newArray.push(users[i]);
        }
      }
      return newArray;
    }
  };
})(window.Josh = window.Josh || {}, window.jQuery);
