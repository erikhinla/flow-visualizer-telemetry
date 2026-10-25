/* TBTX anchors: one named strip, same order and marker on every page. */
(function(){
var MINI='https://buy.stripe.com/8x29ASfUzdMW0Px7JUc3m08',FACT='https://calendar.app.google/Xu3RZNM4nEuATHee7';
var PROOF_URL='/proof/screen/',OFFERS='/offers/';
var WHAT={
 home:'TransformBy10X sets up a team\'s own folders, files and tools so context stays with the work. PROOF is the first step.',
 proof:'PROOF (Process, Response, Output, Operating capacity, Friction): 15 answers that map where work stalls. Runs 3 of the nine formulas.',
 offers:'Context Keystones: folders, Markdown files, scripts and protocols, built into the tools the team already runs.',
 erik:'Erik H Bush finds where context gets lost between people and tools, and sets up somewhere for it to live.'};
var NINE=[['01','Map score'],['02','Department score'],['03','Missing-context rate'],['04','Repair hours'],['05','Capacity pressure'],['06','Capacity gap'],['07','Backlog'],['08','Context repair cost · hourly'],['09','Context repair cost · annual']];
var INPROOF={'01':1,'08':1,'09':1};
function grid(all){return '<div class="tbx-grid" aria-label="The nine formulas">'+NINE.map(function(f){return '<div class="'+(all||INPROOF[f[0]]?'p':'')+'"><b>'+f[0]+'</b>'+f[1]+'</div>'}).join('')+'</div>'}
function rows(r){return '<div class="tbx-rows">'+r.map(function(x){return '<div><p class="tbx-lab">'+x[0]+'</p><p>'+x[1]+'</p></div>'}).join('')+'</div>'}
var A=[
 {k:'00',t:'Start here',sh:'Start',s:1,h:function(p){return '<h2>What · why · <em>relief</em></h2>'+rows([['What it is',WHAT[p]||WHAT.home],['Why it exists','AI raises output faster than the process can carry context. People end up filling the gap by hand.']])+rows([['What it relieves','Hours spent chasing missing context, rework, and the worry about what got lost between handoffs.'],['What gets installed','Not an AI tool. A foundation inside the folders, files and tools the team already runs, so context stays with the work.']])}},
 {k:'01',t:'Context Gap',sh:'Context Gap',h:function(){return '<h2>The Context <em>Gap</em></h2>'+rows([['Why it matters','AI tools increase output, but context doesn\'t keep up, so humans fill the gap.']])+'<div class="tbx-vis"><div class="tbx-bar" style="width:100%">Output</div><div style="display:flex"><div class="tbx-bar" style="width:45%">Context</div><div class="tbx-bar o" style="width:55%">Gap people fill</div></div></div>'}},
 {k:'02',t:'Role Reversal',h:function(){return '<h2>The Role <em>Reversal</em></h2>'+rows([['Why it matters','AI was meant to assist people. But people are assisting AI.']])+'<div class="tbx-vis"><div class="tbx-bar o">Planned: people → AI assists</div><div class="tbx-bar m">Running: AI → people assist</div></div>'}},
 {k:'03',t:'Digital Friction',h:function(){return '<h2>Digital <em>Friction</em></h2>'+rows([['Why it matters','Lost context stops the work. Rework grows. Handoffs stall. Momentum stops. The process can\'t carry what AI produces.']])+'<div class="tbx-vis"><div class="tbx-bar">Brief</div><div class="tbx-bar m">Context drops here</div><div class="tbx-bar o">Rework · wait · repeat</div></div>'}},
 {k:'04',t:'PROOF',h:function(){return '<h2>PROOF</h2>'+rows([['What it is','Process, Response, Output, Operating capacity, Friction. 15 answers, no email.'],['What it does','Maps where work stalls on the route and runs 3 of the nine formulas.']])+'<div class="tbx-vis"><div class="tbx-bar m">P · Process</div><div class="tbx-bar">R · Response</div><div class="tbx-bar">O · Output</div><div class="tbx-bar">O · Operating capacity</div><div class="tbx-bar m">F · Friction</div></div><div class="tbx-links tbx-wide"><a class="m" href="'+PROOF_URL+'">Start with PROOF</a></div>'}},
 {k:'05',t:'Nine formulas',sh:'9 formulas',h:function(){return '<h2>The nine <em>formulas</em></h2>'+rows([['What they do','Count where handoffs lose context, how many hours repairs take, and what that time costs.'],['Who runs them','PROOF runs 3 of 9 (magenta). FACT runs 9 of 9 on real handoffs.']])+grid()}},
 {k:'06',t:'FACT',h:function(){return '<h2>FACT</h2>'+rows([['What it is','Friction Audit Context Telemetry. Reads real handoffs and runs all nine formulas.'],['What it delivers','The FACT report: where delivery stalls, what it costs, and what to change first.']])+grid(1)+'<div class="tbx-links tbx-wide"><a class="m" href="'+MINI+'">Remote mini FACT</a><a href="'+FACT+'">Book a FACT call</a></div>'}},
 {k:'07',t:'Context Keystones',sh:'Keystones',h:function(){return '<h2>Context <em>Keystones</em></h2>'+rows([['What it is','Folders, Markdown files, Scripts, Protocols, built into the tools the team already runs.'],['Why it matters','The agency\'s own tools keep the context, so nobody rebuilds it by hand.']])+'<div class="tbx-vis"><div class="tbx-bar">01 Folders</div><div class="tbx-bar">02 Markdown</div><div class="tbx-bar">03 Scripts</div><div class="tbx-bar m">04 Protocols</div></div><div class="tbx-links tbx-wide"><a class="m" href="'+OFFERS+'">See Context Keystones</a></div>'}},
 {k:'08',t:'Offer ladder',sh:'Ladder',h:function(){return '<h2>The offer <em>ladder</em></h2><div class="tbx-steps tbx-wide"><a href="'+PROOF_URL+'"><b>PROOF</b>Maps where work stalls. 3 of 9 formulas.<span class="pr">15 answers</span></a><a href="'+OFFERS+'#price"><b>Context Keystones</b>Builds the fix from the 15 answers.<span class="pr">After PROOF</span></a><a href="'+MINI+'"><b>Remote mini FACT</b>Reads real handoffs, remotely. 9 of 9 formulas.<span class="pr">$1,750</span></a><a href="'+FACT+'"><b>FACT</b>On site. Ends with the FACT report. 9 of 9.<span class="pr">$4,500 + travel</span></a></div>'}}
];
function css(src){if(document.querySelector('link[data-tbx]'))return;var l=document.createElement('link');l.rel='stylesheet';l.href=src;l.dataset.tbx=1;document.head.appendChild(l)}
function init(){
 var navs=document.querySelectorAll('.tbx-anchors:not([data-on])');if(!navs.length)return;
 var sheet=document.querySelector('.tbx-sheet');
 if(!sheet){sheet=document.createElement('div');sheet.className='tbx-sheet';sheet.hidden=true;sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.innerHTML='<div class="tbx-card"><header><span><i></i><span class="tbx-h"></span></span><button type="button" aria-label="Close">Close ✕</button></header><div class="tbx-body"></div></div>';document.body.appendChild(sheet);
  var close=function(){sheet.hidden=true};sheet.querySelector('header button').onclick=close;sheet.addEventListener('click',function(e){if(e.target===sheet)close()});document.addEventListener('keydown',function(e){if(e.key==='Escape')close()});}
 navs.forEach(function(nav){nav.dataset.on=1;var page=nav.dataset.page||'home';nav.setAttribute('aria-label','Anchors');
  nav.innerHTML=A.map(function(a){return '<button type="button" data-k="'+a.k+'" class="'+(a.s?'s':'')+'" title="'+a.t+'"><i></i><span class="n">'+a.k+'</span><span class="t">'+(a.sh||a.t)+'</span></button>'}).join('');
  nav.querySelectorAll('button').forEach(function(b){b.onclick=function(){var a=A.filter(function(x){return x.k===b.dataset.k})[0];sheet.querySelector('.tbx-h').textContent=a.k+' // '+a.t;sheet.querySelector('.tbx-body').innerHTML=a.h(page);sheet.hidden=false;sheet.querySelector('header button').focus()}});
 });
}
window.tbxAnchors={init:init,open:function(k){var b=document.querySelector('.tbx-anchors button[data-k="'+k+'"]');b&&b.click()}};
if(document.readyState!=='loading')init();else document.addEventListener('DOMContentLoaded',init);
setInterval(init,800);
})();
