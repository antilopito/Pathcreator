import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Jumppa = () => {
  return (
    <View style={styles.jumppaView}>
      <Text style={{fontSize: 20}}>Coming soon!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  jumppaView: {
    flex: 1,
    backgroundColor: '#c3e8da',
    justifyContent: 'center',
    alignItems: 'center'
  }
})

export default Jumppa;
