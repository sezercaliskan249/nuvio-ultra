// Kartları Nuvio'daki gibi yazdırır: node show.js <eklenti> <tmdb> <movie|tv> [s e]
const [p,id,type,s,e]=process.argv.slice(2);
require('./providers/'+p+'.js').getStreams(id,type,s?+s:null,e?+e:null).then(r=>{
 console.log('\n== '+r.length+' sonuç');
 r.forEach(x=>{console.log('┌ '+x.name.replace(/[\u200B-\u200D\u2060]/g,''));console.log((x.quality||'').split('\n').map(l=>'│ '+l).join('\n'))});
});
