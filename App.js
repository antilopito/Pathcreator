import React, { useState, useEffect} from 'react';
import { StyleSheet, Text, View, StatusBar, Pressable} from 'react-native';
import Kartta from './Kartta';
import Jumppa from './Jumppa';
import Historia from './Historia';
import { FontAwesome5, MaterialCommunityIcons, Entypo } from '@expo/vector-icons';

const App = () => {
  //Vakiona kartta, screenNamen perusteella 
  

  //---------------------------------------------------
  //
  //
  //Nämä useStatet pitikin śiirtää Appiin, sillä muuten sovellus unohtaa Kartta.js:ssä tehdyt set-alkuiset operaatiot.
  //AsyncStorage ei ollut toimiva ratkaisu, koska sinne ei voinut tallentaa esim. True/False arvoja, eli esim drawable
  //(voidaanko kartta piirtää) palaisi aina falseksi, kun siirrytään Kartta -> Jumppa -> Kartta
  const [drawable, setDrawable] = useState(false);
  const [initialRegion, setInitialRegion] = useState(null); // kartta latautuu tämän ympärille
  const [useManualLocation, setUseManualLocation] = useState(false);
  const [manualLocation, setManualLocation] = useState('');
  const [routePoints, setRoutePoints] = useState([
    {
      latitude: 0,
      longitude: 0
    }
  ])  // Kartalle sillä hetkellä piirretyn reitin pisteet
  const [userLocation, setUserLocation] = useState(null)  // Käyttäjän sijainti
  //TÄHÄN ASTI
  //
  //------------------------------------------------
  
  // reittien näyttämistä etc.
  // nämä reitit = olioita joilla sekä koordinaattitaulukko että matka, mutta ei nimeä.
  const [reitit, setReitit] = useState([]);
  // mikä reitit-taulukon alkio on käytössä.
  const [indeksi, setIndeksi] = useState(0);
  
  const [displaydistance, setDisplayDistance] = useState('');
  const [displaydate, setDisplayDate] = useState('');

  //renderöidään komponentti
  const [screenName, setScreen] = useState('Kartta');
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [iconPressed, setIconPressed] = useState('kartta')

  const [routeExists, setRouteExists] = useState(false);
  const [locationExists, setLocationExists] = useState(false);
    // Timerin toiminta
    useEffect(() => {
      let ajastin;
      if (running) {
        ajastin = setInterval(() => {
          setTime((prevTime) => prevTime + 1);
        }, 1000);
      } else if (!running) {
        clearInterval(ajastin);
      }
      return () => clearInterval(ajastin);
    }, [running]);

  return (
    <View style={{flex: 1}}>
    <StatusBar backgroundColor="black" translucent={true} /> 
      <View style={styles.ylaosa}>
          {screenName === 'Jumppa' ? (
            <Jumppa />
          ) : screenName === 'Historia' ? (
            <Historia />
          ) : (
            //Tämän syntaksin default case, joten lisäsin Kartan tänne
			<Kartta 
			reitit={reitit} setReitit={setReitit} indeksi={indeksi} setIndeksi={setIndeksi} 
			displaydistance={displaydistance} setDisplayDistance={setDisplayDistance} displaydate={displaydate} setDisplayDate={setDisplayDate} 
			drawable={drawable} 
			setDrawable={setDrawable} 
			userLocation={userLocation} 
			setUserLocation={setUserLocation} 
			initialregion={initialRegion} 
			setInitialRegion={setInitialRegion}
            manualLocation={manualLocation} 
			setManualLocation={setManualLocation} 
			useManualLocation={useManualLocation} 
			setUseManualLocation={setUseManualLocation} 
			routePoints={routePoints} 
			setRoutePoints={setRoutePoints}
      routeExists={routeExists}
      setRouteExists={setRouteExists}
      locationExists={locationExists}
      setLocationExists={setLocationExists}
			/>
          )}
        </View>
        <View style={styles.alaosa1}>
            <View style={styles.alaosa1nappipalkki}>
              <Text style={styles.ajastin}>
                {("0" + Math.floor(time / 3600)).slice(-2)}:
                {("0" + Math.floor((time % 3600) / 60)).slice(-2)}:
                {("0" + (time % 60)).slice(-2)}
              </Text>
              <Pressable
                  style={[styles.ajastinnapit, {backgroundColor: '#e0e0e0'}]}
                  onPress={() => {
                      setRunning(false)
                      setTime(0)
                  }}>
                  <Text style={styles.buttontext}>Clear</Text>
              </Pressable>
              <Pressable 
                  style={[styles.ajastinnapit, {backgroundColor: !running ? '#5af282' : '#f25a5a'}]}
                  onPress={!running ? () => { setRunning(true) } : () => setRunning(false)}>
                  <Text style={styles.buttontext}>{!running ? "Start" : "Stop"}</Text>
              </Pressable>
            </View>
        </View>
      <View style={styles.alaosa2}>
        <View style={styles.alaosa2nappipalki}>

          <Pressable style={styles.vaihtonapit} 
            onPress={() => {
              setScreen('Kartta') 
              setIconPressed('kartta')}} >
            <View style={styles.tabBarButtons}>
              <FontAwesome5 name="map-marked-alt" 
                size={iconPressed === 'kartta' ? 24 : 24} 
                color={iconPressed === 'kartta' ? 'black' : '#474747'} />
              <Text>MAP</Text>
            </View>
          </Pressable>

          <Pressable style={styles.vaihtonapit} onPress={() => {
            setScreen('Jumppa')
            setIconPressed('jumppa')}} >
            <View style={styles.tabBarButtons}>
              <MaterialCommunityIcons name="weight-lifter" 
                size={iconPressed === 'jumppa' ? 24 : 24} 
                color={iconPressed === 'jumppa' ? 'black' : '#474747'} />
              <Text>EXERCISE</Text>
            </View>
          </Pressable>

          <Pressable style={styles.vaihtonapit} 
            onPress={() => {
              setScreen('Historia')
              setIconPressed('historia')}} >
            <View style={styles.tabBarButtons}>
              <Entypo name="help"
                size={iconPressed === 'historia' ? 24 : 24} 
                color={iconPressed === 'historia' ? 'black' : '#474747'} />
              <Text>HELP</Text>
            </View>
          </Pressable>

        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  ylaosa: {
    flex: 1,
    //width: '100%',
    //maxHeight: '100%', //88 näyttäis linjautuvan alapalkkien kanssa, ainakin androidissa
  },
  alaosa1: {
    backgroundColor: '#c3e8da',
    //position: 'absolute',
    height: '10%', //80-10-10 jako
    bottom: '10%', //alareunasta 10% (eli valikkopalkin verran)
    width: '100%',
  },
  alaosa1nappipalkki: {
    flexDirection: 'row',
    justifyContent: 'center',
    //padding: 10,
    padding: 5,
    top: 5,
    backgroundColor: '#70c4a4',
    width: '90%',
    marginLeft: 20,
    borderRadius: 20,
  },
  alaosa2: {
    width: '100%',
    height: '10%',
    position: 'absolute',
    bottom: '0%',
    //borderTopColor: 'black',
    //borderTopWidth: 3,
    backgroundColor: '#f2f5f3',
  },
  alaosa2nappipalki: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    //marginBottom: 10
  }, 
  ajastin: {
    top: '1%',
    fontSize: 25,
    marginRight: '10%',
  },
  ajastinnapit: {
    //top: '1%',
    borderRadius: 10,
    padding: 10,
    marginLeft: 10
  },
  tabBarButtons: {
    //top: '1%',
    alignItems: 'center',
    //padding: 8,
  },
});

export default App;