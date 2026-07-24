
const task=document.getElementById('task');
CONFIG.tasks.forEach(t=>{
 let o=document.createElement('option');
 o.text=o.value=t;
 task.appendChild(o);
});
const phaseDiv=document.getElementById('phases');

function render(){
 phaseDiv.innerHTML='';
 CONFIG.phases.forEach((p,i)=>{
   const d=document.createElement('div');
   d.className='phase';
   d.innerHTML=`<h3>${p.name} (${p.weight}%)</h3>
   AI:
   <select id='ai${i}'>
   ${CONFIG.aiLevels.map((a,j)=>`<option value='${j}'>${a}</option>`).join('')}
   </select>
   Human Rework:
   <select id='rw${i}'>
   ${CONFIG.rework.map((r,j)=>`<option value='${j}'>${r}</option>`).join('')}
   </select>`;
   phaseDiv.appendChild(d);
 });
}
render();

function calculate(){
 let total=0;
 CONFIG.phases.forEach((p,i)=>{
   const ai=parseInt(document.getElementById('ai'+i).value);
   const rw=parseInt(document.getElementById('rw'+i).value);
   const aiFactor=ai/4;
   const rwFactor=[1,.8,.6,.3,0][rw];
   total+=p.weight*aiFactor*rwFactor;
 });
 document.getElementById('result').innerHTML=
 `<h2>AI Contribution Score: ${total.toFixed(1)}%</h2>
 <p><b>Task:</b> ${task.value}</p>
 <p>This is an initial scoring model and intended for discussion and refinement.</p>`;
}
