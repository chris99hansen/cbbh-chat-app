import React, { useState, useEffect } from 'react';
import { RootStackParamList } from '../App';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
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
import auth, { FirebaseAuthTypes, firebase } from '@react-native-firebase/auth';
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
//firebase.firestore.FieldValue.serverTimestamp()
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
    const [data, setData] = useState<message[]>([])
    const [refreshing, setRefreshing] = useState(true);
    const [text, setText] = useState("");
    
    useEffect(() => {
        navigation.setOptions({ title: route.params.name })
        const observer = db.collection(route.params.name).orderBy("date","desc").limit(50).onSnapshot(querySnapshot => {
        setRefreshing(false);
        querySnapshot.docChanges().forEach(element => {
            if(element.type === "added" && element.doc.data().date != null){
                //TODO add comment about this
                if(data.length > 0 && new Date(element.doc.data().date.toDate() as Date) > data[data.length - 1].date){
                    setData(current => [...current, {
                        email: element.doc.data().email,
                        msg: element.doc.data().msg, 
                        date: new Date(element.doc.data().date.toDate() as Date),
                        img: element.doc.data().img,
                        height: element.doc.data().height,
                        width: element.doc.data().width
                    }])
                }else{
                    setData(current => [{
                        email: element.doc.data().email,
                        msg: element.doc.data().msg, 
                        date: new Date(element.doc.data().date.toDate() as Date),
                        img: element.doc.data().img,
                        height: element.doc.data().height,
                        width: element.doc.data().width
                        },...current])
                }
            }else{
                if(element.type === "modified"){
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
        if(data.length > 0){
            //TODO fix small bug where if 2 or more messages were sent at the EXACT same time they will be skipped
            firestore().collection(route.params.name).where("date","<",data[0].date).orderBy("date","desc").limit(10).get().then(docs =>{
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
            })
        }
        setRefreshing(false)
    }

    return (<SafeAreaView style={styles.SafeAreaView}>
        <View style={{flex: 8}}>
        {/*FlashList of messages */}
        <FlashList
        estimatedItemSize={2}
        data={data}
        renderItem={item =>{if(item.item.img === ""){
        {/* No image*/}
            return((
                <View style={styles.messageBoxOthers}>
                    <Text style={styles.messageText}>date: {item.item.date.toLocaleString()}</Text>
                    <Text style={styles.messageText}>email: {item.item.email}</Text>
                    <Text style={styles.messageText}>message: {item.item.msg}</Text>
                </View>))
        }else{
            {/* With image*/}

            //calculate resized height 
            const {height, width} = Dimensions.get('window');
            const ratio = item.item.width/item.item.height;
            const imgHeight = (width*0.8)*ratio;

            return((
                <View style={styles.messageBoxOthers}>
                    <Text style={styles.messageText}>date: {item.item.date.toLocaleString()}</Text>
                    <Text style={styles.messageText}>email: {item.item.email}</Text>
                    <Text style={styles.messageText}>message: {item.item.msg}</Text>
                    <Image  style={{
                        height: imgHeight,
                        width: item.item.width,
                        maxWidth: "100%",
                        resizeMode: "contain",
                        alignSelf: "center"}}
                        source={{uri: item.item.img}}/>
                    <Text>test</Text>
                </View>
            ))
        }}
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}/>
        </View>

        {/*Send image button */}
        <View style={{flex: 2,flexDirection:'row', backgroundColor: "#ffffff"}}>
                <View style={[{flexDirection:'row', flex:1}]}>
                    <TouchableOpacity style={[{ flex:1}]} activeOpacity={0.5} onPress={() => {
                        Alert.alert("","Upload image from",[
                            {text:"Cancel"},
                            {text:"Camera", onPress: () =>{
                                {/*Send image from camera */}
                                launchCamera({mediaType: "photo"}, (img) =>{
                                    if (!img.didCancel){
                                        img.assets?.forEach(asset =>{
                                            const timestamp = firestore.FieldValue.serverTimestamp();
                                            const ref = storage().ref(Date.now().toString()+firebase.auth().currentUser?.email)
                                            if(asset.uri){
                                                const task = ref.putFile(asset.uri);
                                                task.then(() => {
                                                    ref.getDownloadURL().then((link) =>{
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
                                                    })
                                                })
                                            }else{
                                                Alert.alert("","Error occured with the image",[{text:"ok"}])
                                            }
                                            
                                        });
                                    }
                                });
                            }},
                            {text:"Gallery", onPress: () =>{
                                {/*Send image from Gallery */}
                                launchImageLibrary({mediaType: "photo", selectionLimit: 1}, (img) =>{
                                    if (!img.didCancel){
                                        img.assets?.forEach(asset =>{
                                            const timestamp = firestore.FieldValue.serverTimestamp();
                                            const ref = storage().ref(Date.now().toString()+firebase.auth().currentUser?.email)
                                            if(asset.uri){
                                                const task = ref.putFile(asset.uri);
                                                task.then(() => {
                                                    ref.getDownloadURL().then((link) =>{
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
                                                    })
                                                })
                                            }else{
                                                Alert.alert("","Error occured with the image",[{text:"ok"}])
                                            }
                                            
                                        });
                                    }
                                });
                            }}])
                    }}>
                        <Image
                        source={require('../images/imgIcon.png')}
                        style={{
                            maxHeight: "100%",
                            maxWidth: "100%",
                            resizeMode: "contain"}}
                        />
                    </TouchableOpacity>
                </View>

                {/*Textinput field*/}
                <View style={[{flex:3,flexDirection:'row',borderStyle: "solid", borderWidth: 1,borderRadius:10,margin:10}]}>
                    
                    <TextInput editable multiline style={[{minHeight:"100%",minWidth:"100%",maxHeight: "100%",maxWidth: "100%",color:"#000000"}]} 
                    onChangeText={newText => setText(newText)}
                    value={text}
                    />
                </View>

                {/*Send message button */}
                <View style={[{flexDirection:'row',flex:1}]}>
                    <TouchableOpacity style={[{flex:1}]} activeOpacity={0.5} onPress={() => {
                        if(text.length > 0){
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
                        }else{
                            Alert.alert("","You cannot send an empty message",[{text:"ok"}])
                        }
                    }}>
                        <Image
                        source={require('../images/sendIcon.png')}
                        style={{
                            maxHeight: "100%",
                            maxWidth: "100%",
                            resizeMode: "contain"}}
                        />
                    </TouchableOpacity>
                    
                </View>
                
            
        </View>
        </SafeAreaView>)
}

const styles = StyleSheet.create({
    text: {
        fontSize: 40,
        fontWeight: 'bold',
        margin: 10,
        color: (`#000000`),
        textAlign: "center",
        textShadowColor:'#585858',
        textShadowOffset:{width: 1, height: 1},
        textShadowRadius:1,
    },
    textInfo: {
        fontSize: 20,
        fontWeight: 'bold',
        margin: 10,
        color: (`#000000`),
        textShadowColor:'#585858',
        textShadowOffset:{width: 1, height: 1},
        textShadowRadius:1,
    },
    messageText: {
        color: (`#000000`),
        marginHorizontal: 10,
    },
    SafeAreaView: {
        flex: 1,
        backgroundColor: (`#ffffff`),
    },
    inputView:{
        minHeight: "10%",
        maxHeight: "20%",
        width: "100%",
        flexDirection:'row',
        backgroundColor: (`#a9a9a9`),
    },
    view: {
        flex: 1,
        width: "100%",
        maxHeight: "90%",
        backgroundColor: (`#a9a9a9`),
    },
    button: {
        paddingVertical: 20,
        borderStyle: 'solid',
        borderWidth: 1,
        margin: 10,
        borderRadius: 10
    },
    scroll: {
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