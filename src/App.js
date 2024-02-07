import './App.css';
import { useState, useEffect } from 'react';
//SUBCOMPONENTS
import SignInButton from './components/SignInButton';
import SignOutButton from './components/SignOutButton';
import AuthorizeSpotify from './components/AuthorizeSpotify';
import TweetContainer from './components/TweetContainer';
//FIREBASE IMPORTS
import { initializeApp } from "firebase/app";
import { getDatabase, ref, update, onValue } from "firebase/database";
import { signInWithRedirect, getRedirectResult, getAuth, onAuthStateChanged, TwitterAuthProvider, signOut } from "firebase/auth";
//ROUTING
import { BrowserRouter as Router } from 'react-router-dom';

const firebaseConfig = {
  apiKey: "AIzaSyBwTiwh3-19uJUibCNq67uhIV2eesvYSmY",
  authDomain: "hummingbird-b3153.firebaseapp.com",
  databaseURL: "https://hummingbird-b3153-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hummingbird-b3153",
  storageBucket: "hummingbird-b3153.appspot.com",
  messagingSenderId: "776430709305",
  appId: "1:776430709305:web:fb35faaf4629167b95bbe8",
  measurementId: "G-8H9WXVDJ79"
};
const app = initializeApp(firebaseConfig);            
const auth = getAuth();
const provider = new TwitterAuthProvider();


const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());
console.log("params:", params);
console.log('stored code verifier', localStorage['codeVerifier']);

