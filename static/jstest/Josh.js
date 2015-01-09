module('Josh.Cookie');
test('Cookie Creation', function () {
  Josh.Cookie.createCookie('testCookie', 'test');
  strictEqual(Josh.Cookie.readCookie('testCookie'), 'test', 'Cookie was set and read');
});
test('Cookie Deletion', function () {
  Josh.Cookie.eraseCookie('testCookie');
  strictEqual(Josh.Cookie.readCookie('testCookie'), null, 'Cookie was deleted');
});

module('Josh.Map', {
  setup: function () {
    window.location.hash = '#qunitTesting';
    Josh.Cookie.eraseCookie('username');
    this.map = new Josh.Map('map');
    this.location = {coords: {latitude: 41.6, longitude: -86.2}};
    this.fsobjects = [{
      id: "4ba541f0f964a520a1f238e3", name: "Texas Roadhouse",
      location: {lat: 41.62753698363018, lng: -86.2516450881958},
      menu: {url: "https://foursquare.com/v/texas-roadhouse/4ba541f0f964a520a1f238e3/menu"},
      categories: [{icon: {prefix: "https://ss1.4sqi.net/img/categories_v2/food/steakhouse_", suffix: ".png"}}]
    },
      {
        id: "4b9ef9daf964a520df0d37e3", name: "Jovi's",
        location: {lat: 41.62753698363018, lng: -86.2516450881958},
        categories: []
      }];
  }
});
test('Map Creation', function () {
  equal($('#map').children('.leaflet-map-pane').length, 1, 'The map should have a child with leaflet-map-pane class');
  ok(this.map.map instanceof L.Map, 'The map object should be a Leaflet Map object');
  equal(this.map.currentUser, null, 'The current User object should be blank');
  equal(this.map.searchLayer, null, 'The searchLayer object should be blank');
  equal(this.map.location, null, 'Location should be null');
  this.map.centerLoc(this.location);
  notEqual(this.map.location, null, 'Location should not be null after centering');

});
test('Add a User', function () {
  this.map.addUser('');
  equal(this.map.currentUser, null, 'A blank username should not set the user');
  equal($('#loginArea').find('input').length, 1, 'The input text box should still be present');

  this.map.addUser('test');
  equal($('#loginArea').find('input').length, 0, 'The input text box should be gone');
  equal(Josh.Cookie.readCookie('username'), 'test', 'A cookie should have been set with the correct username');
  this.map.removeUser();

  this.map.addUser('fb:test');
  equal($('#loginArea').find('input').length, 0, 'The input text box should be gone');
  equal(Josh.Cookie.readCookie('username'), 'fb:test', 'A cookie should have been set with the correct username');
  this.map.removeUser();

  //use event
  $(window).trigger('AddUser', 'test');
  stop();
  setTimeout(function(){
    start();
    equal($('#loginArea').find('input').length, 0, 'The input text box should be gone');
  equal(Josh.Cookie.readCookie('username'), 'test', 'A cookie should have been set with the correct username');
  this.map.removeUser();
  }.bind(this), 75);
});
test('Remove a User', function () {
  this.map.addUser('test');
  this.map.removeUser();
  equal(this.map.currentUser, null, 'Current user should be null');
  equal(Josh.Cookie.readCookie('username'), null, 'Cookie was deleted');
  equal($('#loginArea').find('input').length, 1, 'The input text box should be present');

  //test event
  this.map.addUser('test');
  $(window).trigger('SignoutUser');
  stop();
  setTimeout(function(){
    start();
    equal(this.map.currentUser, null, 'Current user should be null');
    equal(Josh.Cookie.readCookie('username'), null, 'Cookie was deleted');
    equal($('#loginArea').find('input').length, 1, 'The input text box should be present');
  }.bind(this), 75)
});
test('Searching for Restaurants', function () {
  this.map.centerLoc(this.location);
  this.map.addSearchLayer(this.fsobjects);

  notEqual(this.map.searchLayer, null, 'The search layer should not be null');
  deepEqual(this.map.searchFs[this.fsobjects[0].id], this.fsobjects[0], 'The fsobject should be in the searchFs object');
  equal(Object.keys(this.map.searchLayer._layers).length, 2, 'There should be two layers in the layer object of the searchLayer');
  this.map.showRest(this.fsobjects[0].id);
  equal($('#fsRest').find('img').attr('src'), this.fsobjects[0].categories[0].icon.prefix + 'bg_32' + this.fsobjects[0].categories[0].icon.suffix, 'The img should be set to the icon of the category from FourSquare');
  equal($('#fsRest').find('a').attr('href'), this.fsobjects[0].menu.url, 'The menu url should be the same as the one from FourSquare');

  this.map.showRest(this.fsobjects[1].id);
  equal($('#fsRest').find('img').attr('src'), 'images/marker.png', 'The img should be set to the default icon');
  equal($('#fsRest').find('a').length, 0, 'The menu anchor should not be present');

  deepEqual(this.map.findFs(this.fsobjects[1].id), this.fsobjects[1], 'The findFs method should return the object we gave it');

  //test for showrest event
  $(window).trigger('ShowRestaurant', this.fsobjects[1].id);
  stop();
  setTimeout(function(){
    start();
    equal($('#fsRest').find('img').attr('src'), 'images/marker.png', 'The img should be set to the default icon');
    equal($('#fsRest').find('a').length, 0, 'The menu anchor should not be present');
  }.bind(this), 200);

  //fire the clear button
  $(window).trigger('ClearRestaurantSearch');
   equal(Object.keys(this.map.searchLayer._layers).length, 0, 'There should be no layers in the searchLayers object');

   //fire the search button, this needs info from FourSquare
   $(window).trigger('RestaurantSearch', '');
   stop()

   var This = this;
   setTimeout(function(){
   start();

   notEqual(Object.keys(This.map.searchLayer._layers).length, 0, 'There should be quite a few layers here');
   notEqual(Object.keys(This.map.searchFs).length, 0, 'There should a few objects in the searchFs object as well');
   }, 2000);

});
test('Voting when not logged in', function () {
  this.map.centerLoc(this.location);
  this.map.addSearchLayer(this.fsobjects);
  this.map.showRest(this.fsobjects[0].id);
  $('#fsRest').find('button').trigger('click');
  equal(Object.keys(this.map.voteFs.votes).length, 0, 'You cannot vote if you are not logged in');
});
test('Voting when logged in', function () {
  this.map.addUser('test');
  this.map.addSearchLayer(this.fsobjects);
  this.map.showRest(this.fsobjects[0].id);
  //$('#fsRest').find('button').trigger('click');
  $(window).trigger('Vote', this.fsobjects[0]);
  stop();

  var This = this;
  setTimeout(function () {
    start();

    notEqual(This.map.voteFs.votes[This.fsobjects[0].id], undefined, 'You can vote if you are logged in');
    equal(This.map.voteFs.votes[This.fsobjects[0].id].user[0].username, 'test', 'The user that made the vote should be the one we set');
    equal(This.map.voteFs.votes[This.fsobjects[0].id].id, This.fsobjects[0].id, 'The ids should match between the two objects');
    notEqual(This.map.voteFs.votes[This.fsobjects[0].id].marker, undefined, 'The marker should be set');

    This.map.showRest(This.fsobjects[1].id);
    //$('#fsRest').find('button').trigger('click');
    $(window).trigger('Vote', This.fsobjects[1]);
    This.oldVote = This.map.voteFs.votes[This.fsobjects[0].id];

    stop();
    setTimeout(function () {
      start();

      notEqual(This.map.voteFs.votes[This.fsobjects[1].id].id, This.fsobjects[0].id, 'This vote should be a new vote');
      equal(This.map.voteFs.votes[This.fsobjects[0].id], undefined, 'The old vote should be gone');
      equal(This.map.voteFs.votes[This.fsobjects[1].id].user[0].username, 'test', 'The user that made the vote should be the one we set');
      notEqual(This.map.voteFs.votes[This.fsobjects[1].id].marker, undefined, 'The marker should be set');

      //fake a new vote
      This.oldVote.user.push(new Josh.User('newUser', 'testing'));
      This.map.voteFs.addVote(This.oldVote);
      notEqual(This.map.voteFs.votes[This.fsobjects[0].id], undefined, 'The recycled vote should be in the vote object');
      notEqual(This.map.voteFs.votes[This.fsobjects[1].id], undefined, 'The current vote should still be in the object');
      equal(This.map.voteFs.votes[This.fsobjects[0].id].user[0].username, 'newUser', 'The new vote should have the newUser username');
      notEqual(This.map.voteFs.votes[This.fsobjects[1].id].marker, undefined, 'The marker should be set for the new vote');
      notEqual(This.map.voteFs.votes[This.fsobjects[0].id].marker, undefined, 'The marker should be set for the old vote');

    }, 375);
  }, 375);
});
module('Josh.Socket', {
  setup: function () {
    this.socket = function () {
      this.emitName = null;
      this.emitArgs = null;
      this.listeners = {};

      this.emit = function (name) {
        this.emitName = name;
        this.emitArgs = arguments;
      };

      this.on = function (name, func) {
        this.listeners[name] = func;
      };

      this.callListener = function (name) {
        this.listeners[name]('data');
      };

      this.removeListener = function (name, func) {
        //no-op mock up
        this.listeners[name] = function () {
        };
      };

      return this;
    }
  }
});
test('Socket.IO emits', function () {
  var mocket = new this.socket();
  var socket = new Josh.Socket(mocket);
  socket.getUsers();
  equal(mocket.emitName, 'get', 'this should call emit for get');
  socket.getVotes();
  equal(mocket.emitName, 'getVotes', 'this should call emit for getVotes');
  var fsTest = {name: 'test', marker: 'marker', user: 'user'};
  socket.addVote(fsTest);
  equal(mocket.emitName, 'addVote', 'this should call emit for addVote');
  equal(mocket.emitArgs[1].name, 'test', 'the name should be present');
  equal(mocket.emitArgs[1].marker, undefined, 'marker should be gone');
  equal(mocket.emitArgs[1].user, undefined, 'user should be gone');
  socket.addUser('josh', 'default', function () {
  });
  equal(mocket.emitArgs[0], 'add', 'should emit the add event');
  equal(mocket.emitArgs[1], 'josh', 'username should be the second argument');
  equal(mocket.emitArgs[2], 'default', 'area should be the third argument');
});
test('addEvent', function () {
  stop();
  var mocket = new this.socket();
  var socket = new Josh.Socket(mocket);
  socket.addEvent('test', this);
  $(this).on('test.test', function (e, d) {
    $(this).off('test.test');
    start();
    equal(true, true, 'this should call the event');
    equal(d, 'data', 'with data');
  });
  mocket.callListener('test');
});
test('removeListeners', function () {
  stop();
  var mocket = new this.socket();
  var socket = new Josh.Socket(mocket);
  socket.addEvent('test', this);
  socket.removeListeners();
  $(this).on('test.test', function (e, d) {
    $(this).off('test.test');
    start();
    equal(true, false, 'this should never fire');
  });
  mocket.callListener('test');
  setTimeout(function () {
    start();
    $(this).off('test.test');
    equal(true, true, 'the event should never be fired.');
  }, 100);
});
