(function(){
  function selectTab(id){
    const tabs=document.querySelectorAll('.tab');
    const views=document.querySelectorAll('.view');
    tabs.forEach(t=>t.classList.remove('active'));
    views.forEach(v=>v.classList.remove('active'));
    document.getElementById('tab-'+id).classList.add('active');
    document.getElementById('view-'+id).classList.add('active');
  }
  window.selectTab=selectTab;
  document.getElementById('tab-settings').addEventListener('click',()=>selectTab('settings'));
  document.getElementById('tab-x01').addEventListener('click',()=>selectTab('x01'));
  document.getElementById('tab-output').addEventListener('click',()=>{selectTab('output'); if (window.updateLive) window.updateLive();});
  document.getElementById('tab-tournament').addEventListener('click',()=>selectTab('tournament'));
})();

