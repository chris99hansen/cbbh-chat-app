import React, { useEffect, useState } from 'react';
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
import firestore from '@react-native-firebase/firestore';
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

const db = firestore();
const query = db.collection('chats')

interface chat {
    name: string;
    date: Date;
}

export default function Screen() {
    const [chats, setChats] = useState<chat[]>([])
    const [refreshing, setRefreshing] = React.useState(true);
    const navigation = useNavigation();
    
    function onRefresh(): void {
        setRefreshing(true)
        setChats([]);
        query.get().then(docs =>{
        docs.forEach(doc => {
            firestore().collection(doc.data().chat).orderBy("date","desc").limit(1).get().then(foundChat => {
                foundChat.forEach(element =>{
                    setChats(oldData => [...oldData,{name: doc.data().chat, date: new Date(element.data().date.toDate() as Date)}])
                })
                setChats(data => [...data].sort((a,b) => b.date.getTime() - a.date.getTime()));
                setRefreshing(false)
            })
        })
        })
    }

    useEffect(() => {
        setChats([]);
        query.get().then(docs =>{
        docs.forEach(doc => {
            firestore().collection(doc.data().chat).orderBy("date","desc").limit(1).get().then(foundChat => {
                foundChat.forEach(element =>{
                    setChats(oldData => [...oldData,{name: doc.data().chat, date: new Date(element.data().date.toDate() as Date)}])
                })
                setChats(data => [...data].sort((a,b) => b.date.getTime() - a.date.getTime()));
                setRefreshing(false)
            })
        })
        
        })
    }, []);


    

    return (<SafeAreaView style={styles.SafeAreaView}>
        <FlashList 
        estimatedItemSize={8}
        data={chats}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={item => {
            return(
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Chat1' as never)}>
                <Text style={styles.text}>{item.item.name}</Text>
                <Text style={styles.textInfo}>last message send at {item.item.date.toLocaleString()}</Text>
            </TouchableOpacity>
            )
        }}
        />
        
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
    SafeAreaView: {
        flex: 1,
        backgroundColor: (`#FFFFFF`),
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
})