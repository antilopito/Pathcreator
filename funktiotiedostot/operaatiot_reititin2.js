import { distm, newToNorthEast, sameLocation, arrayDistm } from './operaatiot_koordinaattipisteet2.js';

// HUOMAA: LAT = 62, LON = 25, mutta reittikone ottaa järjestyksessä 
// LON, LAT! ELI [25.7369, 62.2322] (agora)


// TESTIFUNKTIOT ---------------------------------------------

/**
 * Testien lähtöpiste, async jo nyt varalta, jos tarvitsee
 * HUOM! EI anna true tai false -arvoa testien onnistumisista.
*/
export async function reittiTestEntryPT() {
	console.log('testit');
	let r0 = await reitita2([25.7369, 62.2322], newToNorthEast([25.7369, 62.2322], 2222, 0));
	let p2 = newToNorthEast(r0.geometry.coordinates[r0.geometry.coordinates.length - 1], -1111, -1111);
	let r1 = await reitita2(r0.geometry.coordinates[r0.geometry.coordinates.length - 1], p2);
	
	trimmaus5(r0, r1);
	
	let tulos = [];
	for (p of r0.geometry.coordinates) {
		tulos.push(p);
	}
	for (p of r1.geometry.coordinates) {
		tulos.push(p);
	}
	testSuunnanmuutos();
	return tulos;
}

/* käy läpi ilmansuuntien muuttumisen vasta ja myötäpäivään */
function testSuunnanmuutos() {
	// looppaa suuntaa, testaa myötä ja vastapäivän:
	let suunta = [0, 1];
	console.log('nyk: ', suunta);
	console.log('vasta');
	for (let i = 0; i < 8; i++) {
		muutaSuuntaa(suunta, false);
		console.log('uusi: ', suunta);
	}
	// pitäisi tulla käänteisessä järjestyksessä samat suunnat
	console.log('nyk: ', suunta);
	console.log('myötä');
	for (let i = 0; i < 8; i++) {
		muutaSuuntaa(suunta, true);
		console.log('uusi: ', suunta);
	}
}

// TAVALLISET FUNKTIOT ----------------------------------------

// käy läpi kaikki ilmansuunnat sekä myötä että vastapäivään, ottaa reitit talteen yms
export async function kaikkiReitit(p0, tavoitematka) {
	let harppauslkm = 6; // oletuslkm, määrittää tavoiteharppausten pituuden
	reitit = [];
	s0 = [0,1];
	for (let i = 0; i < 4; i++) {
		// myötä ja vastapäivät.
		let rmp = await yksiReitti(p0, tavoitematka, s0, true, harppauslkm);
		let rvp = await yksiReitti(p0, tavoitematka, s0, false, harppauslkm);
		reitit.push(rmp, rvp);
		
		// muuta alkusuuntaa
		muutaSuuntaa(s0, true);
	}
	return reitit;
}

export async function kaikkireitit2(p0, tavoitematka, harppauksia) {
	let tulokset = [];
	s0 = [0,1];
	for (let i = 0; i < 4; i++) {
		// myötä ja vastapäivät.
		let rmp = await yksiReitti(p0, tavoitematka, s0, true, harppauksia);
		let rvp = await yksiReitti(p0, tavoitematka, s0, false, harppauksia);
		tulokset.push(rmp, rvp);
		// muuta alkusuuntaa
		muutaSuuntaa(s0, true);
	}
	// järjestää tulokset apufunktiolla joka vertaa niiden koko matkoja.
	tulokset.sort((a,b) => {
		return (Math.abs(tavoitematka - a.matka) - Math.abs(tavoitematka - b.matka));
	});
	for (let tulos of tulokset) {
		console.log(tulos.matka);
	}
	return tulokset;
}

