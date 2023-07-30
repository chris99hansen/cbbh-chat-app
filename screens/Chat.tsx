import React, { useState, useEffect } from 'react';
import { RootStackParamList } from '../App';
import { ImagePickerResponse, launchCamera, launchImageLibrary } from 'react-native-image-picker';
import FastImage from 'react-native-fast-image'
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
    displayName: string;
    avatar: string;
    msg: string;
    img: string;
    date: Date;
    height: number;
    width: number;
}

type ScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'Chat'
>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;
type Props = {
    navigation: ScreenNavigationProp;
    route: ScreenRouteProp;
};
// a link to the default avatar to be used if an avatar is not found
const defaultAvatarLink = "https://firebasestorage.googleapis.com/v0/b/cbbhchatapp.appspot.com/o/defaultAvatar.png?alt=media&token=b4cfce19-7cd8-4b01-934d-f23da5371ee8";

export default function Screen({ route, navigation }: Props): JSX.Element {
    const [isEditable, setIsEditable] = useState(true);
    const [data, setData] = useState<message[]>([])
    const [refreshing, setRefreshing] = useState(true);
    const [text, setText] = useState("");

    useEffect(() => {
        navigation.setOptions({ title: route.params.chat })
        const observer = firestore()
            .collection(route.params.chat)
            .orderBy("date", "desc")
            .limit(50)
            .onSnapshot(querySnapshot => {
                setRefreshing(false);
                querySnapshot.docChanges().forEach(element => {
                    if (element.type === "added" && element.doc.data().date != null) {
                        const date = new Date(element.doc.data().date.toDate() as Date)
                        /**
                         * data.length always returns 0 even with data in it
                         * data.foreach will never run because it is always listed as empty
                         */
                        let date2: Date;
                        date2 = new Date(0)
                        /**
                         *  the only way i found to get the length of the array
                         */
                        setData(oldData => {
                            if (oldData.length > 0) {
                                date2 = oldData[oldData.length - 1].date
                            }
                            return ([...oldData])
                        })
                        /**
                         * the newest message has to be added to the bottom
                         * the first time it gets messages, they have to be put in reverse 
                         * order since the collection is sorted by descending order
                         * all other times it has to be inserted as the first element
                         */
                        if (date.getTime() > date2.getTime()) {
                            setData(current => [...current, {
                                email: element.doc.data().email,
                                msg: element.doc.data().msg,
                                avatar: element.doc.data().avatar,
                                displayName: element.doc.data().displayName,
                                date: new Date(element.doc.data().date.toDate() as Date),
                                img: element.doc.data().img,
                                height: element.doc.data().height,
                                width: element.doc.data().width
                            }])
                        } else {
                            setData(current => [{
                                email: element.doc.data().email,
                                msg: element.doc.data().msg,
                                avatar: element.doc.data().avatar,
                                displayName: element.doc.data().displayName,
                                date: new Date(element.doc.data().date.toDate() as Date),
                                img: element.doc.data().img,
                                height: element.doc.data().height,
                                width: element.doc.data().width
                            }, ...current])
                        }
                        /**
                         * when a message is sent, the server first has to get the current time
                         * then update the message with the time it gets. that is always slower when sent
                         * from your own phone
                         */
                    } else {
                        if (element.type === "modified") {
                            setData(current => [...current, {
                                email: element.doc.data().email,
                                msg: element.doc.data().msg,
                                avatar: element.doc.data().avatar,
                                displayName: element.doc.data().displayName,
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
        if(data.length > 0){
            const message = data[0]
            firestore()
            .collection(route.params.chat)
            .where("date", "<=", message.date)
            .orderBy("date", "desc")
            .limit(11)
            .get()
            .then(docs => {
                docs.forEach(element => {
                    const newMessage = {
                        email: element.data().email,
                        msg: element.data().msg,
                        avatar: element.data().avatar,
                        displayName: element.data().displayName,
                        date: new Date(element.data().date.toDate() as Date),
                        img: element.data().img,
                        height: element.data().height,
                        width: element.data().width
                    }
                    if(JSON.stringify(message) != JSON.stringify(newMessage)){
                        setData(current => [newMessage, ...current])
                    }
                });
            }).finally(() => { setRefreshing(false) })
        }
    }

    // send a message to the given chat or show an alert if the text field is empty
    function sendMessage(): void {
        if (text.length > 0) {
            const timestamp = firestore.FieldValue.serverTimestamp();
            firestore()
                .collection(route.params.chat)
                .add({
                    date: timestamp,
                    email: firebase.auth().currentUser?.email,
                    avatar: route.params.avatar,
                    msg: text,
                    img: "",
                    displayName: firebase.auth().currentUser?.displayName,
                })
            setText("");
            setIsEditable(true);
        } else {
            Alert.alert("", "You cannot send an empty message", [{ text: "ok" }])
            setIsEditable(true);
        }
    }

    /**
     * send a message with the given text and given image to the chat
     * @param img The image to be sent
     */
    function sendImageMessage(img: ImagePickerResponse): void {
        // if the user cancelled, do nothing
        if (!img.didCancel) {
            img.assets?.forEach(asset => {
                if (asset.uri) {
                    const timestamp = firestore.FieldValue.serverTimestamp();
                    const ref = storage().ref(Date.now().toString() + firebase.auth().currentUser?.email);
                    const task = ref.putFile(asset.uri);
                    task.then(() => {
                        ref.getDownloadURL().then((link) => {
                            firestore()
                            .collection(route.params.chat)
                            .add({
                                date: timestamp,
                                email: firebase.auth().currentUser?.email,
                                displayName: firebase.auth().currentUser?.displayName,
                                avatar: route.params.avatar,
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
                    Alert.alert("", "Error occured with the image", [{ text: "ok" }])
                    setIsEditable(true);
                }
            });
        }
    }
    // the size of the phone screen
    const { height, width } = Dimensions.get('window');

    return (<SafeAreaView style={styles.SafeAreaView}>
        {/* a new view to seperate input area and the viewable area for messages */}
        <View style = {{ flex: 8 }}>
            {/* FlashList of messages, is supposed to be faster than a flatlist */}
            <FlashList
                refreshControl = {<RefreshControl refreshing = {refreshing} onRefresh = {onRefresh}/>}
                estimatedItemSize = { 2 }
                data = { data }
                renderItem = { item => {
                    const ownMessage = firebase.auth().currentUser?.email === item.item.email
                    if (item.item.img === "") {
                        // the message has no image
                        return ((
                            <View>
                                <Text style = {{ color: "#000000", alignSelf: "center", marginTop: 30 }}>{item.item.date.toLocaleString()}</Text>
                                <View style = {{ flexDirection: 'row' }}>
                                    <FastImage style = {[{
                                        height: 55,
                                        width: 55,
                                        borderRadius: 100,
                                        marginRight: 10,
                                    }]}
                                        source = {{
                                            uri: item.item.avatar === undefined ? defaultAvatarLink : item.item.avatar,
                                            priority: FastImage.priority.normal,
                                        }}
                                        resizeMode = { FastImage.resizeMode.contain }
                                    />
                                    <Text style = {{ color: "#000000", alignSelf: "center", fontWeight: "bold", fontSize: 18 }}>{item.item.displayName}</Text>
                                </View>
                                <View style = {[styles.messageBox,
                                { alignSelf: "flex-start" },
                                { backgroundColor: ownMessage ? "#0084FF" : "#E4E6EB" },
                                ]}>
                                    <Text style = {[styles.messageTextNoImg,
                                    { color: ownMessage ? "#FFFFFF" : "#000000" }
                                    ]}>{item.item.msg}</Text>
                                </View>
                            </View>))
                    } else {
                        // the message has an image
                        // calculate resized height for the image as to not create a lot of empty space
                        const ratio = item.item.width / item.item.height;
                        const imgHeight = width * ratio - 65; // has -65 because of margins in text box

                        return ((
                            <View>
                                <Text style = {{ color: "#000000", alignSelf: "center", marginTop: 30 }}>{item.item.date.toLocaleString()}</Text>
                                <View style = {{ flexDirection: 'row' }}>
                                    <FastImage style = {[{
                                        height: 55,
                                        width: 55,
                                        borderRadius: 100,
                                        marginRight: 10,
                                    }]}
                                        source = {{
                                            uri: item.item.avatar === undefined ? defaultAvatarLink : item.item.avatar,
                                            priority: FastImage.priority.normal,
                                        }}
                                        resizeMode = { FastImage.resizeMode.contain }
                                    />
                                    <Text style = {{ color: "#000000", alignSelf: "center", fontWeight: "bold", fontSize: 18 }}>{item.item.displayName}</Text>
                                </View>
                                <View style = {[styles.messageBox,
                                { backgroundColor: ownMessage ? "#0084FF" : "#E4E6EB" },
                                ]}>
                                    <Text style = {[styles.messageText,
                                    { color: ownMessage ? "#FFFFFF" : "#000000" },
                                    { height: item.item.msg === "" ? 0 : "auto" },
                                    { marginVertical: item.item.msg === "" ? 0 : 10 },
                                    ]}>{item.item.msg}</Text>

                                    <FastImage style = {{
                                        height: imgHeight,
                                        width: item.item.width,
                                        maxWidth: "100%",
                                        alignSelf: "center"
                                    }}
                                        source = {{
                                            uri: item.item.img,
                                            priority: FastImage.priority.normal,
                                        }}
                                        resizeMode = { FastImage.resizeMode.contain }
                                    />
                                </View>
                            </View>
                        ))
                    }
                }}
            // end of flashlist and message area view
            />
        </View>
        {/* begin of input area at the bottom of the screen */}
        {/* send image button */}
        <View style = {{ backgroundColor: "#ffffff", height: (height / 10 * 1) }}>
            <View style = {[{ flexDirection: 'row', flex: 1, marginLeft: 6 }]}>
                <View style = {[{ flexDirection: 'row', flex: 1 }]}>
                    <TouchableOpacity style = {[{ flex: 1 }]} activeOpacity = {0.5} onPress = {() => {
                        Alert.alert("", "Upload image from", [
                            { text: "Cancel" },
                            { text: "Camera", onPress: () => {
                                // send image from camera
                                launchCamera({ mediaType: "photo" }, (img) => {
                                    setIsEditable(false);
                                    sendImageMessage(img);
                                });
                            }},
                            {text: "Gallery", onPress: () => {
                                // send image from Gallery 
                                launchImageLibrary({ mediaType: "photo", selectionLimit: 1 }, (img) => {
                                    setIsEditable(false);
                                    sendImageMessage(img);
                                });
                            }}])
                    }}>
                        <Image
                            source = {require('../images/imgIcon.png')}
                            style = {{
                                maxHeight: "100%",
                                maxWidth: "100%",
                                resizeMode: "contain"
                            }}
                        />
                    </TouchableOpacity>
                </View>

                {/* Text Input border */}
                <View style = {styles.TextInputBorder}>
                    <TextInput
                        placeholder = 'Aa'
                        placeholderTextColor = {"#000000"}

                        editable = {isEditable}
                        multiline style = {styles.TextInput}
                        onChangeText = {newText => setText(newText)}
                        value = {text} />
                </View>

                {/* Send message button */}
                <View style = {[{ flexDirection: 'row', flex: 1, marginRight: 4 }]}>
                    <TouchableOpacity style = {[{ flex: 1 }]} activeOpacity = {0.5} onPress = {() => {
                        setIsEditable(false);
                        sendMessage();
                    }}>
                        <Image
                            source = {require('../images/sendIcon.png')}
                            style = {{
                                maxHeight: "100%",
                                maxWidth: "100%",
                                resizeMode: "contain"
                            }}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </SafeAreaView>)
}

const styles = StyleSheet.create({
    messageTextNoImg: {
        color: (`#000000`),
        marginHorizontal: 10,
        paddingHorizontal: 5,
        fontSize: 18,
        marginVertical: 10
    },
    messageText: {
        color: (`#000000`),
        marginHorizontal: 10,
        paddingHorizontal: 5,
        fontSize: 18,
    },
    TextInputBorder: {
        flex: 6,
        flexDirection: 'row',
        backgroundColor: "#E4E6EB99",
        borderRadius: 10,
        marginHorizontal: 10,
        marginVertical: 2,
    },
    TextInput: {
        minHeight: "100%",
        minWidth: "100%",
        maxHeight: "100%",
        maxWidth: "100%",
        fontSize: 18,
        color: "#000000"
    },
    SafeAreaView: {
        flex: 1,
        backgroundColor: (`#ffffff`),
    },
    messageBox: {
        marginRight: 10,
        marginLeft: 55,
        borderRadius: 20,
        maxWidth: "100%",
        overflow: "hidden"
    },
})