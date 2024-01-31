import React, { useEffect, useState } from 'react';

import { StyleSheet, Text, Keyboard, View, Button, Pressable, TextInput, Modal, ScrollView, SafeAreaView} from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { FontAwesome5 } from '@expo/vector-icons';
// distm ja newNorthEast (operaatiot_koordinaattipisteet2.js)
import { teelatlonarray, kaikkireitit2 } from './funktiotiedostot/operaatiot_reititin2.js';
// tietokannat
import * as SQLite from 'expo-sqlite';


const App = ({
  reitit, setReitit, indeksi, setIndeksi, 
  displaydistance, setDisplayDistance, displaydate, setDisplayDate, 
  drawable, 
  setDrawable, 
  userLocation, 
  setUserLocation, 
  setRoutePoints, 
  routePoints, 
  initialRegion, 
  setInitialRegion, 
  manualLocation, 
  setManualLocation, 
  seManualLocation, 
  setUseManualLocation,
  routeExists,
  setRouteExists,
  locationExists,
  setLocationExists
  }) => {
  const [distance, setDistance] = useState(0) //Käyttäjän määrittelemä reitin pituus
  // APP JS const [userLocation, setUserLocation] = useState(null)  // Käyttäjän sijainti
  const [errormessage, setErrormessage] = useState(null)
  /* APP JS const [routePoints, setRoutePoints] = useState([
    {
      latitude: 0,
      longitude: 0
    }
  ])  // Kartalle sillä hetkellä piirretyn reitin pisteet */
  const [lastPoint, setLastPoint] = useState(null)  // Se piste, JOSTA lähdetään seuraavaksi piirtämään reittiä
  const initialCoordinate = {   // Oletuskoordinaatit sisältävä olio: Agoran koordinaatit
    latitude: 62.2329,
    longitude: 25.7381,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005
  }
  // APP JS const [initialRegion, setInitialRegion] = useState(null); // kartta latautuu tämän ympärille
  const [time, setTime] = useState(0); // Timerin aika
  const [running, setRunning] = useState(false); // Timerin status
  const [currentRoute, setCurrentRoute] = useState(null) // Current route, sisältää 0-1 reitin id:n, tämän id:n avulla voidaan esim. tallentaa tietokantaan tai hakea tietokannasta
  const [routeName, setRouteName] = useState(null) // Tallennettavan reitin nimi, muuttuu input-kentän mukaan
  const [distanceValidity, setDistanceValidity] = useState(false) // Sisältää tiedon siitä onko syötetty reitin pituus validi
  const [distanceError, setDistanceError] = useState(null) // Reitin pituuden virheilmoitus
  const [routeNameValidity, setRouteNameValidity] = useState(false) // Sisältää tiedon siitä onko syötetty reitin nimi validi
  const [routeNameError, setRouteNameError] = useState(null) // Reitin nimen virheilmoitus

  // Sisältää tiedon siitä, onko pop-up ikkunat auki vai ei.
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showRouteListModal, setShowRouteListModal] = useState(false)
  
   // Sisältää kaikkien tallennettujen reittien nimet, haetaan tietokannasta, tämän avulla saadaan nimet listattua myöhemmin
  const [routes, setRoutes] = useState([]);
  const db = SQLite.openDatabase('Lenkki.db');

  const today = new Date().toISOString().slice(0, 10);

  const getManualLocation = async () => {
    if (!drawable) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${manualLocation}&format=json`);
        const data = await response.json();
        if (data && data.length > 0) {
          //Sinänsä vähän purukumimainen toteutus, että jos on esim
          //Pappilankatu, niin otetaan se eka tulos, eikä välttämättä
          //mitä käyttäjä haluaa. Tähän olis TODO antaa joku 
          //esim scrollattava popup valikko
          const first = data[0];
          const newRegion = {
            latitude: parseFloat(first.lat),
            longitude: parseFloat(first.lon),
            latitudeDelta: 0.05,
            longitudeDelta: 0.05
          };
          setInitialRegion(newRegion);
          setUserLocation(newRegion);
          setLocationExists(true);
          setDrawable(true);
        }
      } catch (virhe) {
        console.error(virhe)
      }
    }
  };
  
  const [tekstikentta, setTekstikentta] = useState('');

  // Tarkistetaan onko lupa käyttäjän sijaintiin ja pidetään sijaintia yllä userLocation-muuttujassa
  const getLocation = async () => {
  
    let { status } = await Location.requestForegroundPermissionsAsync()
    if (status === 'granted') {
      let location = await Location.getCurrentPositionAsync({})
      const newLocation = {
        latitude: parseFloat(location.coords.latitude),
        longitude: parseFloat(location.coords.longitude),
        latitudeDelta: 0.05,
        longitudeDelta: 0.05
      };
      setInitialRegion(newLocation); 
      setUserLocation(newLocation); 
      setLocationExists(true);
      setDrawable(true)
    } else {
      console.log('Sijainti kiellettiin!')
    }
  }

  // Haetaan reittien nimet tietokannasta
  const loadRoutes = () => {
    db.transaction(tx => {
      tx.executeSql('SELECT name, distance, date FROM routes', null,
        (txObj, resultSet) => setRoutes(resultSet.rows._array),
        (txObj, error) => console.log(error)
      )
    })
  }
	
// Reitin tallennus tietokantaan
  // reitit[indeksi].matka
  const saveRoute = () => {
	// console.log(reitit[indeksi].matka);
    db.transaction(tx => {
      tx.executeSql('INSERT INTO routes (name, coords, distance, date) values (?, ?, ?, ?)', [routeName.trim(), JSON.stringify(routePoints), reitit[indeksi].matka, today],
        (txObj, resultSet) => {
          let existingRoutes = [...routes]
          existingRoutes.push({ name: routeName })
          existingRoutes.sort()
          setRoutes(existingRoutes)
          setRouteName('')
        },
        (txObj, error) => console.log(error)
      )
    })
    loadRoutes()
  }

  
  // Tallennetun reitin avaaminen kartalle
  const openRoute = (name) => {
    db.transaction(tx => {
      tx.executeSql('SELECT coords, distance, date FROM routes WHERE name = ?', [name],
        (txObj, resultSet) => {
          let parsittuReitti = JSON.parse(resultSet.rows._array[0].coords)
          setRoutePoints(parsittuReitti)
		  setDisplayDistance(Math.round(resultSet.rows._array[0].distance));
		  setDisplayDate(resultSet.rows._array[0].date);
      setRouteExists(true)
        },
        (txObj, error) => console.log(error)
      )
    })
  }

  // Reitin poisto tietokannasta
  const deleteRoute = (name) => {
    db.transaction(tx => {
      tx.executeSql('DELETE FROM routes WHERE name = ?', [name],
        (txObj, resultSet) => {
          if (resultSet.rowsAffected > 0) {
            let existingRoutes = [...routes].filter(route => route.name !== name)
            existingRoutes.sort()
            setRoutes(existingRoutes)
          }
        },
        (txObj, error) => console.log(error)
      )
    })
  }

  // Tarkistaa onko syötetty reitin pituus validi.
  // Pituus täytyy olla 1-50 km, desimaalit erotetaan pisteellä
  // Jos parseFloat ei onnistu parsimaan syötteestä lukua => "Not a number!"
  const checkDistanceValidity = () => {

    if (!distance) {
      setDistanceValidity(false)
      setDistanceError(null)
      return
    }
    let parsittuDistance = parseFloat(distance)
    if (isNaN(parsittuDistance)) {
      setDistanceValidity(false)
      setDistanceError('Not a number!')
      setTekstikentta('Not a number!')
      return
    }
    if (parsittuDistance < 1) {
      setDistanceValidity(false)
      setDistanceError('Distance must be over 0.5 km!')
	  setTekstikentta('Distance must be over 0.5 km!')
      return
    }
    if (parsittuDistance > 50) {
      setDistanceValidity(false)
      setDistanceError('Distance must be under 500 km!')
	  setTekstikentta('Distance must be under 500 km!')
      return
    }
    setDistance(parsittuDistance)
    setDistanceValidity(true)
    setDistanceError(null)
	setTekstikentta('')
  }

  // Tarkistaa onko syötetty reitin nimi validi.
  // Nimen pituus täytyy olla 1-50 merkkiä, välilyönnit alussa ja lopussa trimmataan pois eli ne eivät lukeudu merkkimäärään
  // Sama nimi ei ole mahdollinen
  const checkRouteNameValidity = () => {

    if (!routeName) {
      setRouteNameValidity(false)
      setRouteNameError(null)
      return
    }
    let parsittuNimi = routeName.trim()
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].name.toLowerCase() === parsittuNimi.toLowerCase()) {
        setRouteNameValidity(false)
        setRouteNameError('A route already exists with this name!')
        return
      }
    }
    if (parsittuNimi.length > 50) {
      setRouteNameValidity(false)
      setRouteNameError('Route name is too long!')
      return
    }
    setRouteName(parsittuNimi)
    setRouteNameValidity(true)
    setRouteNameError(null)
  }


  // Kun käyttäjä painaa jotakin pistettä kartalla, tullaan tähän funktioon, joka tallentaa painetun pisteen
  // koordinaatit olioon. Tämä olio lisätään sitten kaikki pisteet sisältävään routePoints-listaan.
  // HUOM! Ainakin toistaiseks näillä koordinaattiolioilla on PAKKO olla key-attribuutti!
  // Lopuksi viedään tämä uusi koordinaattiolio createRoute-funktiolle.
  const handleNewRoutePoint = async (event) => {
    const newRoutePoint = {
      coordinate: event.nativeEvent.coordinate,
      key: Date.now().toString()
    }
    const newRoute = await createRoute(userLocation, newRoutePoint)
  }
  
  // Pyydetään kahden pisteen välinen reitti osrm:lta. Nämä kaksi pistettä ovat:
  // 1. p1-olio, joka funktiolle tuodaan parametrina, ja joka on piirrettävän reitin alkupiste.
  // 2. p2-olio, joka funktiolle tuodaan parametrina, ja joka on piirrettävän reitin päätepiste.
  const createRoute = async (point1, point2) => {
    try {
      p1 = [point1.latitude, point1.longitude]
      p2 = [point2.coordinate.latitude, point2.coordinate.longitude]
      console.log('Points p1 ja p2: ', p1, p2);

      fetch(`https://routing.openstreetmap.de/routed-foot/route/v1/foot/${p1[1]},${p1[0]};${p2[1]},${p2[0]}?geometries=geojson`)
        .then(res => {return res.json()})
        .then((result) => {
          console.log('Result of API call: ', result)
          console.log('Reitin pisteet: ', result.routes[0].geometry.coordinates)
          let routeCoords = []
          for (let i = 0; i < result.routes[0].geometry.coordinates.length; i++) {
            routeCoords[i] = {
              latitude: result.routes[0].geometry.coordinates[i][1],
              longitude: result.routes[0].geometry.coordinates[i][0]
            }
          }
          setRoutePoints(routeCoords)
        })
    } catch (error) {
      console.error("Error in createRoute:", error);
      return []; 
    }
  }

  // Pitää yllä käyttäjän sijaintia.
  useEffect(() => {
    //Tästä edetään nyt vain yhden kerran, ekalla käynnistyksellä
    //Periaatteessa voitaisiin laittaa vaan getLocation(), mutta 
    //silloin aina kun palataan välilehdiltä Kartta.js, niin 
    //tulee uusiksi se "Sijainti: Estä/Salli"
    if (!drawable) {
      getLocation();
    } else {
      console.log("Estettiin sijainnin uudelleenkysyntä")
    }
  }, []);
  
  // tietokannan ylläpito
  useEffect(() => {
    db.transaction(tx => {
      tx.executeSql('CREATE TABLE IF NOT EXISTS routes (name VARCHAR PRIMARY KEY, coords VARCHAR, distance DECIMAL(4,2), date DATE)') // 'CREATE TABLE IF NOT EXISTS routes (name VARCHAR PRIMARY KEY, coords VARCHAR, distance DECIMAL(4,2), date DATE)'
    })
	  loadRoutes()
  }, [])

 // Listaa reittien nimet dynaamisesti
  const showRoutes = () => {
	  // TODO: reitin nimi nappien päälle näkymään!
	console.log(routes);
    return routes.map((route, index) => {
      return (
        <View key={index}>
		  <Text>{route.name}</Text>
          <Button title='Open' onPress={() => openRoute(route.name)}/>
          <Button title='Delete' onPress={() => deleteRoute(route.name)}/>
        </View>
      )
    })
  }

 /* Ladataan reittidata AsyncStoragesta, kun tämä komponentti ladataan
    useEffect(() => {
      const lataaReittidata = async () => {
        try {
          const reittidata = await AsyncStorage.getItem('reittiData');
          if (reittidata) {
            const parsittuReitti = JSON.parse(reittidata);
            // HUOM: TEMP POIS KOMMENTOINTI!
			setRoutePoints(parsittuReitti);
          }
        } catch (error) {
          console.error('Virhe ladatessa reittiä:', error);
        }
      };
      lataaReittidata();
    }, []);
	
  // Tallennetaan reitti AsyncStorageen
  useEffect(() => {
    const tallennaReitti = async () => {
      try {
        await AsyncStorage.setItem('reittiData', JSON.stringify(routePoints));
      } catch (error) {
        console.error('Virhe tallentaessa reittiä:', error);
      }
    };
    tallennaReitti();
  }, [routePoints]);
*/
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

 // Pidetään yllä distanceValidity
  useEffect(() => {
    checkDistanceValidity()
  }, [distance])

  // Pidetään yllä routeNameValidity
  useEffect(() => {
    checkRouteNameValidity()
  }, [routeName])

    return (
      <ScrollView keyboardShouldPersistTaps={'handled'}
        contentContainerStyle={{alignItems: 'center', justifyContent: 'center', paddingBottom: 200}}
        style={styles.appView}>
          <SafeAreaView style={styles.mapSafeAreaView}>
          {locationExists && (
            <View style={styles.distanceformContainer}>
                <TextInput
                    keyboardType='numeric'
                    style={styles.distanceinput}
                    placeholder='Enter a distance in km'
                    onChangeText={(value) => setDistance(value)}>
                </TextInput>
                <Pressable
					style={!distanceValidity ? [styles.buttons, {backgroundColor: 'grey'}] : [styles.buttons, {backgroundColor: '#70c4a4'}]}
					disabled={!distanceValidity}
                    onPress={async () => {
							  Keyboard.dismiss();
							  let distparsed = Number(distance);
							  if (isNaN(distparsed)) {
								setTekstikentta('Distance not a number');
								return; // irti funktiosta.
							  }
							  if (distparsed < 0.5 || distparsed > 500) {
								setTekstikentta('Distance not within [0.5, 500] km');
								return;
							  }
							  // setReitit([]);
							  // tarkastukset tehty: voi tehdä reitin
							  distparsed = distparsed * 1000; // km -> m
							  
							  setTekstikentta('Searching for routes ...');
							  let tulokset = await kaikkireitit2([userLocation.longitude, userLocation.latitude], distparsed, 6);
			  			      // reitit jotka yli puolet tavoitematkasta, ja alle 1.5x tavoitematka.
							  tulokset = tulokset.filter((t) => {return ((t.matka > distparsed / 2) && t.matka < distparsed * 1.5)});
							  if (tulokset.length < 1) {
								  setTekstikentta('Route search failed');
								  return;
							  } else {
								  setTekstikentta('');
							  }
							  setRoutePoints(teelatlonarray(tulokset[0].pisteet));
							  setReitit(tulokset);
			  			  setIndeksi(0);
							  setDisplayDistance(Math.round(tulokset[0].matka));
							  setDisplayDate(today);
                setRouteExists(true);
			  	          }}>
                    <Text style={styles.buttontext}>Route!</Text>
                </Pressable>
            </View>
          )}
		    <Text style={{fontSize: 15, marginBottom: '5%'}}>{tekstikentta}</Text>
            {drawable ? (
              <View style={{alignItems:'center'}}>
            <MapView style={styles.map} initialRegion={userLocation ? { ...initialRegion, ...userLocation } : initialRegion} rotateEnabled={false} showsUserLocation={true} followsUserLocation={true}>
              <Polyline 
                coordinates={routePoints}
                strokeColor='red'/>
            </MapView>

          {routeExists && (
          <View style={styles.routeInfoContainer}>
          <Text style={[styles.buttontext, {paddingBottom: 5}]}>Current route:</Text>
          <View style={styles.routeInfo}>
            <Text style={styles.routeInfoText}>Length: {displaydistance} m</Text>
            <Text style={styles.routeInfoText}>Date: {displaydate}</Text>
          </View>
        </View>
          ) }
          <View style={styles.buttonContainer}>
              <Pressable 
                  style={[styles.buttons, {backgroundColor: '#70c4a4'}]}
                  onPress={() => {
              console.log(indeksi, reitit.length);
            if (reitit.length < 1) return;
            // siirtää indeksiä ja näyttää uuden reitin.
            let apui = (indeksi + 1);
            if (apui >= reitit.length) {
              apui = 0;
            }
            setRoutePoints(teelatlonarray(reitit[apui].pisteet));
            setIndeksi(apui);
            setDisplayDistance(Math.round(reitit[apui].matka));
            setDisplayDate(today);
          }}>
                      <Text style={styles.buttontext}>Reroute</Text>
              </Pressable>
              <Pressable 
                  style={[styles.buttons, {backgroundColor: '#70c4a4'}]}
                  onPress={() => {
                    console.log('Tähän reitin tallentamisen toiminto!')
                    setShowSaveModal(!showSaveModal)
                  }}>
                     <Text style={styles.buttontext}>Save route</Text>
              </Pressable>
              <Modal transparent={true} visible={showSaveModal}>
                  <View style={styles.modalContainer}>
                    <View style={styles.modalView}>
                      <Text style={{fontSize: 20, textAlign: 'center', marginBottom: 20, padding: 10}}>Save the route?</Text>
                      <View>
                        <Text style={styles.buttontext}>Name of the route:</Text>
            <Text style={{color: 'red'}}>{routeNameError}</Text>
                        <TextInput
                          style={styles.distanceinput}
                          placeholder='e.g. morning walk'
                          onChangeText={(value) => setRouteName(value)}>
                        </TextInput>
                      </View>
                      <View style={styles.buttonContainer}>
                        <Pressable style={[styles.buttons, {backgroundColor: '#70c4a4'}]}
                                onPress={() => {
                                    setShowSaveModal(!showSaveModal)
                                    setRouteName('')
                                    setRouteNameValidity(false)
                                    setRouteNameError(null)
                                }}>
                          <Text style={styles.buttontext}>Back</Text>
                        </Pressable>
                        <Pressable style={!routeNameValidity ? [styles.buttons, {backgroundColor: 'grey'}] : [styles.buttons, {backgroundColor: '#70c4a4'}]}
                                disabled={!routeNameValidity}
                                onPress={() => {
                                    Keyboard.dismiss()
                                    saveRoute()
                                    setRouteName('')
                                    setRouteNameValidity(false)
                                    setRouteNameError(null)
                                    setShowSaveModal(!showSaveModal)
                  }}>
                          <Text style={styles.buttontext}>Save</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
              </Modal>
          </View>
          <Pressable style={[styles.buttons, {backgroundColor: '#3d876a'}]} onPress={() => setShowRouteListModal(!showRouteListModal)}>
            <Text style={[styles.buttontext, {color: 'white'}]}>My routes</Text>
          </Pressable>
          <Modal transparent={true} visible={showRouteListModal}>
            <View style={styles.modalContainer}>
              <View style={styles.modalView}>
                <Text style={{fontSize: 20, textAlign: 'center', marginBottom: 10, padding: 10}}>Saved routes</Text>
                <ScrollView style={styles.routeListContainer}>
                  { routes.map((route, index) => {
                    return (
                      <View style={styles.routeListItem} key={index}>
                        <View style={styles.routeListItemInfo}>
                          <Text style={styles.routeListText}>{route.name}</Text>
                        </View>
                        <View style={styles.routeListButtons}>
                          <Pressable style={styles.openButtons} onPress={() => {
                              setShowRouteListModal(!showRouteListModal)
                              openRoute(route.name)
                          }}>
                            <View>
                              <Text>Open</Text>
                            </View>
                          </Pressable>
                          <Pressable style={{margin: 10}} onPress={() => deleteRoute(route.name)}>
                            <FontAwesome5 name="trash-alt" size={21} color="#f25a5a" />
                          </Pressable>
                        </View>
                      </View>
                    )
                  })}
                </ScrollView>
                <Pressable style={[styles.buttons, {backgroundColor: '#70c4a4'}]} onPress={() => setShowRouteListModal(!showRouteListModal)}>
                  <Text style={styles.buttontext}>Exit</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
          </View>
          ) : (
          <View>
            <Text style={{alignSelf: 'center',marginBottom: 20, marginTop: 20}}>You haven't allowed location data</Text>
            <Text style={styles.buttontext}>Search by address:</Text>
            <View style={styles.buttonContainer}>
              <TextInput
                style={styles.distanceinput}
                onChangeText={(text) => setManualLocation(text)}
                //value={manualLocation}
                placeholder="Example street 234">
              </TextInput>  
              <Pressable style={[styles.buttons, {backgroundColor: '#70c4a4'}]} 
              onPress={() => {
                Keyboard.dismiss()
                getManualLocation()
              }}>
                <Text style={styles.buttontext}>Search</Text>
              </Pressable>
            </View>
          </View>
          )}

          </SafeAreaView>
      </ScrollView>
    )
}
    
