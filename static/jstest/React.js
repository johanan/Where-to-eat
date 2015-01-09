var ReactTestUtils = React.addons.TestUtils;

module('React Components', {
  setup: function () {
    this.react = $('#react-root');
    this.fsTest = {
      name: 'Test',
      location: {lat: 41.62753698363018, lng: -86.2516450881958},
      phone: '123',
      menu: {url: '#'},
      categories: [{icon: {prefix: 'a', suffix: '.png'}}],
      user: [{username: 'a'}, {username: 'b'}, {username: 'fb:josh'}]
    };
    this.fsTest2 = {
      name: 'Test',
      categories: [],
      location: {lat: 41.62753698363018, lng: -86.2516450881958}
    };
  }
});
test('UserDisplay', function () {
  var r = React.render(React.createElement(UserDisplay, {username: 'josh'}), this.react[0]);
  var $img = $(r.getDOMNode()).find('img')[0];
  equal($img.title, 'josh', 'The username should be the same');
  equal($img.src, 'http://www.gravatar.com/avatar/f94adcc3ddda04a8f34928d862f404b4?d=retro&s=18', 'This is based on a MD5 hash');
  React.unmountComponentAtNode(this.react[0]);
  var f = React.render(React.createElement(UserDisplay, {username: 'fb:josh'}), this.react[0]);
  $img = $(f.getDOMNode()).find('img')[0];
  equal($img.title, 'josh', 'The fb: should be removed');
  equal($img.src, 'https://graph.facebook.com/josh/picture?type=square', 'Should be a Facebook url');

  //test event
  stop();
  $(window).on('SignoutUser.test', function (e) {
    $(window).off('SignoutUser.test');
    start();
    equal(true, true, 'signoutUser should fire off SignoutUser event');
  });

  f.signoutUser();
});

test('UserDisplay clickHandler', function () {
  var r = React.render(React.createElement(UserDisplay, {username: 'josh'}), this.react[0]);
  //test event
  stop();
  $(window).on('SignoutUser.test', function (e) {
    $(window).off('SignoutUser.test');
    start();
    equal(true, true, 'click should fire off SignoutUser event');
  });

  ReactTestUtils.Simulate.click($(r.getDOMNode()).find('a')[0]);
});
test('UserLogin', function () {
  expect(1);
  stop();
  var r = React.render(React.createElement(UserLogin, null), this.react[0]);
  $(window).on('AddUser.test', function (e, user) {
    $(window).off('AddUser.test');
    start();
    equal(user, 'abc', 'addUser should fire off AddUser event');
  });
  r.addUser('abc');
});

