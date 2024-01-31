// TÄSSÄ TIEDOSTOSSA ON KOORDINAATTIPISTE-OPERAATIOITA, JOTKA EI LIITY SELAIMEN KARTTAAN

const earthRadiusMeters = 6371000.0;

/** Muuttaa asteluvun radiaaneiksi */
function rad(deg) {
	return deg*(Math.PI/180);
}

/** Muuttaa radiaaniarvon asteiksi */
function deg(rad) {
	return rad*(180/Math.PI);
}

/**
 * Mittaa maapallon säteen avulla etäisyyden kahden koordinaattipisteen välillä [lon, lat]
 * @param p1 = piste 1
 * @param p2 = piste 2
 * @return {number} etäisyys pisteiden välillä metreinä
*/
export function distm(p1, p2) {
	let p1r = [rad(p1[1]), rad(p1[0])]; // [0] = lat
	let p2r = [rad(p2[1]), rad(p2[0])];
	
	// Koske tähän vain omalla vastuulla, haversine kuten verkossa esitelty
	return (2 * earthRadiusMeters * (Math.asin(Math.sqrt(Math.pow(Math.sin((p2r[0]-p1r[0])/2),2) + (Math.cos(p1r[0]) * Math.cos(p2r[0]) * Math.pow(Math.sin((p2r[1]-p1r[1])/2),2))))));
}

/**
 * Mittaa kaikkien reitin pisteiden järjestyksessä läpi kulkevan linnuntiematkan
 * @param reitti muodossa taulukko [lon, lat]; (esim agora = 25, 62)
 * @return matka metreinä.
 */
export function arrayDistm(taulukkoreitti) {
	tulos = 0;
	for (let i = 1; i < taulukkoreitti.length; i++) {
		tulos += distm(taulukkoreitti[i-1], taulukkoreitti[i]);
	}
	return tulos;
}

/** 
 * Liikkuu annetusta pisteestä tietyn metrimäärän pohjois-etelä -suunnassa ja palauttaa saapumispisteen
 * @param p = lähtöpiste [latitude, longitude] taulukkomuodossa
 * @param m =  pohjois-etelä liikku metreinä. pohjoinen on +
 * @return uusi piste paikassa, johon liikuttiin
*/
function newToNorth(p, m) {
	let x = m/earthRadiusMeters;
	let p2 = [deg(rad(p[0]) + x), p[1]];
	return p2;
}

/** 
 * Liikkuu annetusta pisteestä tietyn metrimäärän itä-länsi -suunnassa ja palauttaa saapumispisteen
 * @param p = lähtöpiste [latitude, longitude] taulukkomuodossa
 * @param m = itä-länsi liikku metreinä. itä on +
 * @return uusi piste paikassa, johon liikuttiin
*/
function newToEast(p, m) {
	let r = Math.cos(rad(p[0]))*earthRadiusMeters;
	let x = m/r;
	let p2 = [p[0], deg(rad(p[1]) + x)];
	return p2;
}

/** 
 * Liikkuu annetusta pisteestä tietyn metrimäärän, ensin itä-länsi -suunnassa, sitten pohjois-etelä -suunnassa ja palauttaa saapumispisteen
 * @param p = lähtöpiste [latitude, longitude] taulukkomuodossa
 * @param n = pohjois-etelä liikku metreinä. pohjoinen on +
 * @param e = itä-länsi liikku metreinä. itä on +
 * @return uusi piste paikassa, johon liikuttiin
*/
export function newToNorthEast(p, n, e) {
	// HUOM: pitkillä etäisyyksillä tai napapisteiden lähellä liikkumisjärjestyksellä (pohjois -> itä vs itä -> pohjois) voi olla merkitystä!
	let p2 = newToEast(p, e);
	return newToNorth(p2, n);
}

/**
 * Kertoo, onko kahden pisteen koordinaatit samat
 * @param p1 = piste 1
 * @param p2 = piste 2
 * @param tolerance = metrimatka, kuinka kaukana pisteet saavat olla toisistaan
 * @return {Boolean} onko samat
 */
export function sameLocation(p1, p2, tolerance) {
	// console.log('sameLocation? pisteet: ', p1, p2, ' (matka ja tolerance): ', distm(p1, p2), tolerance);
	return (distm(p1, p2) <= tolerance);
	// return ((p1[0] === p2[0]) && (p1[1] === p2[1]));
}

// export { funk1, funk2, jne };
// voi tehdä myös näin
