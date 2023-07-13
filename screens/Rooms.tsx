import React from 'react';
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
import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';






export default function ScreenA() {
    const [refreshing, setRefreshing] = React.useState(false);
    
    function onRefresh(): void {
        setRefreshing(false)
    }

    return (<SafeAreaView style={styles.SafeAreaView}>
        <View style={styles.view}>
            
        <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
            <TouchableOpacity style={styles.button}>
                <Text style={styles.text}>Chat1</Text>
                <Text style={styles.textInfo}>Chat1</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button}>
                <Text style={styles.text}>Chat2</Text>
            </TouchableOpacity>
        </ScrollView>        
        
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
})