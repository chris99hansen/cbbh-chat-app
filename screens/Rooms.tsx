import React, { useEffect, useState } from 'react';
import { RootStackParamList } from '../App';
import { StyleSheet, Text, SafeAreaView, RefreshControl, Image, Alert, View } from 'react-native';
import firestore, { firebase } from '@react-native-firebase/firestore';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { FlashList } from '@shopify/flash-list';
import { StackNavigationProp } from '@react-navigation/stack';
import FastImage from 'react-native-fast-image';
import { ImagePickerResponse, launchCamera, launchImageLibrary } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';


interface chat {
    name: string;
    date: Date;
}

type ScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'Rooms'
>;
type Props = {
    navigation: ScreenNavigationProp;
};

export default function Screen({ navigation }: Props): JSX.Element {
    
    const [avatar, setAvatar] = useState("https://firebasestorage.googleapis.com/v0/b/cbbhchatapp.appspot.com/o/defaultAvatar.png?alt=media&token=b4cfce19-7cd8-4b01-934d-f23da5371ee8");
    
    // an array to store chats to join
    const [chats, setChats] = useState<chat[]>([])
    // a boolean to indicate to the user that the program is loading
    const [refreshing, setRefreshing] = React.useState(true);
    
    /*
     * it deletes all chats stored, and finds the listed chats in the firestore collection "chats"
     * it sorts the rooms so the top chat is the chat room with the last recieved message
     * it returns data via side effects to be shown on screen
    */
    async function getChats() {
        setRefreshing(true)
        setChats([]);
        let newChats:chat[] = []
        let docs = await firestore().collection('chats').get()
        for (const foundChat of docs.docs){
            const t = await firestore()
            .collection(foundChat.data().chat)
            .orderBy("date","desc")
            .limit(1)
            .get()
            if (t.size > 0){
                newChats.push({
                    name: foundChat.data().chat,
                    date: new Date(t.docs[0].data().date.toDate() as Date)
                })
            }
        }
        newChats.sort((a,b) => b.date.getTime() - a.date.getTime());
        setChats(newChats);
        setRefreshing(false);
    }

    // onRefresh() is called when the user pulls down while being at the top
    function onRefresh(): void {
        getChats();
    }

    function uploadAvatar(img:ImagePickerResponse):void{
        // if the user cancelled, do nothing
        if (!img.didCancel) {
            setRefreshing(true)
            img.assets?.forEach(asset => {
                if (asset.uri) {
                    const ref = storage().ref(Date.now().toString()+firebase.auth().currentUser?.email);
                    const task = ref.putFile(asset.uri);
                    task.then(() => {
                        ref.getDownloadURL().then((link) => {
                            firestore().collection('users').where("email", "==",firebase.auth().currentUser?.email).get().then(doc => {
                                if(doc.size === 0){
                                    // if there is no user stored create one
                                    firestore().collection('users').add({email:firebase.auth().currentUser?.email,image:link}).then(
                                        ()=> setAvatar(link))
                                }else{
                                    //updates the image link
                                    doc.forEach(element => {
                                        element.ref.update("image",link).then(
                                            ()=> setAvatar(link))
                                    });
                                }
                            })
                        }
                    )})
                }else {
                    Alert.alert("","Error occured with the image",[{text:"ok"}])
                }
            })
        }
    }

    function uploadAvatarAlert(): void {
        Alert.alert("","Update avatar image from", [
            { text:"Cancel" },
            { text:"Camera", onPress: () => {
                // send image from camera
                launchCamera({ mediaType: "photo" }, (img) => {
                    uploadAvatar(img)
                });
            }},
            { text:"Gallery", onPress: () => {
                // send image from Gallery 
                launchImageLibrary({ mediaType: "photo", selectionLimit: 1 }, (img) => {
                    uploadAvatar(img)
                });
            }}])
    }

    //fetch stored avatar picture
    useEffect(() => {
        firestore().collection('users').where("email", "==" ,firebase.auth().currentUser?.email).get().then(doc => {
            navigation.setOptions({headerRight: () => (
                <TouchableOpacity
                style = { {height: 55,width: 55,} }
                onPress={() => uploadAvatarAlert()}
                >
                <FastImage  style = {{
                    height: 55,
                    width: 55,
                    maxHeight:"100%",
                    maxWidth:"100%",
                    borderRadius:100,
                }}
                    source={{
                        uri: avatar,
                        priority: FastImage.priority.normal,
                    }}
                    resizeMode={FastImage.resizeMode.contain}
                    />
                </TouchableOpacity>
            )})
            doc.forEach(element => {
                setAvatar( element.data().image )
            });
        })
        //after a image upload the list also have to have the correct avatar link
        getChats();
    }, [avatar]);
    
    // this is only called once on a mount and not on each render
    useEffect(() => {
        const name = firebase.auth().currentUser?.displayName
        if(name){
            navigation.setOptions({ headerTitle: name})
        }else{
            navigation.setOptions({ headerTitle: "no display name"})
        }
    }, []);
    
    // the view that the user sees
    return (<SafeAreaView style = { styles.SafeAreaView }>
        <FlashList 
        estimatedItemSize = { 8 }
        data = { chats }
        refreshControl = { <RefreshControl refreshing = { refreshing } onRefresh = { onRefresh } />}
        renderItem = { item => {
            // each chat is a big button, clicking on it will enter the chat displayed
            return(
            <TouchableOpacity style = { styles.button } onPress = { () => {
                navigation.navigate("Chat", { chat: item.item.name, avatar: avatar})}}>
                <Text style = { styles.text }>{ item.item.name }</Text>
            </TouchableOpacity>
            )
        }}
        />
        </SafeAreaView>)
}

const styles = StyleSheet.create({
    text: {
        fontSize: 30,
        fontWeight: 'bold',
        margin: 10,
        color: (`#000000`),
        textShadowColor:'#585858',
        textShadowOffset:{width: 1, height: 1},
        textShadowRadius:1,
    },
    textInfo: {
        fontSize: 20,
        fontWeight: 'bold',
        margin: 10,
        textAlign: "center",
        color: (`#000000`),
        textShadowColor:'#585858',
        textShadowOffset:{width: 1, height: 1},
        textShadowRadius:1,
    },
    SafeAreaView: {
        flex: 1,
        backgroundColor: (`#FFFFFF`),
    },
    button: {
        backgroundColor:"#E4E6EB",
        paddingVertical: 20,
        margin: 10,
        borderRadius: 10
    },
})