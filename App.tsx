/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import type {PropsWithChildren} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Button,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack'
const Stack = createStackNavigator()

import auth, { FirebaseAuthTypes, firebase } from '@react-native-firebase/auth';
import getAuth from '@react-native-firebase/auth';

import Rooms from "./screens/Rooms";
import Chat1 from "./screens/Chat1";

import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: "639044883262-mba3lj83uv4bssvh9deuoddorvpho27d.apps.googleusercontent.com",
});

async function onGoogleButtonPress() {
  // Check if your device supports Google Play
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  // Get the users ID token
  const { idToken } = await GoogleSignin.signIn();

  // Create a Google credential with the token
  const googleCredential = auth.GoogleAuthProvider.credential(idToken);

  // Sign-in the user with the credential
  return auth().signInWithCredential(googleCredential);
}

function App(): JSX.Element {
  
  //taken from rnfirebase.io
  const [user, setUser] = useState();
  
  //taken from rnfirebase.io
  // Handle user state changes
  function onAuthStateChanged(user: any) {
    setUser(user);
  }
  //taken from rnfirebase.io
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((user) => {
      if(user){
        //logged in
        onAuthStateChanged(user);
      }
    });
    return subscriber; // unsubscribe on unmount
  }, []);
  
  
  if (!user) {
    return (
      <SafeAreaView style={styles.view}>
          <Text style ={styles.loginMessage} >Login to start chatting</Text>
            <Button title="Google Sign-In"
              onPress={() => onGoogleButtonPress()}
            />
      </SafeAreaView>
    );
  }else{
    const firebaseUser = firebase.auth().currentUser;
    if (firebaseUser){             
      return (
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Chat Rooms" component={Rooms} ></Stack.Screen>
          <Stack.Screen name="Chat1" component={Chat1} ></Stack.Screen>
          <Stack.Screen name="Chat2" component={Chat1} ></Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
      );
    }else{
      return (<SafeAreaView><Text>you are logged in but cannot get the auth state</Text></SafeAreaView>);
    }
  }
}

const styles = StyleSheet.create({
  view: {
    flex: 1,
    backgroundColor: (`#ffffff`),
  },
  loginMessage: {
    fontSize: 30,
    color: (`#000000`),
    paddingVertical: 40,
    textAlign: "center",
  },
  loginButton: {
    fontSize: 30,
    paddingVertical: 40,
    textAlign: "center",
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
