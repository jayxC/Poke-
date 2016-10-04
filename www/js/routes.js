angular.module('app.routes', [])

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider
    
  

      .state('tabsController.profileTabPage', {
    url: '/page2',
    views: {
      'tab1': {
        templateUrl: 'templates/profileTabPage.html',
        controller: 'profileTabPageCtrl'
      }
    }
  })

  .state('tabsController.mapTabPage', {
    url: '/page3',
    resolve: {
      //created a promise here so that pokes is readily available at map startup 
      pokes: function(pokeFactory){
        return new Promise(function(resolve, reject){
          var user = JSON.parse(window.localStorage.getItem('user'));
          return firebase.database().ref('Users/' + user.userID + '/pokes').once('value').then(function(snapshot){
            window.localStorage.setItem('_pokes', JSON.stringify(snapshot.val()));
            resolve(snapshot.val());

            return snapshot.val();
          })
        })
      }
    },
    views: {
      'tab2': {
        templateUrl: 'templates/mapTabPage.html',
        controller: 'mapTabPageCtrl'
      }
    }
  })

  .state('tabsController.appointmentsTabPage', {
    url: '/page4',
    views: {
      'tab3': {
        templateUrl: 'templates/appointmentsTabPage.html',
        controller: 'appointmentsTabPageCtrl'
      }
    }
  })

  .state('tabsController', {
    url: '/page1',
    templateUrl: 'templates/tabsController.html',
    abstract:true
  })

  .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'loginCtrl'
  })

  .state('setup', {
    url: '/setup',
    templateUrl: 'templates/setup.html',
    controller: 'setupCtrl'
  })
$urlRouterProvider.otherwise('/login')

  

});