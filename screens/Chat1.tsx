import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Pressable,
    SafeAreaView,
    StatusBar,
    useColorScheme,
    RefreshControl,
} from 'react-native';
import { FlatList, ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
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
    const [refreshing, setRefreshing] = useState(false);
    
    useEffect(() => {const observer = query.onSnapshot(querySnapshot => {
        querySnapshot.docChanges().forEach(element => {
            if(element.type === "added"){
                
                setData(current => [...current, {email: element.doc.data().email,
                                                msg: element.doc.data().msg, 
                                                date: new Date(element.doc.data().date.toDate() as Date)}])
                console.log(element.doc.data().email)
            }
        });
        console.log(`Received query snapshot of size ${querySnapshot.size}`);
      }, err => {
        console.log(`Encountered error: ${err}`);
      });
    }, []);
    
    function onRefresh(): void {
        setRefreshing(true)

        setRefreshing(false)
    }

    return (<SafeAreaView style={styles.SafeAreaView}>
        <View style={styles.view}>
            
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
    view: {
        flex: 1,
        backgroundColor: (`#a9a9a9`),
        borderRadius: 25,
        margin:20,
        overflow: "hidden",
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