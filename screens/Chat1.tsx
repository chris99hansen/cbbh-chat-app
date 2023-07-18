import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    SafeAreaView,
    RefreshControl,
    Image,
    FlatList,
    TextInput, 
    TouchableOpacity,
    Alert
} from 'react-native';
import firestore from '@react-native-firebase/firestore';

interface message {
    email: string;
    msg: string;
    date: Date;
}
//firebase.firestore.FieldValue.serverTimestamp()
const db = firestore();
const query = db.collection('chat1').orderBy("date","desc").limit(50)

export default function Screen({navigation}: any) {

    const [data, setData] = useState<message[]>([])
    const [refreshing, setRefreshing] = useState(true);
    const [text, setText] = useState("");
    
    useEffect(() => {
        const observer = query.onSnapshot(querySnapshot => {
        setRefreshing(false);
        querySnapshot.docChanges().forEach(element => {
            if(element.type === "added" && element.doc.data().date != null){
                //TODO add comment about this
                if(data.length > 0 && new Date(element.doc.data().date.toDate() as Date) > data[data.length - 1].date){
                    setData(current => [...current, {email: element.doc.data().email,
                                        msg: element.doc.data().msg, 
                                        date: new Date(element.doc.data().date.toDate() as Date)}])
                }else{
                    setData(current => [{email: element.doc.data().email,
                        msg: element.doc.data().msg, 
                        date: new Date(element.doc.data().date.toDate() as Date)},...current])
                }
            }else{
                if(element.type === "modified"){
                    setData(current => [...current, {email: element.doc.data().email,
                                        msg: element.doc.data().msg, 
                                        date: new Date(element.doc.data().date.toDate() as Date)}])
                }
            }
            
        });
        console.log(`Received query snapshot of size ${querySnapshot.size}`);
      }, err => {
        console.log(`Encountered error: ${err}`);
      });
    }, []);
    
    function onRefresh(): void {
        if(data.length > 0){
            //TODO fix small bug where if 2 or more messages were sent at the EXACT same time they will be skipped
            firestore().collection("chat1").where("date","<",data[0].date).orderBy("date","desc").limit(10).get().then(docs =>{
                docs.forEach(element => {
                    setData(current => [{email: element.data().email,
                        msg: element.data().msg, 
                        date: new Date(element.data().date.toDate() as Date)},...current])
                
                });
            })
        }
        setRefreshing(false)
    }

    return (<SafeAreaView style={styles.SafeAreaView}>
        <View style={{flex: 8}}>
            
        <FlatList style={styles.scroll}
        data={data}
        renderItem={item =>(
            <View>
                <View style={styles.messageBoxOthers}>
                    <Text style={styles.messageText}>date: {item.item.date.toLocaleString()}</Text>
                    <Text style={styles.messageText}>email: {item.item.email}</Text>
                    <Text style={styles.messageText}>message: {item.item.msg}</Text>
                </View>
            </View>)
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}/>
        </View>
        <View style={{flex: 2,flexDirection:'row', backgroundColor: "#ffffff"}}>
                <View style={[{flexDirection:'row', flex:1}]}>
                    <TouchableOpacity style={[{ flex:1}]} activeOpacity={0.5} onPress={() => {}}>
                        <Image
                        source={require('../images/imgIcon.png')}
                        style={{
                            maxHeight: "100%",
                            maxWidth: "100%",
                            resizeMode: "contain"}}
                        />
                    </TouchableOpacity>
                </View>

                <View style={[{flex:3,flexDirection:'row',borderStyle: "solid", borderWidth: 1,borderRadius:10,margin:10}]}>
                    
                    <TextInput editable multiline style={[{minHeight:"100%",minWidth:"100%",maxHeight: "100%",maxWidth: "100%",color:"#000000"}]} 
                    onChangeText={newText => setText(newText)}
                    value={text}
                    />
                </View>


                <View style={[{flexDirection:'row',flex:1}]}>
                    <TouchableOpacity style={[{flex:1}]} activeOpacity={0.5} onPress={() => {
                        if(text.length > 0){
                            const timestamp = firestore.FieldValue.serverTimestamp();
                            firestore()
                            .collection('chat1')
                            .add({
                                date: timestamp,
                                email: "chris99hansen@gmail.com",
                                msg: text
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
        backgroundColor: (`#a9a9a9`),
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
        borderRadius: 1,
    },
    messageBoxOthers: {
        marginTop: 10,
        marginLeft: 10,
        borderWidth: 1,
        borderStyle: "solid",
        maxWidth: "80%",
    },
    messageBoxYou: {
        marginTop: 10,
        marginLeft: 10,
        borderWidth: 1,
        borderStyle: "solid",
        maxWidth: "80%",
    },
})