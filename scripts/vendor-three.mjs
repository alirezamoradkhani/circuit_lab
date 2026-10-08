import {mkdir,copyFile,readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),out=new URL('vendor/three/',root);
await mkdir(out,{recursive:true});
for(const file of ['three.module.js','three.core.js'])await copyFile(new URL('node_modules/three/build/'+file,root),new URL(file,out));
await copyFile(new URL('node_modules/three/LICENSE',root),new URL('LICENSE',out));
const pkg=JSON.parse(await readFile(new URL('node_modules/three/package.json',root),'utf8'));
await writeFile(new URL('README.md',out),'# Three.js\n\nVersion '+pkg.version+'. MIT license; see LICENSE.\nVendored for static, offline-capable hosting. Regenerate with npm run vendor.\n');
console.log('Vendored Three.js '+pkg.version);
