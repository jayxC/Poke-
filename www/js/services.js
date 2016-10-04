angular.module('app.services', [])

.factory('BlankFactory', [function(){

}])

.service('BlankService', [function(){

}])

.factory('userFactory', function($rootScope){
	userInfo = {
		userID : '',
		time: '',
		userPhoto: '',
		geolocation: '',
		name: ''
	};
	return {
		userInfo,
		userLogin: function(user){
			return new Promise(function(resolve,reject){
				$rootScope.userDB = firebase.database().ref('Users/'+user.userID);
				$rootScope.userDB.update(user);
				$rootScope.userDB.once('value').then(function(snapshot){
					resolve(snapshot.hasChild('name'));
				})
			});
		},
	};
})


.factory('pokeFactory', function($rootScope){
	var poke = {};
	var _pokes = {};
	var _poker;
	var _pokee;

	poke.setPoker = function(poker){
		_poker = poker;
	}
	poke.setPokee = function(pokee){
		_pokee = pokee;
	}
	poke.getPoker = function(){
		return _poker;
	}
	poke.getPokee = function(){
		return _pokee;
	}
	poke.addPoke = function(){
		var poke = {
			name: _poker.name
		}
		
		firebase.database().ref('Users/' + _pokee.userID + '/pokes/'+_poker.name).update(poke);
	}
	poke.checkPokes = function(){
		var user = JSON.parse(window.localStorage.getItem('user'));
		firebase.database().ref('Users/' + user.userID + '/pokes').once('value').then(function(snapshot){
			_pokes = snapshot.val();
			window.localStorage.setItem('_pokes', JSON.stringify(snapshot.val()));

		})
	}
	poke.getPokes = function(){
		return _pokes;
	}
	poke.deletePoke = function(key){
		var user = JSON.parse(window.localStorage.getItem('user'));
		firebase.database().ref('Users/' + user.userID + '/pokes/' + key).remove();
	}

	return poke;

})