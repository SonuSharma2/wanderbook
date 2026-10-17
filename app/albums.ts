import type { Entry, Photo } from './journal';

export type AlbumPhoto = { entry: Entry; photo: Photo };
export type PlaceAlbum = {
  key: string;
  place: string;
  country: string;
  memories: Entry[];
  photos: AlbumPhoto[];
  latest: string;
};

const normalize = (value: string) => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');

export function groupPlaceAlbums(entries: Entry[]): PlaceAlbum[] {
  const places = new Map<string, PlaceAlbum>();
  for (const entry of [...entries].sort((a, b) => b.date.localeCompare(a.date))) {
    const key = JSON.stringify([normalize(entry.location), normalize(entry.country)]);
    let album = places.get(key);
    if (!album) {
      album = { key, place: entry.location.trim(), country: entry.country.trim(), memories: [], photos: [], latest: entry.date };
      places.set(key, album);
    }
    album.memories.push(entry);
    album.photos.push(...entry.photos.map(photo => ({ entry, photo })));
  }
  return [...places.values()];
}

export const albumImage = ({ entry, photo }: AlbumPhoto) => photo.url || `/api/photos/${entry.id}/${photo.id}`;
