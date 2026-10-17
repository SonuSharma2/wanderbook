import assert from 'node:assert/strict';
import { groupPlaceAlbums, albumImage } from '../app/albums.ts';

const entries = [
  { id:'old',location:' Kathmandu ',country:'Nepal',date:'2024-01-10',photos:[{id:'a',caption:'Old visit'}] },
  { id:'new',location:'kathmandu',country:' NEPAL ',date:'2026-10-17',photos:[{id:'b',caption:'New visit'},{id:'c',caption:'Second photograph'}] },
  { id:'elsewhere',location:'Kathmandu',country:'Another country',date:'2025-01-10',photos:[{id:'d',url:'/photo.jpg',caption:''}] },
  { id:'no-photos',location:'Peaceful   Trail',country:'Nepal',date:'2026-01-10',photos:[] },
  { id:'spaces',location:'peaceful trail',country:'nepal',date:'2026-01-11',photos:[] },
];
const before=JSON.stringify(entries);
const albums=groupPlaceAlbums(entries);
assert.equal(albums.length,3,'same place and country share an album regardless of case and spacing');
assert.equal(albums[0].photos.length,3,'all visits contribute their photos');
assert.deepEqual(albums[0].photos.map(p=>p.photo.id),['b','c','a'],'newest visits first, preserving each memory’s photo order');
assert.equal(albums[0].memories.length,2);
assert.equal(albums.find(a=>a.country==='Another country').photos.length,1,'matching place names in different countries remain separate');
assert.equal(albums.find(a=>a.place==='peaceful trail').photos.length,0,'places without photos remain usable empty albums');
assert.equal(albumImage(albums[0].photos[0]),'/api/photos/new/b','private photos keep both their original entry and photo IDs');
assert.equal(albumImage(albums.find(a=>a.country==='Another country').photos[0]),'/photo.jpg','sample photos retain their display URL');
assert.equal(JSON.stringify(entries),before,'building albums never mutates saved journal records');
assert.deepEqual(groupPlaceAlbums([]),[],'new journals have an empty album shelf');
console.log('PASS: grouping across visits, country separation, photo ordering, private image routes, empty albums, immutable source data.');
