/* ========================================================
 * bootstrap-tab.js v2.0.4
 * http://twitter.github.com/bootstrap/javascript.html#tabs
 * ========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ======================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* TAB CLASS DEFINITION
  * ==================== */

  var Tab = function ( element ) {
    this.element = $(element)
  }

  Tab.prototype = {

    constructor: Tab

  , show: function () {
      var $this = this.element
        , $ul = $this.closest('ul:not(.dropdown-menu)')
        , selector = $this.attr('data-target')
        , previous
        , $target
        , e

      if (!selector) {
        selector = $this.attr('href')
        selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
      }

      if ( $this.parent('li').hasClass('active') ) return

      previous = $ul.find('.active a').last()[0]

      e = $.Event('show', {
        relatedTarget: previous
      })

      $this.trigger(e)

      if (e.isDefaultPrevented()) return

      $target = $(selector)

      this.activate($this.parent('li'), $ul)
      this.activate($target, $target.parent(), function () {
        $this.trigger({
          type: 'shown'
        , relatedTarget: previous
        })
      })
    }

  , activate: function ( element, container, callback) {
      var $active = container.find('> .active')
        , transition = callback
            && $.support.transition
            && $active.hasClass('fade')

      function next() {
        $active
          .removeClass('active')
          .find('> .dropdown-menu > .active')
          .removeClass('active')

        element.addClass('active')

        if (transition) {
          element[0].offsetWidth // reflow for transition
          element.addClass('in')
        } else {
          element.removeClass('fade')
        }

        if ( element.parent('.dropdown-menu') ) {
          element.closest('li.dropdown').addClass('active')
        }

        callback && callback()
      }

      transition ?
        $active.one($.support.transition.end, next) :
        next()

      $active.removeClass('in')
    }
  }


 /* TAB PLUGIN DEFINITION
  * ===================== */

  $.fn.tab = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('tab')
      if (!data) $this.data('tab', (data = new Tab(this)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.tab.Constructor = Tab


 /* TAB DATA-API
  * ============ */

  $(function () {
    $('body').on('click.tab.data-api', '[data-toggle="tab"], [data-toggle="pill"]', function (e) {
      e.preventDefault()
      $(this).tab('show')
    })
  })

}(window.jQuery);
//for jsLint these are defined in other files
//except Josh that is here in the self executing functions

/*global L:true Josh:true md5:true io: true */

(function(Josh){
	"use strict";
	Josh.Cookie = {};
	Josh.Cookie.createCookie = function(name, value, days) {
			var expires;
			if (days) {
				var date = new Date();
				date.setTime(date.getTime()+(days*24*60*60*1000));
				expires = "; expires="+date.toGMTString();
			}
			else{
				expires = "";
			}
			document.cookie = name+"="+value+expires+"; path=/";
		};

	Josh.Cookie.readCookie = function(name) {
		var nameEQ = name + "=";
		var ca = document.cookie.split(';');
		for(var i=0;i < ca.length;i++) {
			var c = ca[i];
			while (c.charAt(0)===' ') {c = c.substring(1,c.length);}
			if (c.indexOf(nameEQ) === 0){ return c.substring(nameEQ.length,c.length);}
		}
		return null;
	};

	Josh.Cookie.eraseCookie = function(name) {
		Josh.Cookie.createCookie(name,"",-1);
	};
})(window.Josh = window.Josh || {});

(function(Josh, $){
	"use strict";
	var sock;

	Josh.Socket = function(url){
		init(url);
	};

	var init = function(url){
		sock = io.connect(url);
	};

	Josh.Socket.prototype.addEvent = function(name, obj){
		sock.on(name, function(d){
			$(obj).trigger(name, d);
			});
	};

	Josh.Socket.prototype.getVotes = function(){
		sock.emit('getVotes');
	};

	Josh.Socket.prototype.getUsers = function(){
		sock.emit('get');
	};

	Josh.Socket.prototype.addUser = function(username, img, area, cb){
		sock.emit('add', username, img, area, function(){cb();});
	};

	Josh.Socket.prototype.addVote = function(fs){
		//make a copy of the object to send to the server
		//we only need basic info as the rest will be
		//built client side
		var fsSend = $.extend(true, {}, fs);
		//delete what we don't need
		delete fsSend.marker;
        delete fsSend.user;
		sock.emit('addVote', fsSend);
	};

	return Josh.Socket;
})(window.Josh = window.Josh || {},  window.jQuery);

(function(Josh){
	"use strict";
	Josh.User = function(username, img){
		this.username = username;
		this.img = img;
		this.imgHTML = '<img src="' + img + '" class="userimg" title="' + username + '">';
	};
})(window.Josh = window.Josh || {});

(function(Josh, $){
	"use strict";
	var RestIcon;
	var markerDiv;
	var votesUl;
	var actsUl;
	var loginDiv;
	var search;
	var searchText;
	var clearButt;
	var titleh;
	var area;
	var socket;
	var alertDiv;
    var locError = function(){};

	Josh.Map = function(id){
		socket = new Josh.Socket('http://' + location.host + '/users');
		this.map = new L.Map(id, {zoomAnimation: true});
        var stamen = new L.StamenTileLayer("toner-lite");
        this.map.addLayer(stamen);

		RestIcon = L.Icon.extend({
            options: {
                shadowUrl: null,
                iconSize: new L.Point(32, 32)
            }
		});


		markerDiv = document.getElementById('fsRest');
		actsUl = document.getElementById('acts');
		votesUl = document.getElementById('votes');
		loginDiv = document.getElementById('loginArea');
		search = document.getElementById('search');
		searchText = $('#searchText');
		clearButt = document.getElementById('clear');
		titleh = $('#title');
		alertDiv = $('#alert');

		var This = this;

		navigator.geolocation.getCurrentPosition(function(location){This.centerLoc(location);},locError,{timeout:10000});

		$(markerDiv).on('click', 'button', function(e){
			var target = $(e.target);
				if(This.currentUser !== null){
				var fsid = target.attr('data-fsid');
				var fs = This.findFs(fsid);
				socket.addVote(fs);
			}else{
				This.addAlert('You must be logged in!');
			}
		});

		$(votesUl).on('click', 'li a', function(e){
			e.preventDefault();
			This.showRest($(e.target).attr('data-fsid'));
		});

		$(actsUl).on('click', 'li a', function(e){
			e.preventDefault();
			This.showRest($(e.target).attr('data-fsid'));
		});

		$(loginDiv).on('focusout', 'input', function(e){
			var username = $(e.target).val();
			This.addUser(username);
		});

		$(loginDiv).on('click', 'a', function(e){
			e.preventDefault();
			This.removeUser();
		});

		$(search).on('click', function(e){
			This.addAlert('Searching for Restaurants');
			e.preventDefault();
			This.findRests(searchText.val());
			This.removeAlert();
		});

		$(clearButt).on('click', function(e){
			e.preventDefault();
			//add a blank search layer
			searchText.val('');
			This.addSearchLayer({});
		});

		alertDiv.on('click', function(){
			This.removeAlert();
		});


		this.searchFs = {};
		this.voteFs = new Josh.Votes();
		this.currentUser = null;
		this.searchLayer = null;
		this.location = null;

		socket.addEvent('vote', this);

		$(this).on('vote', function(e, d){
			//first check to see if it exists in the vote db
			if(this.voteFs.votes[d.fs.id] === undefined){
				var marker = this.addMarker(d.fs);
				d.fs.marker = marker;
			}

			d.fs.user = [new Josh.User(d.username, d.img)];
			this.addActivity(d.fs.user[0], d.fs.name, d.fs.id);
			this.voteFs.addVote(d.fs);
			this.showVotes();
		});

		socket.addEvent('serverError', this);

		$(this).on('serverError', function(e, d){
			this.addAlert(d.message);
		});

		$(this.voteFs).on('removeLayer', function(e,d){
			This.removeLayer(d);
		});

		//listen for a hash change
		window.addEventListener("hashchange", function(){window.location.reload();});
		//see if we have a hash area
		if(window.location.hash) {
			area = String(window.location.hash).slice(1);
			titleh.html(area);
		} else {
			//set to default
			area = 'default';
		}

		//check the cookies for a current user
		var myusername = Josh.Cookie.readCookie('username');
		if(myusername !== null){
			this.addUser(myusername);
		}
	};

	Josh.Map.prototype = {
		centerLoc: function(loc){
			this.location = loc;
			var hull = new L.LatLng(this.location.coords.latitude, this.location.coords.longitude);
			this.map.setView(hull, 13);
		},

		addMarker: function(fs, layeradd){
			layeradd = typeof layeradd !== 'undefined' ? layeradd : true;

			var icon;
			if(fs.categories.length > 0){
				icon = new RestIcon( { iconUrl: fs.categories[0].icon.prefix + 'bg_32' + fs.categories[0].icon.suffix});
			}else{
				icon = new L.Icon( {iconUrl: 'images/marker.png'});
			}

			var markerLocation = new L.LatLng(fs.location.lat, fs.location.lng);
			var marker = new L.Marker(markerLocation, {icon: icon, title: fs.name});
			marker.fsid = fs.id;
			marker.img = icon.iconUrl;
			marker.on('click', this.showRestProxy.bind(this));
			if(layeradd){
				this.map.addLayer(marker);
			}

			return marker;
		},

        removeMarker: function removeMarker(marker) {
            marker.clearAllEventListeners();
        },

		removeLayer: function(arg){
            if (arg.getLayers !== undefined){
                var layers = arg.getLayers();
                for(var i = 0; i < layers.length; i++){
                    this.removeMarker(layers[i]);
                }
            }
			this.map.removeLayer(arg);
		},

		addSearchLayer: function(rests){
			if(this.searchLayer !== null){
				//remove all the current restaurants
				this.removeLayer(this.searchLayer);
			}
			this.searchLayer = new L.LayerGroup();

			for(var id in rests){
				this.addSearchFs(rests[id]);
				var marker = this.addMarker(rests[id], false);
				this.searchLayer.addLayer(marker);
			}

			this.map.addLayer(this.searchLayer);

		},

        showRestProxy: function showRestProxy(e){
            this.showRest(e.target.fsid);
        },

		showRest: function(fsid){
			var fs = this.findFs(fsid);

			var img;
			if(fs.categories.length > 0){
				img = fs.categories[0].icon.prefix + 'bg_32' + fs.categories[0].icon.suffix;
			}else{
				img = 'images/marker.png';
			}

			var htmld = '<h3><img src="' + img + '">' + fs.name + '</h3>';

			if(fs.phone !== undefined){
				htmld += '<div>Phone: ' + fs.phone + '</div>';
			}

			if(fs.menu !== undefined){
				htmld += '<div><a href="' + fs.menu.url + '" target="_blank">Menu</a></div>';
			}

			//htmld += '<div>Distance: ' + fs.distance + '</div>';
			if(fs.user !== undefined){
				htmld += '<div>Votes: ' + fs.user.length + '</div>';
				htmld += '<div>';
				for(var i = 0; i < fs.user.length; i++){
					htmld += fs.user[i].imgHTML;
				}
				htmld += '</div>';
			}
			htmld += '<button class="btn" data-fsid="' + fs.id + '">Vote for Me</button>';
			$(markerDiv).html(htmld);
		},

		addSearchFs: function(fs){
			this.searchFs[fs.id] = fs;
		},

		removeSearchFs: function(){
			//this is removed as a group
			this.searchFs = {};
		},

		findFs: function(fsid){
			if(this.voteFs.votes[fsid]){
				return this.voteFs.votes[fsid];
			}else{
				return this.searchFs[fsid];
			}
		},

		addUser: function(username){
			if(username === ''){
				return;
            }

			var re = new RegExp("^(fb:)?");
			var usersplit = username.split(re);
			var type;
			if(usersplit.length > 1)
			{
				//we have a match
				//grab the end piece
				type = usersplit[usersplit.length-2];
				username = usersplit[usersplit.length-1];
			}else{
				type = 'gravatar';
			}

			var img;
			if(type && type === 'fb:')
			{
				img = document.createElement('img');
				img.setAttribute('src', 'https://graph.facebook.com/' + username + '/picture?type=square');
			}else if(Josh.Cookie.readCookie('img') !== null){
				img = document.createElement('img');
				img.setAttribute('src', Josh.Cookie.readCookie('img'));
			}else{
				var emailhash = md5(username.toLowerCase());
				img = document.createElement('img');
				img.setAttribute('src', 'http://www.gravatar.com/avatar/' + emailhash + '?d=retro&s=18');
			}

			this.currentUser = new Josh.User(username, img.src);

			var userhtml = this.currentUser.imgHTML + username + ' : <a href="#">Sign out</a>';
			$(loginDiv).html(userhtml);

			//add cookie for use
			Josh.Cookie.createCookie('username', username);
			Josh.Cookie.createCookie('img', img.src);

			socket.addUser(String(username), String(img.src), area, function(){
				socket.getVotes();
			});
		},

		removeUser: function(){
			Josh.Cookie.eraseCookie('username');
			Josh.Cookie.eraseCookie('img');
			this.currentUser = null;
			//send message to server?
			$(loginDiv).html('<input id="login" type="text" placeholder="email">');
		},

		addActivity: function(user, fsName, fsid){
			var lihtml = '<li>' + user.imgHTML + user.username + ' voted for <a href="#" data-fsid="' + fsid + '">' + fsName + '</li><hr/>';

			$(actsUl).append(lihtml);
		},

		showVotes: function(){
			var voteArray = [];
			for(var r in this.voteFs.votes){
				voteArray.push([this.voteFs.votes[r].name, this.voteFs.votes[r].user.length, this.voteFs.votes[r].id, this.voteFs.votes[r].user]);
			}
			voteArray.sort(function(a, b){return b[1] - a[1];});
			var lihtml = '';
			for(var i =0; i < voteArray.length; i++){
				lihtml += '<li>' + voteArray[i][1] + ' for <a href="#" data-fsid="' + voteArray[i][2] + '">' + voteArray[i][0] + '</a></li>';
				for(var u=0; u < voteArray[i][3].length; u++){
					lihtml += voteArray[i][3][u].imgHTML;
				}
			}

			$(votesUl).html(lihtml);
		},

		findRests: function(query){
			if(query !== ''){
				query = encodeURI(query) ;
			}else{
				query = encodeURI('restaurant') ;
			}

			var foursquare = $.getJSON( '/foursquare?lat=' + this.location.coords.latitude + '&lon=' + this.location.coords.longitude + '&query=' + query);

			foursquare.done(function(data){
				var rests = data.response.venues;
				this.addSearchLayer(rests);
			}.bind(this));
		},

		addAlert: function(message){
			alertDiv.removeClass('none');
			alertDiv.html(message);
		},

		removeAlert: function(){
			alertDiv.addClass('none');
		}
	};

})(window.Josh = window.Josh || {},  window.jQuery);


(function(Josh, $){
	"use strict";
	Josh.Votes = function(){
		this.votes = {};
	};

	Josh.Votes.prototype = {
		addVote: function(vote){
			//first check to see if this person has voted already
			var userVote = this.findByUser(vote.user[0].username);
			if(userVote !== undefined){
				//this person voted, now check to see if this is the only vote
				if(userVote.user.length === 1){
					//only this person voted for this restaurant delete it
					//but first take the marker off the map
					//after checking to see if the new vote has a marker
					if(vote.marker === undefined){
						//it doesn't so pass the marker
						vote.marker = userVote.marker;
					}
					if(vote.id !== userVote.id){
						//delete the marker only if the two rests are not the same
						$(this).trigger('removeLayer', userVote.marker);
					}
				}else{
					//multiple people voted for it, just remove their vote
					for(var i=0; i < userVote.user.length; i++){
						if(userVote.user[i].username === vote.user[0].username){
							//we found it! Remove only this user
							//put the vote back in
							this.votes[userVote.id] = userVote;
						}
					}
				}
			}

			//now check to see if the restaurant exists
			var restVote = this.findByFs(vote.id);
			if(restVote !== undefined){
				//add the user to the user list
				restVote.user.push(vote.user[0]);
				//put the vote back in
				this.votes[restVote.id] = restVote;
			}else{
				//nothing else is true
				//add it to the object
				this.votes[vote.id] = vote;
			}

		},

		findByUser: function(username){
			for(var i in this.votes){
				for(var u=0; u < this.votes[i].user.length; u++){
					if(this.votes[i].user[u].username === username){
						var retEl = this.votes[i];
						delete this.votes[i];
						return retEl;
					}
				}
			}
		},

		findByFs: function(fsid){
			var retEl = this.votes[fsid];
			delete this.votes[fsid];
			return retEl;
		}

	};
})(window.Josh = window.Josh || {},  window.jQuery);

/*!
 * Joseph Myer's md5() algorithm wrapped in a self-invoked function to prevent
 * global namespace polution, modified to hash unicode characters as UTF-8.
 *  
 * Copyright 1999-2010, Joseph Myers, Paul Johnston, Greg Holt, Will Bond <will@wbond.net>
 * http://www.myersdaily.org/joseph/javascript/md5-text.html
 * http://pajhome.org.uk/crypt/md5
 * 
 * Released under the BSD license
 * http://www.opensource.org/licenses/bsd-license
 */
(function() {
	function md5cycle(x, k) {
		var a = x[0], b = x[1], c = x[2], d = x[3];

		a = ff(a, b, c, d, k[0], 7, -680876936);
		d = ff(d, a, b, c, k[1], 12, -389564586);
		c = ff(c, d, a, b, k[2], 17, 606105819);
		b = ff(b, c, d, a, k[3], 22, -1044525330);
		a = ff(a, b, c, d, k[4], 7, -176418897);
		d = ff(d, a, b, c, k[5], 12, 1200080426);
		c = ff(c, d, a, b, k[6], 17, -1473231341);
		b = ff(b, c, d, a, k[7], 22, -45705983);
		a = ff(a, b, c, d, k[8], 7, 1770035416);
		d = ff(d, a, b, c, k[9], 12, -1958414417);
		c = ff(c, d, a, b, k[10], 17, -42063);
		b = ff(b, c, d, a, k[11], 22, -1990404162);
		a = ff(a, b, c, d, k[12], 7, 1804603682);
		d = ff(d, a, b, c, k[13], 12, -40341101);
		c = ff(c, d, a, b, k[14], 17, -1502002290);
		b = ff(b, c, d, a, k[15], 22, 1236535329);

		a = gg(a, b, c, d, k[1], 5, -165796510);
		d = gg(d, a, b, c, k[6], 9, -1069501632);
		c = gg(c, d, a, b, k[11], 14, 643717713);
		b = gg(b, c, d, a, k[0], 20, -373897302);
		a = gg(a, b, c, d, k[5], 5, -701558691);
		d = gg(d, a, b, c, k[10], 9, 38016083);
		c = gg(c, d, a, b, k[15], 14, -660478335);
		b = gg(b, c, d, a, k[4], 20, -405537848);
		a = gg(a, b, c, d, k[9], 5, 568446438);
		d = gg(d, a, b, c, k[14], 9, -1019803690);
		c = gg(c, d, a, b, k[3], 14, -187363961);
		b = gg(b, c, d, a, k[8], 20, 1163531501);
		a = gg(a, b, c, d, k[13], 5, -1444681467);
		d = gg(d, a, b, c, k[2], 9, -51403784);
		c = gg(c, d, a, b, k[7], 14, 1735328473);
		b = gg(b, c, d, a, k[12], 20, -1926607734);

		a = hh(a, b, c, d, k[5], 4, -378558);
		d = hh(d, a, b, c, k[8], 11, -2022574463);
		c = hh(c, d, a, b, k[11], 16, 1839030562);
		b = hh(b, c, d, a, k[14], 23, -35309556);
		a = hh(a, b, c, d, k[1], 4, -1530992060);
		d = hh(d, a, b, c, k[4], 11, 1272893353);
		c = hh(c, d, a, b, k[7], 16, -155497632);
		b = hh(b, c, d, a, k[10], 23, -1094730640);
		a = hh(a, b, c, d, k[13], 4, 681279174);
		d = hh(d, a, b, c, k[0], 11, -358537222);
		c = hh(c, d, a, b, k[3], 16, -722521979);
		b = hh(b, c, d, a, k[6], 23, 76029189);
		a = hh(a, b, c, d, k[9], 4, -640364487);
		d = hh(d, a, b, c, k[12], 11, -421815835);
		c = hh(c, d, a, b, k[15], 16, 530742520);
		b = hh(b, c, d, a, k[2], 23, -995338651);

		a = ii(a, b, c, d, k[0], 6, -198630844);
		d = ii(d, a, b, c, k[7], 10, 1126891415);
		c = ii(c, d, a, b, k[14], 15, -1416354905);
		b = ii(b, c, d, a, k[5], 21, -57434055);
		a = ii(a, b, c, d, k[12], 6, 1700485571);
		d = ii(d, a, b, c, k[3], 10, -1894986606);
		c = ii(c, d, a, b, k[10], 15, -1051523);
		b = ii(b, c, d, a, k[1], 21, -2054922799);
		a = ii(a, b, c, d, k[8], 6, 1873313359);
		d = ii(d, a, b, c, k[15], 10, -30611744);
		c = ii(c, d, a, b, k[6], 15, -1560198380);
		b = ii(b, c, d, a, k[13], 21, 1309151649);
		a = ii(a, b, c, d, k[4], 6, -145523070);
		d = ii(d, a, b, c, k[11], 10, -1120210379);
		c = ii(c, d, a, b, k[2], 15, 718787259);
		b = ii(b, c, d, a, k[9], 21, -343485551);

		x[0] = add32(a, x[0]);
		x[1] = add32(b, x[1]);
		x[2] = add32(c, x[2]);
		x[3] = add32(d, x[3]);
	}

	function cmn(q, a, b, x, s, t) {
		a = add32(add32(a, q), add32(x, t));
		return add32((a << s) | (a >>> (32 - s)), b);
	}

	function ff(a, b, c, d, x, s, t) {
		return cmn((b & c) | ((~b) & d), a, b, x, s, t);
	}

	function gg(a, b, c, d, x, s, t) {
		return cmn((b & d) | (c & (~d)), a, b, x, s, t);
	}

	function hh(a, b, c, d, x, s, t) {
		return cmn(b ^ c ^ d, a, b, x, s, t);
	}

	function ii(a, b, c, d, x, s, t) {
		return cmn(c ^ (b | (~d)), a, b, x, s, t);
	}

	function md51(s) {
		// Converts the string to UTF-8 "bytes" when necessary
		if (/[\x80-\xFF]/.test(s)) {
			s = unescape(encodeURI(s));
		}
		txt = '';
		var n = s.length, state = [1732584193, -271733879, -1732584194, 271733878], i;
		for (i = 64; i <= s.length; i += 64) {
			md5cycle(state, md5blk(s.substring(i - 64, i)));
		}
		s = s.substring(i - 64);
		var tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		for (i = 0; i < s.length; i++)
		tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
		tail[i >> 2] |= 0x80 << ((i % 4) << 3);
		if (i > 55) {
			md5cycle(state, tail);
			for (i = 0; i < 16; i++) tail[i] = 0;
		}
		tail[14] = n * 8;
		md5cycle(state, tail);
		return state;
	}

	function md5blk(s) { /* I figured global was faster.   */
		var md5blks = [], i; /* Andy King said do it this way. */
		for (i = 0; i < 64; i += 4) {
			md5blks[i >> 2] = s.charCodeAt(i) +
			                  (s.charCodeAt(i + 1) << 8) +
			                  (s.charCodeAt(i + 2) << 16) +
			                  (s.charCodeAt(i + 3) << 24);
		}
		return md5blks;
	}

	var hex_chr = '0123456789abcdef'.split('');

	function rhex(n) {
		var s = '', j = 0;
		for (; j < 4; j++)
		s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] +
		     hex_chr[(n >> (j * 8)) & 0x0F];
		return s;
	}

	function hex(x) {
		for (var i = 0; i < x.length; i++)
		x[i] = rhex(x[i]);
		return x.join('');
	}

	md5 = function (s) {
		return hex(md51(s));
	}

	/* this function is much faster, so if possible we use it. Some IEs are the
	only ones I know of that need the idiotic second function, generated by an
	if clause.  */
	function add32(a, b) {
		return (a + b) & 0xFFFFFFFF;
	}

	if (md5('hello') != '5d41402abc4b2a76b9719d911017c592') {
		function add32(x, y) {
			var lsw = (x & 0xFFFF) + (y & 0xFFFF),
			    msw = (x >> 16) + (y >> 16) + (lsw >> 16);
			return (msw << 16) | (lsw & 0xFFFF);
		}
	}
})();