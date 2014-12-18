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
		this.users = {};
	};

	Josh.Votes.prototype = {
		addVote: function(vote){
			var userVote = this.findByUser(vote.user[0].username);

			if(userVote !== undefined) {
				var fsVote = this.findByFs(userVote);

				fsVote.user = this.removeFromArray(vote.user[0].username, fsVote.user);
			}

			this.users[vote.user[0].username] = vote.id;

			var newVote = this.findByFs(vote.id);
			if(newVote === undefined){
				this.votes[vote.id] = vote;
				newVote = vote;
			}else {
				newVote.user.push(vote.user[0]);
			}

			this.cleanUpRestaurants();
		},

		findByUser: function(username){
			return this.users[username];
		},

		removeFromArray: function(username, users){
			var newArray = [];
			for (var i=0; i<users.length; i++){
				if (users[i].username !== username){
					newArray.push(users[i]);
				}
			}
			return newArray;
		},

		cleanUpRestaurants: function(){
			for(var i in this.votes) {
				if (this.votes[i].user.length === 0){
					$(this).trigger('removeLayer', this.votes[i].marker);
					delete this.votes[i];
				}
			}
		},

		findByFs: function(fsid){
			return this.votes[fsid];
		}

	};
})(window.Josh = window.Josh || {},  window.jQuery);
