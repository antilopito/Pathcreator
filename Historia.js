import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';

let about = require('./assets/about.json')

const Historia = () => {
  return (
    <ScrollView 
      style={styles.routeHistoryView} 
      contentContainerStyle={{marginTop: '10%', paddingBottom: 230}}>
      <SafeAreaView>
        <View style={styles.aboutView}>
          <Text style={styles.header1}>{about.info.header}</Text>
          {about.info.text.map((infotext, index) => {
            return (
              <Text key={index} style={styles.aboutTexts}>{infotext}{"\n"}</Text>
            )
          })}
        </View>
        <View style={styles.aboutView}>
          <Text style={styles.header1}>{about.help.header}</Text>
          <Text style={styles.header2}>{about.help.parts.part1.title}</Text>
          {about.help.parts.part1.text.map((helptext, index) => {
            return(
              <Text key={index} style={styles.aboutTexts}>{helptext}{"\n"}</Text>
            )
          })}
          <Text style={styles.header2}>{about.help.parts.part2.title}</Text>
          {about.help.parts.part2.text.map((helptext, index) => {
            return(
              <Text key={index} style={styles.aboutTexts}>{helptext}{"\n"}</Text>
            )
          })}
          <Text style={styles.header2}>{about.help.parts.part3.title}</Text>
          {about.help.parts.part3.text.map((helptext, index) => {
            return(
              <Text key={index} style={styles.aboutTexts}>{helptext}{"\n"}</Text>
            )
          })}
        </View>
        <View style={styles.aboutView}>
          <Text style={styles.header1}>{about.license.header}</Text>
          {about.license.text.map((text, index) => {
            return(
              <Text key={index} style={styles.aboutTexts}>{text}{"\n"}</Text>
            )
          })}
        </View>
      </SafeAreaView>
    </ScrollView>
  )
}

//<Text style={styles.aboutTexts}>{about.info[0]}{"\n"}</Text>
//<Text style={styles.aboutTexts}>{about.info[1]}</Text>

const styles = StyleSheet.create({
  routeHistoryView: {
    flex: 1,
    backgroundColor: '#c3e8da',
    //justifyContent: 'flex-start',
    //alignItems: 'center',
  },
  header1: {
    fontSize: 40, 
    fontWeight: '300', 
    paddingBottom: 15,
    paddingTop: 10,
  },
  header2: {
    fontSize: 35,
    fontWeight: '200',
    paddingBottom: 10,
  },
  aboutView: {
    marginLeft: 20,
    marginRight: 20,
  },
  aboutTexts: {
    fontSize: 18,
    textAlign: 'justify'
  }
})

export default Historia;