test('UserLogin blur event', function () {
  expect(1);
  stop();
  var r = React.render(React.createElement(UserLogin, null), this.react[0]);
  $(window).on('AddUser.test', function (e, user) {
    $(window).off('AddUser.test');
    start();
    equal(user, 'abc', 'blur should fire off AddUser event');
  });
  var $input = $(r.getDOMNode()).val('abc')[0];
  ReactTestUtils.Simulate.blur($input);
});
test('UserLogin blank username', function () {
  expect(1);
  stop();
  var r = React.render(React.createElement(UserLogin, null), this.react[0]);
  setTimeout(function () {
    $(window).on('AddUser.test', function (e, user) {
      start();
      equal(true, false, 'this should not fire');
    });
    $(window).off('AddUser.test');
    r.addUser('');
    setTimeout(function () {
      start();
      equal(true, true, 'The event was not fired');
    }, 500);

  }, 750);
});
test('LoginForm', function () {
  React.render(React.createElement(LoginForm, {user: {username: 'josh'}}), this.react[0]);
  equal(this.react.find('img').length, 1, 'This should render UserDisplay with an image');
  React.render(React.createElement(LoginForm, {user: null}), this.react[0]);
  equal(this.react.find('input').length, 1, 'This should render an input with a null user');
  var r = React.render(React.createElement(LoginForm, {user: undefined}), this.react[0]);
  equal(this.react.find('input').length, 1, 'This should render an input with an undefined user');
  React.render(React.createElement(LoginForm, {user: {username: 'a'}}), this.react[0]);
  equal(this.react.find('img').length, 1, 'This should add a user with an image');
});
test('RestaurantWell', function () {
  expect(1);
  stop();
  var r = React.render(React.createElement(RestaurantWell, null), this.react[0]);
  $(window).on('RestaurantSearch.test', function (e, search) {
    $(window).off('RestaurantSearch.test');
    start();
    equal(search, 'Rest', 'restaurantSearch should fire the RestaurantSearch event');
  });
  r.restaurantSearch('Rest');
});
test('RestaurantWell clear click', function () {
  expect(2);
  stop();
  var r = React.render(React.createElement(RestaurantWell, null), this.react[0]);
  $(window).on('ClearRestaurantSearch.test', function (e) {
    $(window).off('ClearRestaurantSearch.test');
    start();
    equal(true, true, 'clear search should fire ClearRestaurantSearch event');
    equal(r.refs['restSearch'].getDOMNode().value, '', 'The input box should be blank');
  });
  r.clearRestaurantSearch();
});
test('RestaurantWell clear click', function () {
  expect(2);
  stop();
  var r = React.render(React.createElement(RestaurantWell, null), this.react[0]);
  $(window).on('ClearRestaurantSearch.test', function (e) {
    $(window).off('ClearRestaurantSearch.test');
    start();
    equal(true, true, 'clear click should fire ClearRestaurantSearch event');
    equal(r.refs['restSearch'].getDOMNode().value, '', 'The input box should be blank');
  });
  ReactTestUtils.Simulate.click($(r.getDOMNode()).find('button')[1]);
});
test('RestaurantWell Search Click', function () {
  expect(1);
  stop();
  var r = React.render(React.createElement(RestaurantWell, null), this.react[0]);
  $(window).on('RestaurantSearch.test', function (e, search) {
    $(window).off('RestaurantSearch.test');
    start();
    equal(search, 'Rest', 'search click should fire the RestaurantSearch event');
  });
  r.refs['restSearch'].getDOMNode().value = 'Rest';
  ReactTestUtils.Simulate.click($(r.getDOMNode()).find('button')[0]);
});
test('RestaurantWell blank Search Click', function () {
  expect(1);
  stop();
  var r = React.render(React.createElement(RestaurantWell, null), this.react[0]);
  $(window).on('RestaurantSearch.test', function (e, search) {
    $(window).off('RestaurantSearch.test');
    start();
    equal(search, 'restaurant', 'search click should fire the RestaurantSearch event with restaurant');
  });
  r.refs['restSearch'].getDOMNode().value = '';
  ReactTestUtils.Simulate.click($(r.getDOMNode()).find('button')[0]);
});
test('RestaurantDisplay html', function () {
  var r = React.render(React.createElement(RestaurantDisplay, {fs: this.fsTest}), this.react[0]);
  var $r = $(r.getDOMNode());
  equal($r.find('h3')[0].innerText, 'Test', 'the H3 should be the name');
  notEqual($r.find('img')[0].src.indexOf('abg_32.png'), -1, 'the img should have the category source');
  equal($r.find('div')[0].innerText, '123', 'this should be the phone number');
  notEqual($r.find('a')[0].href, undefined, 'this be the link to the menu');
  equal($r.find('div')[2].innerText, 'Votes: 3', 'this should be the votes');

  r = React.render(React.createElement(RestaurantDisplay, {fs: this.fsTest2}), this.react[0]);
  $r = $(r.getDOMNode());
  notEqual($r.find('img')[0].src.indexOf('images/marker.png'), -1, 'the img should have the category source');
  equal($r.find('div').length, 2, 'there should be no more than two divs meaning no phone or menu');
  equal($r.find('div')[0].innerText, 'Votes: 0', 'first div is votes');
});
test('RestaurantDisplay vote', function () {
  expect(1);
  stop();
  var This = this;
  var r = React.render(React.createElement(RestaurantDisplay, {fs: this.fsTest}), this.react[0]);
  $(window).on('Vote.test', function (e, fs) {
    $(window).off('Vote.test');
    start();
    equal(fs.name, 'Test', 'vote should pass the foursquare object');
  });
  r.vote(this.fsTest);
});
test('RestaurantDisplay vote click', function () {
  expect(1);
  stop();
  var This = this;
  var r = React.render(React.createElement(RestaurantDisplay, {fs: this.fsTest}), this.react[0]);
  $(window).on('Vote.test', function (e, fs) {
    $(window).off('Vote.test');
    start();
    equal(fs.name, 'Test', 'vote click should pass the foursquare object');
  });
  ReactTestUtils.Simulate.click($(r.getDOMNode()).find('button')[0]);
});
test('VoteDisplay', function () {
  var votes = [['test', , , [{username: 'a'}]],
    ['test2', , , [{username: 'b'}]]];
  expect(1);
  stop();
  var r = React.render(React.createElement(VoteDisplay, {votes: votes}), this.react[0]);
  $(window).on('ShowRestaurant.test', function (e, fs) {
    $(window).off('ShowRestaurant.test');
    start();
    equal(fs, '123', 'showRestaurant should fire the ShowRestaurant event');
  });
  r.showRestaurant('123');
});
test('VoteDisplay click event', function () {
  var votes = [['test', , '123', [{username: 'a'}]],
    ['test2', , , [{username: 'b'}]]];
  expect(1);
  stop();
  var r = React.render(React.createElement(VoteDisplay, {votes: votes}), this.react[0]);
  $(window).on('ShowRestaurant.test', function (e, fs) {
    $(window).off('ShowRestaurant.test');
    start();
    equal(fs, '123', 'showRestaurant should fire the ShowRestaurant event');
  });
  ReactTestUtils.Simulate.click($(r.getDOMNode()).find('div')[0]);
});
test('VoteDisplay DOM', function () {
  var votes = [['test', , , [{username: 'a'}]],
    ['test2', , , [{username: 'b'}]]];
  var r = React.render(React.createElement(VoteDisplay, {votes: votes}), this.react[0]);
  var $li = $(r.getDOMNode()).find('li')[0];
  notEqual($li.innerText.indexOf('1 for test'), -1, 'The text should have the amount of votes');
});
test('ActivityDisplay fire event', function () {
  expect(1);
  stop();
  var r = React.render(React.createElement(ActivityDisplay, {vote: this.fsTest}), this.react[0]);
  $(window).on('ShowRestaurant.test', function (e, fs) {
    $(window).off('ShowRestaurant.test');
    start();
    equal(fs, '123', 'showRestaurant should fire the ShowRestaurant event');
  });
  r.showRestaurant('123');
});
test('ActivityDisplay Add Vote', function () {
  var fsVote = {name: 'Test', id: '123', user: {username: 'a'}};
  var r = React.render(React.createElement(ActivityDisplay, null), this.react[0]);
  $(window).trigger('ServerVote', fsVote);
  stop();
  //time to render
  setTimeout(function () {
    start();
    var $li = $(r.getDOMNode()).find('li')[0];
    notEqual($li.innerText.indexOf('a voted for Test'), -1, 'The text should have the vote that occured');
    stop();
    $(window).on('ShowRestaurant.test', function (e, fs) {
      $(window).off('ShowRestaurant.test');
      start();
      equal(fs, '123', 'click should fire the ShowRestaurant event');
    });
    ReactTestUtils.Simulate.click($(r.getDOMNode()).find('div')[0]);
  }, 500);

});
