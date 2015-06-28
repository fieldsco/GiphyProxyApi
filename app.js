var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var User = require('./models/user');
var basicAuth = require('basic-auth-connect');
var app = express();

//create Express router
var router = express.Router()

//use bodyparser to get the data from POST
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//connect to our db
mongoose.connect('mongodb://localhost:27017/giphytest2');

//auth mechanism
var auth = basicAuth(function(username, password, callback) {
	//default to no authorization
	var result = false;

	User.findOne({ username: username, password: password }, function(err, user) {
		if (!err && user !== null) {
			//we found a user with this username and password
			result = true;
		}
		//execute the callback, error is null
		callback(null, result);
	});
});

router.get('/q/:q', auth, function(req, res) {
	//watch for something fishy
	if (req.params.q.length > 4000) {
        res.status(401);
        return res.send('your request is too long!');
	}

	var request = require('request');

	//form request to giphy api
	var giphyUrl = 'http://api.giphy.com/v1/gifs/translate?s=';
	var giphyApiKey = 'dc6zaTOxFJmzC';
	request({url: giphyUrl + req.params.q + '&api_key=' + giphyApiKey, json: true}, function (err, response, body) {
		if (err) {
			//giphy returned an error, pass it through
			return res.send(err);
		}

	    if (response.statusCode === 200) {
	    	//we're good, pass the response through with 200 status code
			res.status(200);
			return res.send(body);
	    }

	    //not the response we were looking for, pass back a general error with giphy status code
        return res.send('there was an unidentified problem with giphy - statusCode=' + response.statusCode);
	});
});

router.post('/user', function(req, res) {
    var username = req.body.username;
   	var password = req.body.password;

   	//TODO: add password strength mechanism

   	//see if there are any users with this username
	User.findOne({ username: username }, function(err, user) {
		if (err) {
			//pass mongo error back
			return res.send(err);
		}
		if (user !== null) {
			//user exists
	        res.status(400);
	        return res.send('this user already exists!');
		}

		//create the user with our model
	    var user = new User({
	    	username: username,
	    	password: password
	    });

	    //save the user
	    user.save(function(err, user) {
	    	if (err) {
	    		//pass mongo error back
	    		return res.send(err);
	    	}
	    	//send back the newly-created user json
	    	res.json(user);
	    });
	});
});

//register all of our routes
app.use('/', router);

//start the server
var server = app.listen(3000, function () {
	var port = server.address().port;
	console.log('GiphyProxyAPI listening on port %s', port);
});