/**
 * Tekee yhden kierrosreitin
 * @param p0 = lähtöpiste
 * @param tavoitematka = matka metreissä, joka halutaan kulkea
 * @param s0 = [pohjoinen, etelä] kertoimet, jotka vastaa lähtösuuntaa
 * @param { Boolean } myötäpäivä = meneeks myötäpäivään
 * @param harppauksia = kuinka monta suunnanvaihtoa halutaan
*/
export async function yksiReitti(p0, tavoitematka, s0, myotapaiva, harppauksia) {
	console.log('YKSI REITTI: ' +  p0 + ' ' + tavoitematka + ' ' + s0 + ' ' + myotapaiva + ' ' + harppauksia);
	let alkupiste = [p0[0], p0[1]]; // talteen, p0 muuttuu funktion sisällä.
	let harppaukset = [];
	let suunta = [s0[0], s0[1]]; // kopio suunnasta, jota voi muokata
	let matkaa = tavoitematka * 1.1;

	tulos = {
		matka: 0,
		pisteet: []
	};
	
	while (harppauksia > 0 && matkaa > 0) {
		// console.log('harppaus: tavoite + harppauksia jaljella: ', matkaa, harppauksia);
		let harppaus = await rekursSiirtyma(p0, suunta[0], suunta[1], matkaa / harppauksia);
		// console.log(harppaus.distance);
		harppauksia -= 1;
		if (harppaus.distance > 1) {
			// > 1 -> harppauksessa liikutaan, se ei ole pisteestä A pisteeseen A.
			p0 = harppaus.geometry.coordinates[harppaus.geometry.coordinates.length - 1];
			muutaSuuntaa(suunta, myotapaiva);
			harppaukset.push(harppaus);
			if (harppaukset.length > 1) { // 2 tai enemmän harppausta, joita voi trimmata
				// console.log('trimmataan: adist, bdist: ', harppaukset[harppaukset.length - 2].distance, harppaukset[harppaukset.length - 1].distance);
				let trimmausolio = trimmaus5(harppaukset[harppaukset.length - 2], harppaukset[harppaukset.length - 1]); // trim(tokavika, vika);
				// console.log(trimmausolio.matka, harppaukset[harppaukset.length - 2].distance, harppaukset[harppaukset.length - 1].distance);
				matkaa += trimmausolio.matka; // trimmattu matka takaisin tavoitematkaan.
			}
			// trimmaukset tehty, voi tehdä matkan muokkaukset:
			matkaa -= harppaus.distance;
		}
	}
	
	// etsitään paluureitti:
	console.log('reitin teon lopetus, harppauksia:', harppaukset.length);
	if (harppaukset[0] === undefined) return tulos; // reitti tähän suuntaan epäonnistui.
	let paluuharppaus = harppaukset[0];
	
	for (let i = 0; i < harppaukset.length; i++) {
		let h = harppaukset[i].geometry.coordinates;
		let loppupiste = h[h.length - 1];
		let paluumahd = await reitita2(loppupiste, alkupiste);
		if (tulos.matka + paluumahd.distance + harppaukset[i].distance > tavoitematka * 1.1) {
			// maksimimatka ylittyy, niin loop rikki ja käytetään edellistä vaihtoehtoa.
			console.log('matkaraja ylittyy: raja:',tavoitematka * 1.1,'todel: edelliset harppaukset + paluu + vika harppaus', tulos.matka, paluumahd.distance, harppaukset[i].distance);
			break;
		}
		tulos.matka += harppaukset[i].distance;
		for (let piste of h) {
			tulos.pisteet.push(piste);
		}
		paluuharppaus = paluumahd;
	}
	tulos.matka += paluuharppaus.distance;
	for (let piste of paluuharppaus.geometry.coordinates) {
		tulos.pisteet.push(piste);
	}
	console.log('reitti tehty: matkaa mittarissa yht:', tulos.matka);
	
	let todellinenmatka = 0;
	for (let i = 1; i < tulos.pisteet.length; i++) {
		todellinenmatka += distm(tulos.pisteet[i-1], tulos.pisteet[i]);
	}
	console.log('todellinen kokomatka:', todellinenmatka);
	tulos.matka = todellinenmatka;
	
	return tulos;
}

async function rekursSiirtyma(p0, northMultiplier, eastMultiplier, tavoitematka) {
	// console.log('yritetään reittiä');
	let ptavoite = newToNorthEast(p0, northMultiplier*tavoitematka, eastMultiplier*tavoitematka);
	let reitti = await(reitita2(p0, ptavoite));
	// console.log(reitti.distance, tavoitematka * 1.5);
	if (reitti.distance <= tavoitematka * 1.4) {
		return reitti
	}
	// jos edellinen reitti on liian pitkä, puolitetaan tavoitematka.
	return await rekursSiirtyma(p0, northMultiplier, eastMultiplier, tavoitematka/2);
}

