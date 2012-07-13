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
	var url;
	
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
	
	Josh.Socket.prototype.addUser = function(username, img, area){
		console.log(username + ' ' + img);
		sock.emit('add', username, img, area);
	};
	
	Josh.Socket.prototype.addVote = function(fs){
		//make a copy of the object to send to the server
		//we only need basic info as the rest will be
		//built client side
		var fsSend = $.extend(true, {}, fs);
		//delete what we don't need
		//delete fsSend.marker, fsSend.user;
		console.log(fs);
		console.log(fsSend);
		sock.emit('addVote', fsSend);
		//delete fsSend;
	};
	
	return Josh.Socket;
})(window.Josh = window.Josh || {},  window.jQuery);

(function(Josh, $){
	"use strict";
	Josh.User = function(username, img){
		this.username = username;
		this.img = img;
		this.imgHTML = '<img src="' + img + '" class="userimg" title="' + username + '">';
	};
})(window.Josh = window.Josh || {},  window.jQuery);

(function(Josh, $){
	"use strict";
	var id;
	var osm;
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
	
	Josh.Map = function(id){
		id = id;
		socket = new Josh.Socket('http://ejosh.co:8080/users');
		this.map = new L.Map(id);
		console.log(this.map);
		var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
		var osmAttrib='Map data © openstreetmap contributors';
		var osm = new L.TileLayer(osmUrl,{minZoom:8,maxZoom:18,attribution:osmAttrib});
		
		
		this.map.addLayer(osm);
		
		RestIcon = L.Icon.extend({
			shadowUrl: null,
			iconSize: new L.Point(32, 32)
		});
		
		
		markerDiv = document.getElementById('fsRest');
		actsUl = document.getElementById('acts');
		votesUl = document.getElementById('votes');
		loginDiv = document.getElementById('loginArea');
		search = document.getElementById('search');
		searchText = $('#searchText');
		clearButt = document.getElementById('clear');
		titleh = $('#title');
		
		var This = this;
		
		navigator.geolocation.getCurrentPosition(function(location){This.centerLoc(location);},locError,{timeout:10000});
		
		$(markerDiv).on('click', 'button', function(e){
			var target = $(e.target);
				if(This.currentUser !== null){
				var fsid = target.attr('data-fsid');
				var fs = This.findFs(fsid);
				socket.addVote(fs);
				console.log(This.findFs(fsid));
			}else{
				alert('you must be logged in!');
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
			e.preventDefault();
			This.findRests(searchText.val());
		});
		
		$(clearButt).on('click', function(e){
			e.preventDefault();
			//add a blank search layer
			searchText.val('');
			This.addSearchLayer({});
		});
		
		this.searchFs = {};
		this.voteFs = new Josh.Votes();
		this.currentUser = null;
		this.searchLayer = null;
		this.location = null;
		
		socket.addEvent('vote', this);
		
		$(this).on('vote', function(e, d){
			
			console.log(this);
			//first check to see if it exists in the vote db
			if(this.voteFs.votes[d.fs.id] === undefined){
				var marker = this.addMarker(d.fs);
				d.fs.marker = marker;
			}
			
			d.fs.user = [new Josh.User(d.username, d.img)];
			this.addActivity(d.fs.user[0], d.fs.name, d.fs.id);
			this.voteFs.addVote(d.fs);
			this.showVotes();
			console.log(d);
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
		console.log(this);
		console.log(this.map instanceof L.Map);
	};
	
	Josh.Map.prototype = {
		centerLoc: function(loc){
			this.location = loc;
			var hull = new L.LatLng(this.location.coords.latitude, this.location.coords.longitude);
			this.map.setView(hull, 11);
		},
		
		addMarker: function(fs, layeradd){
			layeradd = typeof layeradd !== 'undefined' ? layeradd : true;
			
			var icon;
			if(fs.categories.length > 0){
				icon = new RestIcon( fs.categories[0].icon);
			}else{
				icon = new L.Icon('images/marker.png');
			}
			
			var markerLocation = new L.LatLng(fs.location.lat, fs.location.lng);
			var marker = new L.Marker(markerLocation, {icon: icon, title: fs.name});
			marker.fsid = fs.id;
			marker.img = icon.iconUrl;
			var This = this;
			marker.on('click', function(e){ This.showRest(e.target.fsid);});
			if(layeradd){
				this.map.addLayer(marker);
			}
			
			return marker;
		},
		
		removeLayer: function(arg){
			this.map.removeLayer(arg);
		},
		
		addSearchLayer: function(rests){
			if(this.searchLayer !== null){
				//remove all the current restaurants
				this.map.removeLayer(this.searchLayer);
			}
			this.searchLayer = new L.LayerGroup();
			
			for(var id in rests){
				this.addSearchFs(rests[id]);
				var marker = this.addMarker(rests[id], false);
				this.searchLayer.addLayer(marker);
			}
			
			this.map.addLayer(this.searchLayer);
			console.log(this);
			
		},
		
		showRest: function(fsid){
			var fs = this.findFs(fsid);
			
			var img;
			if(fs.categories.length > 0){
				img = fs.categories[0].icon;
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
		
		removeSearchFs: function(fs){
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
			if(username === '')
				return;
			
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
			socket.addUser(String(username), String(img.src), area);
			
			var userhtml = this.currentUser.imgHTML + username + ' : <a href="#">Sign out</a>';
			$(loginDiv).html(userhtml);
			
			//add cookie for use
			Josh.Cookie.createCookie('username', username);
			Josh.Cookie.createCookie('img', img.src);
			socket.getVotes();
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
			console.log(this.location);
			//var url = 'http://localhost:85/test/fs.php?&ll=' + location.coords.latitude + ',' + location.coords.longitude;
			var url = 'https://api.foursquare.com/v2/venues/search?ll=' + this.location.coords.latitude + ',' + this.location.coords.longitude + '&client_id=NQNF2JL2VKJHXETAOND5TPJ23A2SWGZC4TXJEMLGJBXYMIJM&client_secret=TF1CC0HZVBJ0TM50CRNJNTWSOWZMIKQ30V4DEB4GC2UWZ3KM';
			if(query !== ''){
				url += '&query=' + encodeURI(query) ;
			}else{
				url += '&query=' + encodeURI('restaurant') ;
			}
			var This = this;
			console.log(url);
			$.getJSON( url , 
			function(data){
				console.log(data);
				var rests = data.response.groups[0].items;
				This.addSearchLayer(rests);
			});
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
					if(vote.marker !== undefined){
						//it does so delete it
						$(this).trigger('removeLayer', userVote.marker);
					}else{
						//it doesn't so pass the marker
						vote.marker = userVote.marker;
					}
					//delete userVote;
				}else{
					//multiple people voted for it, just remove their vote
					for(var i=0; i < userVote.user.length; i++){
						if(userVote.user[i].username === vote.user[0].username){
							//we found it! Remove only this user
							var prevVote = userVote.user.splice(i, 1);
							//delete prevVote;
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

var locError = function(error){};