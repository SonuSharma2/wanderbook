// The Pages build runs below /wanderbook/; the cloud build runs at /.
export function assetUrl(path:string){
 if(!path.startsWith('/')||path.startsWith('//'))return path;
 const base=(import.meta as ImportMeta & {env?:{BASE_URL?:string}}).env?.BASE_URL||'/';
 return `${base}${path.slice(1)}`;
}