/**
 * Vaihtaa suuntakertoimen seuraavaan ilmansuuntaan
 * HUOM. EI tee kopiota arraysta, vaan muokkaa sitä!
 * @param edelsuunta = alkusuunta, [north, east] modifierit
 * @param {Boolean} myotapaiva = kiertosuunta myötä/vasta.
*/
function muutaSuuntaa(edelsuunta, myotapaiva) {
	let apu = 0 + edelsuunta[0];
	edelsuunta[0] = 0 - edelsuunta[1];
	edelsuunta[1] = 0 + apu;
	if (!myotapaiva) {
		edelsuunta[0] = edelsuunta[0]*-1;
		edelsuunta[1] = edelsuunta[1]*-1;
	}
}

/**
 * Poistaa reitin a lopusta ja reitin b alusta päällekäisyyttä.
 * @param a = reitti a
 * @param b = reitti b
 * @return poistettu-olio {matka: poistettu, pisteet: poistetut};
 */
function trimmaus5(a,b) {
	let alist = a.geometry.coordinates;
	let blist = b.geometry.coordinates;
	let poistetut = {
		matka: a.distance + b.distance,
		pisteet: []
	};
	blist.splice(0,1); // blist eka alkio pois.
	
	while (alist.length > 1 && blist.length > 1) { // blist ja alist sisältävät tarpeeksi pisteitä että voi tehdä tarkastukset.
		while (alist.length > 1 && distm(alist[alist.length - 2], alist[alist.length - 1]) <= distm(alist[alist.length - 1], blist[0]) && distm(alist[alist.length - 2], blist[0]) <= distm(alist[alist.length - 1], blist[0])) {
			// jos a -> b välillä ylimääräisiä pisteitä niin poistetaan turha päätepiste.
			// console.log('ehto 1 toteutui');
			
			poistetut.pisteet.push(alist[alist.length - 1]);
			alist.splice(alist.length - 1);
		}
		if (alist.length > 1 && blist.length > 1 && distm(blist[0], alist[alist.length - 1]) <= distm(alist[alist.length - 1], alist[alist.length - 2]) && distm(blist[0], alist[alist.length - 2]) <= distm(alist[alist.length - 1], alist[alist.length - 2])) {
			// blist[0] matka molempiin alist pisteisiin vähemmän kuin niiden koko etäisyys, niin blist[0] on niiden välillä.
			// poistetaan blist[0] ja alist[vika]
			// console.log('ehto 2 toteutui!');
			
			poistetut.pisteet.push(blist[0]);
			poistetut.pisteet.push(alist[alist.length - 1]);
			blist.splice(0,1);
			alist.splice(alist.length - 1);
		} else {
			// ei poisteta reitin keskeltä.
			break;
		}
	}
	// etäisyys-uudelleenmittaus: mittaa linnuntien kaikkien reitin pisteiden väleiltä, laskee yhteen uudeksi distm-arvoksi.
	a.distance = 0;
	b.distance = 0;
	for (let i = 1; i < alist.length; i++) {
		a.distance += distm(alist[i - 1], alist[i]);
	}
	for (let i = 1; i < blist.length; i++) {
		b.distance += distm(blist[i - 1], blist[i]);
	}
	b.distance += distm(alist[alist.length - 1], blist[0]);
	poistetut.matka -= a.distance;
	poistetut.matka -= b.distance;
	return poistetut;
}

/** 
 * Tekee reitin kahden pisteen välillä
 * @param p1 = piste, mistä.
 * @param p2 = piste, mihin.
 */
export async function reitita2(p1, p2) {
	// console.log('reittikysely: ', p1, p2);
	let result = await kysyReittikoneelta(p1,p2);
	return result.routes[0];
}

async function kysyReittikoneelta(p1,p2) {
	let val = await fetch(`https://routing.openstreetmap.de/routed-foot/route/v1/foot/${p1[0]},${p1[1]};${p2[0]},${p2[1]}?geometries=geojson`);
	return val.json();
}

// yhdistää harppaukset (route-oliot) arraystä
export function teelatlonarray(pisteet) {
	let latlonarray = [];
	for (p of pisteet) {
		let latlon = {
			latitude: p[1],
			longitude: p[0]
		};
		latlonarray.push(latlon);
	}
	return latlonarray;
}