// Tyylit
const styles = StyleSheet.create({
  appView: {
    flex: 1,
    backgroundColor: '#c3e8da',
  },
  mapSafeAreaView: {
    alignItems: 'center',
  },
  map: {
    width: 300,
    height: 300,
    borderWidth: 2,
    borderRadius: 10,
    borderColor: '#edf5f5'
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'center'
  },
  buttons: {
    borderRadius: 10,
    padding: 10,
    margin: 10,
  },
  buttontext: {
    textAlign: 'center',
    fontSize: 20,
  },
  distanceformContainer: {
    flexDirection: 'row',
    marginBottom: 0,
    marginTop: '5%'
  },
  distanceinput: {
    //borderWidth: 2,
    //borderColor: '#c2c2c2',
    padding: 10,
    margin: 10,
    borderRadius: 10,
    backgroundColor: 'white',
    fontSize: 20,
  },
  modalContainer: {
    backgroundColor: '#000000aa',
    flex: 1,
    alignItems: 'center',
  },
  modalView: {
    backgroundColor: '#c3e8da',
    //UUSIN margin: 50,
    //UUSIN padding: 10,
    borderRadius: 20,
    alignItems: 'center',
    width: '85%',
    maxHeight: '100%'
  },
  routeListContainer: {
    padding: 5,
    //marginBottom: 20,
  },
  routeListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 5,
    margin: 5,
    borderWidth: 2,
    borderRadius: 10,
    borderColor: '#5b8a70',
    maxWidth: 280,
  },
  routeListText: {
    fontSize: 20,
    margin: 3,
  },
  routeListButtons: {
    flexDirection: 'row',
    //marginLeft: '60%',
    
  },
  openButtons: {
    margin: 5,
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#95c2a9'
  },
  routeInfoContainer: {
    paddingTop: 10,
  },
  routeInfo: {
    paddingTop: 5,
    flexDirection: 'column',
  },
  routeInfoText: {
    fontSize: 16,
    paddingBottom: 5
  }
});
    
export default App