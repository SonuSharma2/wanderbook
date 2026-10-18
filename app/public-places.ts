// Public destination coordinates, never extracted from private entries or photo GPS.
// Panch Pokhari lakes, Sindhupalchowk (not the rural municipality centre):
// https://en.wikipedia.org/wiki/Panch_Pokhari
const panchpokhari={lat:28.042,lng:85.716};

export function publicPlaceLocation(place:string,country:string){
 const name=place.trim().toLowerCase().replace(/[\s-]+/g,'');
 return name==='panchpokhari'&&(!country.trim()||country.trim().toLowerCase()==='nepal')?panchpokhari:null;
}

export function publicPlaceMapUrl(place:string,country:string){
 const location=publicPlaceLocation(place,country);
 return location?`https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}#map=14/${location.lat}/${location.lng}`:'https://www.openstreetmap.org/search?query='+encodeURIComponent([place,country].filter(Boolean).join(', '));
}
