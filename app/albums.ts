import type { Entry, Photo } from './journal';
import { assetUrl } from './assets';

export type AlbumPhoto = { entry: Entry; photo: Photo };
export type AlbumFolder = { place: string; country: string };
export type PlaceAlbum = {
  key: string;
  place: string;
  country: string;
  memories: Entry[];
  photos: AlbumPhoto[];
  latest: string;
};

const normalize = (value: string) => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');
export const albumKeyFor = (place: string, country: string) => JSON.stringify([normalize(place), normalize(country)]);

export function mergeAlbumFolders(...lists: AlbumFolder[][]): AlbumFolder[] {
  const folders = new Map<string, AlbumFolder>();
  for (const folder of lists.flat()) {
    if (!folder || typeof folder.place !== 'string' || typeof folder.country !== 'string' || !folder.place.trim() || folder.place.length > 150 || folder.country.length > 80) throw Error('Choose a valid album name and country.');
    folders.set(albumKeyFor(folder.place, folder.country), {place: folder.place.trim(), country: folder.country.trim()});
  }
  if (folders.size > 500) throw Error('You can keep up to 500 albums.');
  return [...folders.values()];
}

export function groupPlaceAlbums(entries: Entry[], folders: AlbumFolder[] = []): PlaceAlbum[] {
  const places = new Map<string, PlaceAlbum>();
  for (const entry of [...entries].sort((a, b) => b.date.localeCompare(a.date))) {
    const key = albumKeyFor(entry.location, entry.country);
    let album = places.get(key);
    if (!album) {
      album = { key, place: entry.location.trim(), country: entry.country.trim(), memories: [], photos: [], latest: entry.date };
      places.set(key, album);
    }
    album.memories.push(entry);
    album.photos.push(...entry.photos.map(photo => ({ entry, photo })));
  }
  for (const folder of folders) {
    const key = albumKeyFor(folder.place, folder.country);
    if (places.has(key) || (!folder.country && [...places.values()].some(album => normalize(album.place) === normalize(folder.place)))) continue;
    places.set(key, {key, place: folder.place, country: folder.country, memories: [], photos: [], latest: ''});
  }
  return [...places.values()];
}

export const albumImage = ({ entry, photo }: AlbumPhoto) => photo.url?assetUrl(photo.url):`/api/photos/${entry.id}/${photo.id}`;
