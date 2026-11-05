// صفحة: links
async function pLinks(){A.innerHTML=`<div class=pg><h2 class=rv>${t('active')}</h2><div id=ll style="margin-top:1rem"><div class=ld style="margin:3rem auto"></div></div></div>`;const r=await api('myLinks');if(r.err)return;
 $('#ll').innerHTML=(r.ls||[]).map((l,i)=>{const u=vurl(l.k),m=Math.round((l.exp-Date.now())/60000);return `<div class="gl lk rv" style="--i:${Math.min(i,8)}"><div><b>${esc(l.dev)}${l.label||l.client?' · '+esc(l.label||l.client):''}</b><br><small>${isA()?esc(l.by)+' · ':''}${l.type=='new'?t('newS'):t('curS')} · ${l.visits} ${t('vis')}${m<1440?' · '+m+' '+t('mins'):''}</small></div><div class=ra><button onclick="navigator.clipboard.writeText('${u}');this.textContent=t('copied')">${t('copy')}</button><button class=d onclick="rv('${l.k}')">${t('revoke')}</button></div></div>`}).join('')||`<p class=mu>${t('none')}</p>`}
async function rv(k){if(!confirm(t('sure')))return;await api('revoke',{k});pLinks()}
bootPage(pLinks,'links');
