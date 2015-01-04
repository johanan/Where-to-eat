
var https = require('https'),
		express = require('express'),
		config = require('./config'),
		client = require('./redis'),
		socketio = require('./data/socket');


var app = express();

app.use(express.static(__dirname + '/static'));
app.set('port', config.PORT);

app.get('/foursquare', function(req, res){
	var clientRequest = https.request({
		host: 'api.foursquare.com',
		path: '/v2/venues/search?ll=' + req.query.lat + ',' + req.query.lon + '&client_id=' + config.FOURSQUAREID + '&client_secret=' + config.FOURSQUARESECRET +'&v=20140128&query=' + req.query.query
	}, function(httpResponse){
		res.setHeader('content-type', 'application/json');
		httpResponse.pipe(res);
	}).end();
});

var server = app.listen(app.get('port'), function() {
	console.log('Express server listening on port ' + server.address().port);
});

//start up socket.io
socketio(server, client);
