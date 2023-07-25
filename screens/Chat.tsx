import React, { useState, useEffect } from 'react';
import { RootStackParamList } from '../App';
import {ImagePickerResponse, launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {
    StyleSheet,
    View,
    Text,
    SafeAreaView,
    RefreshControl,
    Image,
    TextInput, 
    TouchableOpacity,
    Alert,
    Dimensions
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { firebase } from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import { FlashList } from "@shopify/flash-list";
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

interface message {
    email: string;
    msg: string;
    img: string;
    date: Date;
    height: number;
    width: number;
}

const db = firestore();

type ScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'Chat'
>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;
type Props = {
    navigation: ScreenNavigationProp;
    route: ScreenRouteProp;
};

export default function Screen({ route, navigation }: Props) {
    const [isEditable, setIsEditable] = useState(true);
    const [data, setData] = useState<message[]>([])
    const [refreshing, setRefreshing] = useState(true);
    const [text, setText] = useState("");
    
    useEffect(() => {
        navigation.setOptions({ title: route.params.name })
        const observer = db
            .collection(route.params.name)
            .orderBy("date","desc")
            .limit(50)
            .onSnapshot(querySnapshot => {
                setRefreshing(false);
                querySnapshot.docChanges().forEach(element => {
                    if(element.type === "added" && element.doc.data().date != null){
                        /**
                         * the newest message has to be added to the bottom
                         * the first time it gets messages, they have to be put in reverse 
                         * order since the collection is sorted by descending order
                         * all other times it has to be inserted normally
                         */
                        if(data.length > 0 && 
                            new Date(element.doc.data().date.toDate() as Date) > data[data.length - 1].date) {
                            setData(current => [...current, {
                                email: element.doc.data().email,
                                msg: element.doc.data().msg, 
                                date: new Date(element.doc.data().date.toDate() as Date),
                                img: element.doc.data().img,
                                height: element.doc.data().height,
                                width: element.doc.data().width
                            }])
                        } else {
                            setData(current => [{
                                email: element.doc.data().email,
                                msg: element.doc.data().msg, 
                                date: new Date(element.doc.data().date.toDate() as Date),
                                img: element.doc.data().img,
                                height: element.doc.data().height,
                                width: element.doc.data().width
                                },...current])
                        }
                    } else {
                        if(element.type === "modified") {
                            setData(current => [...current, {
                                email: element.doc.data().email,
                                msg: element.doc.data().msg, 
                                date: new Date(element.doc.data().date.toDate() as Date),
                                img: element.doc.data().img,
                                height: element.doc.data().height,
                                width: element.doc.data().width
                            }])
                        }
                    }
                });
            }, err => {
                console.log(`Encountered error: ${err}`);
            });
    }, []);
    
    function onRefresh(): void {
        if (data.length > 0) {
            // TODO fix small bug where if 2 or more messages were sent at the EXACT same time they will be skipped
            // but also only if the last message stored is the message that has the exact same time as other messages 
            firestore()
            .collection(route.params.name)
            .where("date","<",data[0].date)
            .orderBy("date","desc")
            .limit(10)
            .get()
            .then(docs =>{
                docs.forEach(element => {
                    setData(current => [{
                        email: element.data().email,
                        msg: element.data().msg, 
                        date: new Date(element.data().date.toDate() as Date),
                        img: element.data().img,
                        height: element.data().height,
                        width: element.data().width
                    },...current])
                });
            }).finally(() => {setRefreshing(false)})
        }
    }

    // send a message to the given chat or show an alert if the text field is empty
    function sendMessage():void {
        if (text.length > 0) {
            const timestamp = firestore.FieldValue.serverTimestamp();
            firestore()
            .collection(route.params.name)
            .add({
                date: timestamp,
                email: firebase.auth().currentUser?.email,
                msg: text,
                img: ""
            })
            setText("");
            setIsEditable(true);
        } else {
            Alert.alert("","You cannot send an empty message",[{text:"ok"}])
            setIsEditable(true);
        }
    }

    /**
     * send a message with the given text and given image to the chat
     * @param img The image to be sent
     */
    function sendImageMessage(img:ImagePickerResponse):void {
        // if the user cancelled, do nothing
        if (!img.didCancel) {
            img.assets?.forEach(asset => {
                const timestamp = firestore.FieldValue.serverTimestamp();
                const ref = storage().ref(Date.now().toString()+firebase.auth().currentUser?.email)
                if (asset.uri) {
                    const task = ref.putFile(asset.uri);
                    task.then(() => {
                        ref.getDownloadURL().then((link) => {
                        firestore()
                        .collection(route.params.name)
                        .add({
                            date: timestamp,
                            email: firebase.auth().currentUser?.email,
                            msg: text,
                            img: link,
                            height: asset.height,
                            width: asset.width,
                        })
                        setText("");
                        setIsEditable(true);
                        })
                    })
                } else {
                    Alert.alert("","Error occured with the image",[{text:"ok"}])
                    setIsEditable(true);
                }
            });
        }
    }
    // the size of the phone screen
    const {height, width} = Dimensions.get('window');

    return (<SafeAreaView style={styles.SafeAreaView}>
        {/* a new view to seperate input area and the viewable area for messages */}
        <View style={{flex: 8}}>
        {/* FlashList of messages, is supposed to be faster than a flatlist */}
        <FlashList
        refreshControl = { <RefreshControl refreshing = { refreshing } onRefresh = { onRefresh } /> }
        estimatedItemSize = { 2 }
        data = { data }
        renderItem = { item => { if (item.item.img === "") {
        // the message has no image
            return((
                <View style = {styles.messageBoxOthers}>
                    <Text style = {styles.messageText}>date: {item.item.date.toLocaleString()}</Text>
                    <Text style = {styles.messageText}>email: {item.item.email}</Text>
                    <Text style = {styles.messageText}>message: {item.item.msg}</Text>
                </View>))
        } else {
            // the message has an image
            // calculate resized height for the image as to not create a lot of empty space
            const ratio = item.item.width / item.item.height;
            const imgHeight = (width * 0.8) * ratio; // has a flex of 8, therefore 0.8

            return((
                <View style = {styles.messageBoxOthers}>
                    <Text style = {styles.messageText}>date: {item.item.date.toLocaleString()}</Text>
                    <Text style = {styles.messageText}>email: {item.item.email}</Text>
                    <Text style = {styles.messageText}>message: {item.item.msg}</Text>
                    <Image  style = {{
                        height: imgHeight,
                        width: item.item.width,
                        maxWidth: "100%",
                        resizeMode: "contain",
                        alignSelf: "center"}}
                        source = {{ uri: item.item.img }}/>
                </View>
            ))
        }}
        }
        // end of flashlist and message area view
        />
        </View>
        {/* begin of input area at the bottom of the screen */}
        
        {/* send image button */}
        <View style = {{ backgroundColor: "#ffffff", height:(height/10*1) }}>
            <View style = {[{ flexDirection:'row', flex:1 }]}>
                <View style = {[{ flexDirection:'row', flex:1 }]}>
                    <TouchableOpacity style = {[{ flex:1 }]} activeOpacity = { 0.5 } onPress = {() => {
                        Alert.alert("","Upload image from", [
                            { text:"Cancel" },
                            { text:"Camera", onPress: () => {
                                // send image from camera
                                launchCamera({ mediaType: "photo" }, (img) => {
                                    setIsEditable(false);
                                    sendImageMessage(img);
                                });
                            }},
                            { text:"Gallery", onPress: () => {
                                // send image from Gallery 
                                launchImageLibrary({ mediaType: "photo", selectionLimit: 1 }, (img) => {
                                    setIsEditable(false);
                                    sendImageMessage(img);
                                });
                            }}])
                    }}>
                        <Image
                        source = { require('../images/imgIcon.png') }
                        style = {{
                            maxHeight: "100%",
                            maxWidth: "100%",
                            resizeMode: "contain" }}
                        />
                    </TouchableOpacity>
                </View>

                {/* Text Input border */}
                <View style = { styles.TextInputBorder}>
                    
                    <TextInput editable = { isEditable } multiline style = { styles.TextInput } 
                    onChangeText = { newText => setText(newText) }
                    value = { text }/>
                </View>

                {/* Send message button */}
                <View style = {[{ flexDirection:'row',flex:1 }]}>
                    <TouchableOpacity style = {[{ flex:1 }]} activeOpacity = { 0.5 } onPress = { () => {
                        setIsEditable(false);
                        sendMessage();
                    }}>
                        <Image
                        source = { require('../images/sendIcon.png') }
                        style = {{
                            maxHeight: "100%",
                            maxWidth: "100%",
                            resizeMode: "contain" }}
                        />
                    </TouchableOpacity>
                    
                </View>
                </View>
        </View>
    </SafeAreaView>)
}

const styles = StyleSheet.create({
    messageText: {
        color: (`#000000`),
        marginHorizontal: 10,
    },
    TextInputBorder: {
        flex:6,
        flexDirection:'row',
        borderStyle: "solid",
        borderWidth: 1,
        borderRadius:10,
        margin:10
    },
    TextInput: {
        minHeight:"100%",
        minWidth:"100%",
        maxHeight: "100%",
        maxWidth: "100%",
        color:"#000000"
    },
    SafeAreaView: {
        flex: 1,
        backgroundColor: (`#ffffff`),
    },
    messageBoxOthers: {
        marginTop: 10,
        marginLeft: 10,
        borderWidth: 1,
        borderStyle: "solid",
        borderRadius: 10,
        maxWidth: "80%",
        overflow: "hidden"
    },
    messageBoxYou: {
        marginTop: 10,
        marginLeft: 10,
        borderWidth: 1,
        borderStyle: "solid",
        borderRadius: 10,
        maxWidth: "80%",
    },
})