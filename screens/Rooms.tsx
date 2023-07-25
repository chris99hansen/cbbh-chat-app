import React, { useEffect, useState } from 'react';
import { RootStackParamList } from '../App';
import { StyleSheet, Text, SafeAreaView, RefreshControl } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { FlashList } from '@shopify/flash-list';
import { StackNavigationProp } from '@react-navigation/stack';

const query = firestore().collection('chats')

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

export default function Screen({ navigation }: Props) {
    // an array to store chats to join
    const [chats, setChats] = useState<chat[]>([])
    // a boolean to indicate to the user that the program is loading
    const [refreshing, setRefreshing] = React.useState(true);

    /*
     * it deletes all chats stored, and finds the listed chats in the firestore collection "chats"
     * it sorts the rooms so the top chat is the chat room with the last recieved message
     * it returns data via side effects to be shown on screen
    */
    function getChats():void {
        setRefreshing(true)
        setChats([]);
        query.get().then(docs => {
        docs.forEach(doc => {
            firestore()
            .collection(doc.data().chat)
            .orderBy("date","desc")
            .limit(1)
            .get()
            .then(foundChat => {
                foundChat.forEach(element => {
                    setChats(oldData => [...oldData, {
                        name: doc.data().chat,
                        date: new Date(element.data().date.toDate() as Date)
                    }])
                })
                setChats(data => 
                    [...data].sort((a,b) => b.date.getTime() - a.date.getTime()));
            })
            .finally(() =>
                { setRefreshing(false) })
        })
        })
    }

    // onRefresh() is called when the user pulls down while being at the top
    function onRefresh(): void {
        getChats();
    }
    
    // this is only called once on a mount and not on each render
    useEffect(() => {
        getChats();
    }, []);
    
    // the view that the user sees
    return (<SafeAreaView style = { styles.SafeAreaView }>
        <FlashList 
        estimatedItemSize = { 8 }
        data = { chats }
        refreshControl = { <RefreshControl refreshing = { refreshing } onRefresh = { onRefresh } />}
        renderItem = { item => {
            // each chat is a big button, clicking on it will enter the chat displayed at the top
            return(
            <TouchableOpacity style = { styles.button } onPress = { () => navigation.navigate("Chat", { name: item.item.name})}>
                <Text style = { styles.text }>{ item.item.name }</Text>
                <Text style = { styles.textInfo }>last message send at</Text>
                <Text style = { styles.textInfo }>{ item.item.date.toLocaleString() }</Text>
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
        paddingVertical: 20,
        borderStyle: 'solid',
        borderWidth: 1,
        margin: 10,
        borderRadius: 10
    },
})