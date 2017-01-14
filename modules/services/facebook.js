var log = require('../logs');
var FB = require('facebook-node');
var async = require('async');
var _ = require('underscore');
var moment = require('moment');
var config = require('../config');
var request = require('request');

var token;
var fb_url = "https://graph.facebook.com/v2.0/";

function getFacebookPhoto( photo ){
	return new Promise( function( resolve, reject ){

	var onPhotoFetched = function(err, res, body){

		var data = JSON.parse( body );
		var date = new Date(data.created_time).getTime();

		if(isNaN(date))
		{
			date = new Date().getTime();
		}

		var obj = {
			imageUrl: data.images[0].source,
			timestamp: date,
			service:'facebook'
		}

		_.defer( ()=>{
			resolve(obj);
		});
	}
	var fields = '&fields=link,created_time,name,images'

	request.get( fb_url + photo.id + '?access_token=' + token + fields, onPhotoFetched );
	});
}

function getPhotos(user, cb)
{
	var _photos = [];

	token = user.services.facebook.accessToken;

	FB.setApiVersion("v2.2")
	FB.setAccessToken( token );

	var callback = function( res ){
		if(!res.data) cb( 'No Photos',[]);

		var albums = res.data;

		var iter = function( album, next ){


			FB.api( album.id + '/photos', function( resp ){
				var photos = resp.data;
				var fb_photo;

				async.filter( photos,
					// iterator
					function( photo, _next ){
						var _time = moment( photo.created_time );
						var _cutoff = moment( config.START_DATE );
						if( _cutoff.isBefore(_time) ){
							getFacebookPhoto( photo ).then( ( fb_photo )=>{
								_.defer( ()=>{
									_photos.push( fb_photo );
									_next();
								})
							}).catch(cb);
						}else{
							_next();
						}
					},
					// complete
					function( photo ){
						_.defer( ()=>{
							next( fb_photo );
						});
				});

			})
		}

		var filterCallback = function( arr, results ){
			cb(null, _photos);
		}



		async.filter( albums, iter, filterCallback );
	};

	FB.api( 'me/albums', 'get', callback );
}

module.exports =
{
	getPhotos : getPhotos
};
