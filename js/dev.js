// صفحة: dev
async function pDev(id){await ens();let d=getDev(id);if(!d){inv();await ens();d=getDev(id)}if(!d)return go('devs');A.innerHTML=devView(d,can('edit'),1);fill();auto3D();initTabs()}
bootPage(pDev,'dev');
