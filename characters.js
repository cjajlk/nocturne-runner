/* Runners cosmétiques : défis et prix vérifiés à nouveau dans la transaction d'achat. */
window.NRCharacters = Object.freeze([
  {id:'k-0',name:'K-0',kind:'Androïde coursier',image:'assets/characters/k-0-concept.png',description:'Un messager autonome échappé des tours de la cité. Armure graphite, cœur violet et regard cyan.',price:6000,requirements:[{key:'best',goal:2500,label:'mètres en une course'}]},
  {id:'vesper',name:'Vesper',kind:'Renarde cybernétique',image:'assets/characters/vesper-concept.png',description:'Une exploratrice bipède des toits néon. Oreilles affûtées, veste technique et queue lumineuse.',price:10000,requirements:[{key:'words',goal:40,label:'mots de la cité complétés'}]},
  {id:'onyx',name:'Onyx',kind:'Panthère d’ombre',image:'assets/characters/onyx-concept.png',description:'Une silhouette féline venue des quartiers oubliés. Circuits cyan et éclats violets dans une tenue noire.',price:18000,requirements:[{key:'best',goal:7500,label:'mètres en une course'},{key:'words',goal:60,label:'mots de la cité complétés'}]}
].map(ch=>Object.freeze({...ch,sheet:'assets/characters/'+ch.id+'-sheet.png',sheetKey:ch.id+'Sheet'})));
window.NRCharacterEligible=(ch,data)=>ch.requirements.every(r=>(r.key==='words'?data.word.completed:data.best)>=r.goal);
