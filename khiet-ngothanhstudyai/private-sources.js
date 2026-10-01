(()=>{'use strict';
const files=new Map(),esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.sourceReference=([id,start,end])=>{
  const source=window.ACADEMY_DATA.sources[id],label=`${source.title} · trang PDF ${start}${end===start?'':'–'+end}`;
  const pdf=files.get(id);
  return pdf?`<a data-private-source="${esc(id)}" data-page="${start}" href="${esc(pdf.url)}#page=${start}" target="_blank" rel="noopener">${esc(label)} ↗</a>`:
    `<a data-pick-source="${esc(id)}" data-page="${start}" href="#sources">${esc(label)} · Chọn PDF của bạn</a>`;
};
window.privateSourceControl=id=>{
  const pdf=files.get(id);
  return `<button data-pick-source="${esc(id)}">${pdf?'Chọn lại PDF':'Chọn PDF trên thiết bị'}</button><span class="source-file-name" data-source-name="${esc(id)}">${pdf?esc(pdf.name):'Chưa chọn tệp'}</span>`;
};
let chosenId=null,chosenPage=1;
const picker=document.createElement('input');picker.type='file';picker.accept='.pdf,application/pdf';picker.hidden=true;document.body.appendChild(picker);
document.addEventListener('click',e=>{
  const link=e.target.closest('[data-pick-source]');if(!link)return;e.preventDefault();
  chosenId=link.dataset.pickSource;chosenPage=Number(link.dataset.page)||1;picker.click();
});
picker.onchange=()=>{
  const file=picker.files[0],id=chosenId;if(!file||!id)return;
  if(!/\.pdf$/i.test(file.name)){alert('Hãy chọn tệp PDF.');picker.value='';return;}
  const previous=files.get(id);if(previous)URL.revokeObjectURL(previous.url);
  files.set(id,{name:file.name,url:URL.createObjectURL(file)});
  document.querySelectorAll('[data-source-name]').forEach(el=>{if(el.dataset.sourceName===id)el.textContent=file.name;});
  document.querySelectorAll('[data-pick-source],[data-private-source]').forEach(el=>{
    if((el.dataset.pickSource||el.dataset.privateSource)!==id)return;
    if(el.tagName==='BUTTON'){el.textContent='Chọn lại PDF';return;}
    const page=Number(el.dataset.page)||1;
    el.href=files.get(id).url+'#page='+page;el.target='_blank';el.rel='noopener';el.dataset.privateSource=id;delete el.dataset.pickSource;
    el.textContent=el.textContent.replace(' · Chọn PDF của bạn','')+' ↗';
  });
  document.querySelector('#source-local-message')?.scrollIntoView({block:'nearest'});
  picker.value='';
};
window.addEventListener('beforeunload',()=>{for(const file of files.values())URL.revokeObjectURL(file.url);});
})();