function App() {
  // const redirectURI = "https://stupefied-beaver-67b6e9.netlify.app"
  const redirectURI = "http://localhost:3000"
  //STATEHOOKS
  const [loggedIn, setLoggedIn] = useState('init');
  const [userId, setUserId] = useState();
  const [tracks, setTracks] = useState();
  const signIn = () => {
    signInWithRedirect(auth, provider);
  }

  const logOut = () => {
    alert('HELLO?');
    signOut(auth).then(() => {
      // Sign-out successful.
      localStorage.removeItem('codeVerifier');
      localStorage.removeItem('uid');
    }).catch((error) => {
      // An error happened.
      console.log(error);
    });
  }

  const redirectToSpotify = async () => {

    //CODE VERIFIER GENERATE
    function dec2hex(dec) {
      return ("0" + dec.toString(16)).substr(-2);
    }
    function generateCodeVerifier() {
      var array = new Uint32Array(56 / 2);
      window.crypto.getRandomValues(array);
      return Array.from(array, dec2hex).join("");
    }

    const codeVerifier = generateCodeVerifier();
    localStorage.setItem('codeVerifier', codeVerifier);
   
    // GENERATING CODE CHALLENGE FROM VERIFIER
    function sha256(plain) {
      const encoder = new TextEncoder();
      const data = encoder.encode(plain);
      
      return window.crypto.subtle.digest("SHA-256", data);
    }

    function base64urlencode(a) {
      var str = "";
      var bytes = new Uint8Array(a);
      var len = bytes.byteLength;
      for (var i = 0; i < len; i++) {
        str += String.fromCharCode(bytes[i]);
      }
      return btoa(str)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    }

    async function generateCodeChallengeFromVerifier(v) {
      var hashed = await sha256(v);
      var base64encoded = base64urlencode(hashed);
      return base64encoded;
    }

    const code_challenge = await generateCodeChallengeFromVerifier(codeVerifier);
    const clientID = "51ab5e461deb4139a53142074a46c00b";
    alert('WHAT?')
    const scope= "playlist-modify-public playlist-modify-private playlist-read-private user-read-playback-state user-modify-playback-state streaming";
    const state = "666666";
    let params = {
        client_id: clientID,
        response_type: 'code',
        redirect_uri: redirectURI,
        code_challenge_method: 'S256',
        code_challenge: code_challenge,
        scope: scope,
        state: state,
    }
    
    let endpoint = new URL('https://accounts.spotify.com/authorize');
    endpoint.search = new URLSearchParams(params);
    window.location = endpoint.toString();
  }

  useEffect(() => {

      const addSpotifyTokens = (access_token, refresh_token) => {
        const db = getDatabase(app);
        const tokenData = {
          spotifyAccessToken: access_token,
          spotifyRefreshToken: refresh_token,
        }
        
        return update(ref(db, '/users/' + localStorage['uid'] + '/credentials'), tokenData);
      };
      
      if(params.hasOwnProperty('code') && params.hasOwnProperty('state')){
        const requestOptions = {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded', 
          },
          body: new URLSearchParams({
            'grant_type': 'authorization_code',
            'code': params.code,
            'redirect_uri': redirectURI,
            'client_id': '51ab5e461deb4139a53142074a46c00b',
            'code_verifier': localStorage['codeVerifier']
          })
        };
      fetch('https://accounts.spotify.com/api/token', requestOptions)
          .then(response => response.json())
          .then(data => {
            console.log('response:', data)
            if(!data.hasOwnProperty('error')){
              addSpotifyTokens(data.access_token, data.refresh_token);
            }
          });
      }

      
      function makeApiKey(length) {
        var result           = '';
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
          result += characters.charAt(Math.floor(Math.random() * 
          charactersLength));
         }
            return result;
        }
      
      const handleLogin = (user, token, secret) => {
        const db = getDatabase(app);
        update(ref(db, 'users/' + user.uid + '/credentials'), {
          twitterToken: token,
          twitterSecret: secret,
          apiKey: makeApiKey(20),
        });
      };


      getRedirectResult(auth)
      .then((result) => {
        const credential = TwitterAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        const secret = credential.secret;
        console.log("token" + token);
        console.log("secret" + secret);
        // The signed-in user info.
        const user = result.user;
        handleLogin(user, token, secret);
      }).catch((error) => {
        // Handle Errors here.
        // const errorCode = error.code;
        // const errorMessage = error.message;
        // The email of the user's account used.
        // const email = error.email;
        // The AuthCredential type that was used.
        // const credential = TwitterAuthProvider.credentialFromError(error);
        // ...
      });


      onAuthStateChanged(auth, (user) => {
        console.log("STATE CHANGED");
        if (user) {
          // User is signed in, see docs for a list of available properties
          // https://firebase.google.com/docs/reference/js/firebase.User
            localStorage.setItem('uid', user.uid);
            getUserDoc();
            setUserId(user.uid);
            setLoggedIn(true);
            console.log('HAHAHAHA');
            console.log('BOO');
            console.log(user);

          // ...
        } else {
          // User is signed out
          localStorage.removeItem('uid');
          setUserId();
          setLoggedIn(false);
        }
      });

      function getUserDoc(){
        const db = getDatabase();
        const userRef = ref(db, 'users/' + localStorage['uid'] + '/tracks');
        onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          // const str = JSON.stringify(data, null, 2);
          console.log('DATA', data)
          const str = JSON.parse(data)
          if(str !== null){
            const tracks = str.map((track, index) => 
                <>
                <TweetContainer track={track} key={index} />
                <div className="bottom-filler"></div>
                {console.log(index)}
                </>

            );
            setTracks(tracks);
            console.log(str)
            console.log('type of str', typeof(str))
            console.log('STR', str)
          }
        });
      }

  }, [userId]);



  return (
    <Router>
    <div className="App">
      <div className="container">
      {/* <Navbar  /> */}
        <div className="all-tweets-body">

          { localStorage['uid'] !== undefined &&
          <>
          
          <div className="all-tweets-header">
            {/* <h1 className="uid">{localStorage['uid']}</h1> */}
            <div className="header-section">
              {/* <span className="feed-header-logo"> 
              <svg width="64" height="64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g clip-path="url(#a)" fill="#000">
    <path d="m54.608 16.905-2.128 7.608c5.228 1.038 7.53 3.985 7.475 9.253-.032 3.117-2.988 7.347-3.028 7.504-.068.27.202.273.202.273l.079.001c.81.008 3.287-4.768 3.975-7.765.804-3.507.31-7.942-.496-9.92 0 0-2.217-5.93-6.078-6.954Z"/>
    <ellipse cx="25.433" cy="52.897" rx="10.748" ry="13.968" transform="rotate(-73.616 25.433 52.897)"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="m44.12 25.796-1.175 3.93 3.374.963 1.152-3.936-3.35-.957Zm-3.283 10.977 1.114-3.723 3.393.968-1.092 3.73-3.415-.975Zm-1.006 3.363-4.29 14.346 3.222 2.018 4.504-15.384-3.436-.98Zm8.615-16.713 2.207-7.538L49 15.443 47.349 15l-2.235 7.472 3.332.951Z"/>
    <path d="m3.186 51.184 12.11-4.06-.323 8.979-11.787-4.919Z"/>
  </g>
  <defs>
    <clipPath id="a">
      <path fill="#fff" d="M0 0h64v64H0z"/>
    </clipPath>
  </defs>
</svg>
              </span>
              <span className="feed-header">  &nbsp; twisp
              </span> */}

<svg width="248" height="61" fill="none">
  <path d="M165.189 7.137c-1.294.353-2.092.815-3.025 1.756-.79.798-1.168 1.378-1.479 2.268a6.01 6.01 0 0 0 .488 4.95c.386.663 1.588 1.848 2.293 2.268 2.009 1.176 4.798 1.193 6.764.017.723-.429 1.605-1.244 2.042-1.883.773-1.142 1.075-2.083 1.075-3.41 0-1.723-.554-2.984-1.898-4.336-.841-.84-1.773-1.353-3.034-1.672-.731-.177-2.504-.16-3.226.042ZM80.326 7.015v6.092h-4.789v9.242h4.789V48.9H90.66V22.35H95.954v-9.242H90.661V.924H80.326v6.091ZM188.505 12.058c-1.882.252-3.428.714-5.041 1.512-2.429 1.21-4.218 2.907-5.369 5.1-.9 1.697-1.236 3.067-1.236 4.983 0 2.1.471 3.89 1.387 5.327 1.495 2.327 3.781 3.84 7.444 4.915 1.126.336 2.025.53 4.294.924 2.352.412 3.411.723 4.335 1.235.958.547 1.378 1.446 1.202 2.563-.311 1.89-2.16 3.017-4.705 2.865-1.336-.084-2.53-.395-3.42-.907-1.672-.958-2.958-2.58-3.361-4.243-.202-.866-.219-.874-.815-.303-.681.647-1.395 1.126-2.437 1.613-1.571.74-3.033 1.143-4.461 1.227-.462.025-.883.06-.941.076-.118.033.243 1.487.596 2.42 1.244 3.26 4.218 6.066 7.949 7.478 3.865 1.47 8.99 1.621 12.771.386 3.092-1.017 5.747-3.067 7.26-5.638 1.016-1.722 1.445-3.293 1.537-5.554.051-1.327-.025-2.167-.319-3.377-.58-2.378-1.975-4.252-4.235-5.689-2.226-1.411-4.1-2.033-8.024-2.663-3.31-.53-4.764-.992-5.571-1.765-.437-.403-.579-.773-.579-1.478-.009-.748.201-1.219.806-1.79.849-.807 1.74-1.11 3.252-1.11 1.823 0 3.1.488 4.243 1.63.571.572.748.816 1.067 1.48.21.437.429 1.008.479 1.26.059.252.151.487.193.52.051.035.362-.192.689-.503 1.538-1.47 4.84-2.781 6.999-2.79.757 0 .773-.008.773-.193 0-.26-.327-1.201-.689-1.991-.571-1.235-1.529-2.546-2.646-3.622-2.429-2.335-5.184-3.545-8.949-3.94-1.1-.11-3.445-.093-4.478.042ZM229.76 12.401c-.135.017-.555.076-.925.126-3.932.53-7.486 2.698-9.334 5.706l-.286.462v-5.588h-9.831V61h10.335v-8.385l.008-8.378.303.379c.647.806 2.159 2.21 2.874 2.672 1.419.915 3.436 1.756 4.965 2.067 1.303.26 1.807.31 3.218.31 3.622-.008 6.646-.916 9.428-2.848 1.52-1.059 3.142-2.706 4.159-4.235.739-1.1 1.672-2.966 2.126-4.226 1.613-4.512 1.596-10.326-.026-14.805-.621-1.697-1.957-4.083-2.94-5.251-2.731-3.227-6.033-5.1-10.125-5.747-.748-.118-3.462-.227-3.949-.152Zm.647 9.57c1.932.404 3.226 1.101 4.613 2.48 1.352 1.344 2.159 2.89 2.52 4.788.135.732.135 2.664 0 3.445-.336 1.908-1.159 3.487-2.512 4.865-.63.63-1.546 1.311-2.26 1.672-1.597.815-3.689 1.118-5.697.815-1.344-.201-2.453-.638-3.613-1.411-.672-.446-1.865-1.672-2.378-2.428-1.571-2.336-1.966-5.445-1.05-8.336.37-1.176 1.033-2.285 1.974-3.285 1.294-1.386 2.807-2.184 5.067-2.672.445-.1 2.756-.05 3.336.067ZM161.718 25.003c-.033.026-.058 8.142-.058 18.023V60.99h10.334V43.018c0-11.721-.025-17.998-.084-18.031-.042-.026-.411.058-.815.201-1.42.488-1.966.555-4.226.555-1.832 0-2.159-.025-2.966-.194-.496-.109-1.151-.285-1.454-.403-.588-.218-.646-.227-.731-.143ZM98.836 13.216c.05.126 9.856 35.113 9.94 35.457l.051.227 6.646-.016 6.646-.026 2.756-9.368c1.512-5.15 2.907-9.906 3.1-10.57.32-1.067.37-1.193.538-1.193.176 0 .269.302 1.504 4.638.723 2.554 2.075 7.318 3.008 10.587l1.689 5.948h13.233l.093-.277c.05-.143 1.924-6.83 4.167-14.847 2.252-8.015 4.462-15.914 4.924-17.552.454-1.638.832-3.008.832-3.05 0-.034-2.487-.059-5.52-.05l-5.529.025-2.874 11.679c-1.579 6.428-2.898 11.763-2.924 11.872-.033.143-.1.185-.226.168-.169-.025-.479-1.058-3.563-11.704-1.865-6.428-3.403-11.763-3.437-11.872l-.042-.185h-10.586l-.042.185c-.034.109-1.572 5.41-3.429 11.788-3.1 10.629-3.394 11.595-3.562 11.62-.143.025-.202-.025-.252-.21-.025-.126-1.345-5.436-2.924-11.788l-2.857-11.553-5.705-.025c-4.638-.017-5.688 0-5.655.092ZM54.727 2.854l-2.158 7.713c5.301 1.053 7.635 4.04 7.58 9.382-.033 3.16-3.03 7.45-3.07 7.608-.07.274.204.277.204.277l.08.001c.822.009 3.333-4.834 4.03-7.873.816-3.555.314-8.053-.503-10.057 0 0-2.247-6.013-6.163-7.051Z" fill="#000"/>
  <ellipse cx="25.144" cy="39.356" rx="10.898" ry="14.163" transform="rotate(-73.616 25.144 39.356)" fill="#000"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="m44.096 11.86-1.197 4.001 3.421.976 1.173-4.008-3.397-.97Zm-3.333 11.142 1.128-3.77 3.44.981-1.105 3.777-3.463-.988Zm-1.02 3.409-4.349 14.544L38.661 43l4.566-15.596-3.483-.994Zm8.739-16.958 2.234-7.632-1.675-.448-1.675-.45-2.262 7.566 3.378.964Z" fill="#000"/>
  <path d="m1.255 32.42 14.429-.482-2.174 8.115L1.255 32.42Z" fill="#000"/>
</svg>
           </div>
          </div>
          <div className="all-tweets-top-gap"></div>
            
            {/* <h3>{userDoc}</h3> */}
            {tracks}
            
            <SignOutButton onClick={logOut} />
            <AuthorizeSpotify onClick={redirectToSpotify} />
          </>
          
          }
          { localStorage['uid'] === undefined && loggedIn !== 'init' &&
          <>
            <SignInButton onClick={signIn} />
          </>
          }
        </div>

      </div>
    </div>
    </Router>

  );
}

export default App;
