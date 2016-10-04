angular.module('app.controllers', [])
  
.controller('profileTabPageCtrl', ['$scope', '$stateParams', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams) {
	//grab local storage item so we can show user information
	var user = JSON.parse(window.localStorage.getItem('user'));

	$scope.name  = user.name;
	$scope.userPhoto = user.userPhoto;

}])
   
.controller('mapTabPageCtrl', ['$scope', '$stateParams', '$compile','pokeFactory','pokes','$ionicPopup', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams, $compile, pokeFactory, pokes, $ionicPopup) {
	//Check whethr or not There is any pokes for you
	if(pokes != undefined){
		for(var key in pokes){
			if(!pokes.hasOwnProperty(key)) continue;
			var poke = pokes[key];
			showPoke(poke, key);
		}
	}

	function showPoke(poke, key){ 
		var pokePopup = $ionicPopup.confirm({
			title: poke[Object.keys(poke)[0]] + ' poked you!',
			template: 'is that okay??!!'
		});

		pokePopup.then(function(res){
			if(res){
				console.log("okay!", res);
				pokeFactory.deletePoke(key);
			}else{
				console.log("no!");
				pokeFactory.deletePoke(key);
			}
		});//pokePopup.then

	}//showRequests

	// Google Maps Stuff
	//we only initialize one infowindow object so only one of them will open at a time
	var infoWindow = new google.maps.InfoWindow();
	var map = new google.maps.Map(document.getElementById('map'),{
		center: {lat: 42.3601, lng: -71.0589},
		zoom: 10,
		zoomControl: false,
		mapTypeControl: false
	})
	var user = JSON.parse(window.localStorage.getItem('user'));

	//grab userList so we can set up the Infowindow for each user 
	var userList = JSON.parse(window.localStorage.getItem('userList'));
	for(var key in userList){
		if(!userList.hasOwnProperty(key)) continue;
		var description = '<div id="mapInfo"><strong>' + userList[key].name + '</strong><br>'+
                          '<br><button button-positive id-field='+key+' ng-click="poke($event.srcElement.attributes[1].nodeValue);showRequest = true">Poke</button></div>';
		var compiled = $compile(description)($scope);

		addMarker(userList[key].geolocation, compiled[0]);
	}//for loop

		
	function addMarker(location, description) {
	    var marker = new google.maps.Marker({
	      position: location,
	      map: map
	    });
	  	//add a listener to the marker and when clicked set the content with what we have and it will open with what we want in it
	    marker.addListener('click', function(){
	    	infoWindow.setContent(description);
		    infoWindow.open(map, marker);
	    })
  	} // end addMarker function

  	//function to set up the poke and save it on the database for the poked user
	$scope.poke = function(key){
		$scope.recipient=userList[key];
		pokeFactory.setPoker(user);
		pokeFactory.setPokee(userList[key]);
		pokeFactory.addPoke();
	} // end poke function

}])
   
.controller('appointmentsTabPageCtrl', ['$scope', '$stateParams', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
function ($scope, $stateParams) {


}])

.controller('loginCtrl', ['$scope', '$stateParams','$cordovaOauth','userFactory','$state', 'pokeFactory',
function($scope, $stateParams, $cordovaOauth, userFactory, $state, pokeFactory){

/****

This fb login method is one that firebase handles with popup. This and the signin with redirect do not currently work with
native ionic and cordova applicatins.

***/
	$scope.fbLogin = function() {
		//firebase login for facebook
		var provider = new firebase.auth.FacebookAuthProvider();
		firebase.auth().signInWithPopup(provider).then(function(result) {
			// This gives you a Facebook Access Token. You can use it to access the Facebook API.
			var token = result.credential.accessToken;
			// The signed-in user info.
			var user = result.user;
			var data = {
				userID: user.uid,
				name: user.displayName,
				time : new Date().getTime(),
				userPhoto : user.photoURL
			}
			//set userFactory's userData
			userFactory.userInfo = data;
	  		userFactory.userLogin(data).then(function(response){
				firebase.database().ref('Users/'+data.userID).once('value').then(function(snapshot){
					userFactory.userInfo = snapshot.val();
					window.localStorage.setItem('user', JSON.stringify(snapshot.val()));
					if(userFactory.userInfo.geolocation != undefined ){
						firebase.database().ref('Users/').once('value').then(function(snapshot){
							//grab the list of users to display on the map
							window.localStorage.setItem('userList', JSON.stringify(snapshot.val()));
							pokeFactory.checkPokes();
							$state.go('tabsController.mapTabPage');
						})
					} else {
						$state.go('setup');
					}
				})
				
			}).catch(function(error){
				// Handle Errors here.
		        var errorCode = error.code;
		        var errorMessage = error.message;
		        // The email of the user's account used.
		        var email = error.email;
		        // The firebase.auth.AuthCredential type that was used.
		        var credential = error.credential;
		        // ...
		        console.log(error);
			});
		}).catch(function(error) {
		  // Handle Errors here.
		  var errorCode = error.code;
		  var errorMessage = error.message;
		  console.log(errorCode);
		  console.log(errorMessage);
		  // The email of the user's account used.
		  var email = error.email;
		  // The firebase.auth.AuthCredential type that was used.
		  var credential = error.credential;
		  // ...
		}); // end second catch
	} // end fbLogin function

}])

.controller('setupCtrl', function($scope, $stateParams, $cordovaOauth, userFactory, $state){

	var placeSearch, autocomplete;
	var geolocation = new Object(); 
	//autocomplete stuff for location so that we have location of user
	// Create the autocomplete object, restricting the search to geographical
	// location types.
	autocomplete = new google.maps.places.Autocomplete(
	    /** @type {!HTMLInputElement} */(document.getElementById('address')),
	    {types: ['geocode']});

	// When the user selects an address from the dropdown, populate the address
	// fields in the form.
	autocomplete.addListener('place_changed', fillInAddress);

	function fillInAddress() {
		// Get the place details from the autocomplete object.
		var place = autocomplete.getPlace();
		//set geolocation for future use
		geolocation = {
			lat: place.geometry.location.lat(),
			lng: place.geometry.location.lng()
		}
	} // end fillInAddress function

	/**   IMPORTANT

	This function lets us select items from google's autocomplete forms

	**/
	$scope.disableTap = function(){
		container = document.getElementsByClassName('pac-container');
		// disable ionic data tab
		angular.element(container).attr('data-tap-disabled', 'true');
		// leave input field if google-address-entry is selected
		angular.element(container).on("click", function(){
		    document.getElementById('searchBar').blur();
		});
	}; // end DisableTap function

	$scope.submit = function(){
		var user = JSON.parse(window.localStorage.getItem('user'));
		firebase.database().ref('Users/' + user.userID + '/geolocation').update(geolocation);

		user["geolocation"] = geolocation;
		window.localStorage.setItem('user', JSON.stringify(user));

		$state.go('tabsController.mapTabPage');
	} // end submit function
	



})


