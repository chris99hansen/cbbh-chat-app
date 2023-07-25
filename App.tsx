import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import auth, { firebase } from '@react-native-firebase/auth';
import Rooms from "./screens/Rooms";
import Chat from "./screens/Chat";
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: "639044883262-mba3lj83uv4bssvh9deuoddorvpho27d.apps.googleusercontent.com",
});

async function onGoogleButtonPress() {
  // check if your device supports Google Play
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  // get the users ID token
  const { idToken } = await GoogleSignin.signIn();

  // create a Google credential with the token
  const googleCredential = auth.GoogleAuthProvider.credential(idToken);

  // sign-in the user with the credential
  return auth().signInWithCredential(googleCredential);
}

export type RootStackParamList = {
  Rooms: undefined, // undefined as no params are passed
  Chat: { name: string }; 
};

const Stack = createStackNavigator<RootStackParamList>()

function App(): JSX.Element {
  const [user, setUser] = useState();
  
  // handle user state changes
  function onAuthStateChanged(user: any) {
    setUser(user);
  }
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((user) => {
      if (user) {
        // logged in
        onAuthStateChanged(user);
      }
    });
    return subscriber; // unsubscribe on unmount
  }, []);
  
  
  if (!user) {
    // show login buttons
    return (
      <SafeAreaView style = {{ flex: 1,backgroundColor: (`#ffffff`) }}>
          <Text style = { styles.HeaderText } >Log in to start chatting</Text>
            <GoogleSigninButton style = {{ alignSelf: "center" }}
              onPress = { () => onGoogleButtonPress() }
            />
      </SafeAreaView>
    );
  } else {
    // the user is logged in, show the rooms to join
    const firebaseUser = firebase.auth().currentUser;
    if (firebaseUser) {             
      return (
      <NavigationContainer>
        <Stack.Navigator
        initialRouteName = "Rooms">
          <Stack.Screen name = "Rooms" component = { Rooms } ></Stack.Screen>
          <Stack.Screen name = "Chat" component = { Chat } ></Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
      );
    } else {
      // the user is logged in, but there is an error
      return (<SafeAreaView><Text>you are logged in but cannot get the auth state</Text></SafeAreaView>);
    }
  }
}

const styles = StyleSheet.create({
  HeaderText: {
    fontSize: 30,
    color: (`#000000`),
    paddingVertical: 40,
    textAlign: "center",
  },
});

export default App;
