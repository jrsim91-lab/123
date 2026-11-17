const STORAGE_KEY = "qms-change-manager-demo-v1";

const seed = [
  {id:1,no:"CC-2026-001",title:"원자재 공급업체 변경",type:"공급업체",grade:"중요",requester:"홍길동",date:"2026-11-03",status:"실행 중",reason:"공급 안정성 및 품질 일관성 개선",before:"공급업체 A",after:"공급업체 B",product:"복합레진",department:"구매, 품질, 생산",impact:[{item:"제품 품질",result:"영향 있음",reason:"원자재 물성 비교 필요"},{item:"위험관리",result:"추가 검토 필요",reason:"위험분석 업데이트 검토"}],tasks:[{name:"신규 공급업체 평가",assignee:"구매",due:"2026-11-20",done:true},{name:"원자재 비교시험",assignee:"품질",due:"2026-11-24",done:false}],reviews:[{name:"품질책임자",date:"2026-11-05",decision:"승인",opinion:"비교시험 조건을 포함하여 진행"}],verification:"",closed:false},
  {id:2,no:"CC-2026-002",title:"완제품 검사기준 개정",type:"시험검사",grade:"일반",requester:"김철수",date:"2026-11-07",status:"영향평가 중",reason:"검사방법 명확화",before:"기존 검사기준서 Rev.02",after:"개정 검사기준서 Rev.03",product:"임시수복재",department:"품질",impact:[],tasks:[],reviews:[],verification:"",closed:false},
  {id:3,no:"CC-2026-003",title:"작업표준서 개정",type:"문서",grade:"일반",requester:"이영희",date:"2026-11-10",status:"종료",reason:"작업 순서 및 주의사항 명확화",before:"기존 작업표준서",after:"개정 작업표준서",product:"본딩제",department:"생산, 품질",impact:[{item:"문서관리",result:"영향 있음",reason:"작업표준서 개정 필요"}],tasks:[{name:"작업표준서 개정",assignee:"품질",due:"2026-11-12",done:true}],reviews:[{name:"품질책임자",date:"2026-11-11",decision:"승인",opinion:"승인"}],verification:"개정 문서 적용 확인 완료",closed:true}
];

let changes = load();
let currentView = "dashboard";
let selectedId = null;

function load(){ try { const x=localStorage.getItem(STORAGE_KEY); return x?JSON.parse(x):seed; } catch(e){return seed;} }
function save(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(changes)); }
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function statusClass(s){if(["종료","승인"].includes(s))return "green";if(["실행 중","검증 중"].includes(s))return "blue";if(["반려","취소"].includes(s))return "red";return "amber";}
function badge(s){return `<span class="badge ${statusClass(s)}">${esc(s)}</span>`;}
function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2400);}
function setView(v){currentView=v;selectedId=null;document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===v));render();}
function pageTitle(v){return ({dashboard:"대시보드",register:"변경 신청 등록",changes:"변경관리 목록",impact:"영향평가 관리",execution:"실행 및 검증",closure:"변경 종료 관리",reports:"통계 및 보고서"})[v]||"변경관리";}
function render(){document.getElementById("page-title").textContent=pageTitle(currentView);const root=document.getElementById("view");({dashboard:renderDashboard,register:renderRegister,changes:renderChanges,impact:()=>renderFiltered("impact"),execution:()=>renderFiltered("execution"),closure:()=>renderFiltered("closure"),reports:renderReports}[currentView]||renderDashboard)(root);}
function renderDashboard(root){
 const total=changes.length,active=changes.filter(c=>!["종료","반려","취소"].includes(c.status)).length,closed=changes.filter(c=>c.status==="종료").length,review=changes.filter(c=>["접수","영향평가 중","검토 중","보완 요청"].includes(c.status)).length;
 const counts=["접수","영향평가 중","검토 중","실행 중","검증 중","종료"].map(s=>({s,n:changes.filter(c=>c.status===s).length}));
 root.innerHTML=`<div class="grid stats">
 ${stat("전체 변경 건수",total,"등록된 누적 변경 건")}${stat("진행 중",active,"종료·반려·취소 제외")}${stat("검토 및 평가 대기",review,"확인 필요한 변경 건")}${stat("종료 완료",closed,"종료 기록 보유 건")}
 </div><div class="grid two-col">
 <div class="card"><div class="section-head"><div><h2>변경 진행 현황</h2><p>현재 등록된 변경 건의 단계별 분포</p></div></div><div class="status-list">${counts.map(x=>`<div class="status-row"><span>${x.s}</span><div class="bar"><span style="width:${total?x.n/total*100:0}%"></span></div><strong>${x.n}</strong></div>`).join("")}</div></div>
 <div class="card"><div class="section-head"><div><h2>업무 확인 사항</h2><p>담당자가 확인할 주요 항목</p></div></div>
 ${notice("영향평가 미완료",changes.filter(c=>c.status==="영향평가 중").length+"건")}
 ${notice("변경 실행 중",changes.filter(c=>c.status==="실행 중").length+"건")}
 ${notice("검증 대기",changes.filter(c=>c.status==="검증 중").length+"건")}
 ${notice("종료 완료",closed+"건")}
 <p class="help">시제품에서는 알림이 실제 이메일이나 메신저로 발송되지 않습니다.</p></div></div>
 <div class="section-head"><div><h2>최근 변경관리</h2><p>최근 등록된 변경 건</p></div><button class="secondary-btn" onclick="setView('changes')">전체 목록 보기</button></div>${table(changes.slice().sort((a,b)=>b.id-a.id).slice(0,5))}`;
}
function stat(label,value,note){return `<div class="card"><div class="stat-label">${label}</div><div class="stat-value">${value}</div><div class="stat-note">${note}</div></div>`;}
function notice(a,b){return `<div class="notice"><span>${a}</span><strong>${b}</strong></div>`;}
function table(rows){if(!rows.length)return `<div class="empty">등록된 변경 건이 없습니다.</div>`;return `<div class="table-wrap"><table><thead><tr><th>변경번호</th><th>변경 제목</th><th>유형</th><th>등급</th><th>신청일</th><th>상태</th><th>상세</th></tr></thead><tbody>${rows.map(c=>`<tr><td><strong>${esc(c.no)}</strong></td><td>${esc(c.title)}</td><td>${esc(c.type)}</td><td>${esc(c.grade||"-")}</td><td>${esc(c.date)}</td><td>${badge(c.status)}</td><td><button class="link-btn" onclick="openDetail(${c.id})">열기 →</button></td></tr>`).join("")}</tbody></table></div>`;}
function renderChanges(root){root.innerHTML=`<div class="page-intro">변경번호, 제목, 유형 및 진행 상태를 검색하고 상세 기록을 확인합니다.</div><div class="toolbar"><input class="field search" id="search" placeholder="변경번호 또는 제목 검색"><select id="filter-status" style="max-width:180px"><option value="">전체 상태</option>${["접수","영향평가 중","검토 중","보완 요청","승인","실행 중","검증 중","종료","반려","취소"].map(s=>`<option>${s}</option>`).join("")}</select><button class="primary-btn" onclick="setView('register')">＋ 신규 등록</button></div><div id="change-table">${table(changes)}</div>`;document.getElementById("search").addEventListener("input",filterTable);document.getElementById("filter-status").addEventListener("change",filterTable);}
function filterTable(){const q=document.getElementById("search").value.toLowerCase(),s=document.getElementById("filter-status").value;const rows=changes.filter(c=>(!q||c.no.toLowerCase().includes(q)||c.title.toLowerCase().includes(q))&&(!s||c.status===s));document.getElementById("change-table").innerHTML=table(rows);}
function renderRegister(root){root.innerHTML=`<div class="page-intro">변경 신청 정보를 입력합니다. 필수 항목을 입력하고 저장하면 변경번호가 자동 발급됩니다.</div><div class="card form-card"><form id="request-form"><div class="form-grid">
 ${field("title","변경 제목","예: 원자재 공급업체 변경",true)}
 <div class="form-group"><label>변경 유형 <b class="required">*</b></label><select name="type" required><option value="">선택하세요</option>${["제품","원자재","제조공정","설비","공급업체","시험검사","문서","소프트웨어","시설·환경","기타"].map(x=>`<option>${x}</option>`).join("")}</select></div>
 <div class="form-group"><label>변경 등급</label><select name="grade"><option>일반</option><option>중요</option><option>긴급</option></select></div>
 ${field("requester","신청자","신청자 성명",true)}
 ${field("date","신청일","",true,"date",new Date().toISOString().slice(0,10))}
 ${field("product","관련 제품 / 모델","관련 제품명")}
 ${field("department","관련 부서","예: 품질, 생산, 구매")}
 ${field("reason","변경 사유","변경이 필요한 이유를 입력하세요.",true,"textarea")}
 ${field("before","변경 전 내용","현재 상태를 입력하세요.",true,"textarea")}
 ${field("after","변경 후 내용","변경 예정 상태를 입력하세요.",true,"textarea")}
 ${field("planned","적용 예정일","",false,"date")}
 </div><div class="form-actions"><button type="button" class="secondary-btn" onclick="setView('changes')">취소</button><button class="primary-btn" type="submit">변경 신청 저장</button></div></form></div>`;
 document.getElementById("request-form").addEventListener("submit",e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));const year=d.date.slice(0,4);const seq=String(changes.filter(c=>c.no.startsWith("CC-"+year)).length+1).padStart(3,"0");const c={...d,id:Date.now(),no:`CC-${year}-${seq}`,status:"접수",impact:[],tasks:[],reviews:[],verification:"",closed:false};changes.unshift(c);save();toast("변경 신청이 저장되었습니다.");openDetail(c.id);});
}
function field(name,label,placeholder,required=false,type="text",value=""){return `<div class="form-group ${type==="textarea"?"full":""}"><label>${label} ${required?'<b class="required">*</b>':""}</label>${type==="textarea"?`<textarea name="${name}" rows="3" ${required?"required":""} placeholder="${placeholder}"></textarea>`:`<input class="field" name="${name}" type="${type}" ${value?`value="${value}"`:""} ${required?"required":""} placeholder="${placeholder}">`}</div>`;}
function renderFiltered(view,root){const list=changes.filter(c=>view==="impact"?["접수","영향평가 중","검토 중"].includes(c.status):view==="execution"?["승인","실행 중","검증 중"].includes(c.status):c.status==="종료"||c.status==="검증 중");root.innerHTML=`<div class="page-intro">${view==="impact"?"영향평가가 필요한 변경 건을 선택하여 평가 결과와 근거를 등록합니다.":view==="execution"?"승인된 변경의 실행 항목 및 검증 결과를 관리합니다.":"종료 대상 변경 건의 종료 조건과 최종 결과를 확인합니다."}</div>${table(list)}`;}
function openDetail(id){selectedId=id;const c=changes.find(x=>x.id===id);if(!c)return;currentView="detail";document.querySelectorAll(".nav-item").forEach(b=>b.classList.remove("active"));document.getElementById("page-title").textContent="변경 상세";const root=document.getElementById("view");const stages=["접수","영향평가 중","검토 중","실행 중","검증 중","종료"];const ix=stages.indexOf(c.status);root.innerHTML=`<div class="card"><div class="detail-head"><div><div class="detail-meta">${esc(c.no)} · ${esc(c.date)} · ${esc(c.type)}</div><h2>${esc(c.title)}</h2><div class="detail-meta">신청자: ${esc(c.requester)}　|　등급: ${esc(c.grade||"-")}</div></div><div>${badge(c.status)}</div></div>
 <div class="steps">${stages.map((s,i)=>`<div class="step ${i<ix?"done":i===ix?"current":""}">${i+1}. ${s}</div>`).join("")}</div>
 <div class="grid detail-grid">
 <div><h3>변경 기본정보</h3>${detailLine("변경 사유",c.reason)}${detailLine("변경 전",c.before)}${detailLine("변경 후",c.after)}${detailLine("관련 제품",c.product||"-")}${detailLine("관련 부서",c.department||"-")}</div>
 <div><h3>영향평가</h3>${(c.impact||[]).length?c.impact.map(x=>detailLine(x.item,`${x.result} — ${x.reason}`)).join(""):'<p class="help">등록된 평가가 없습니다.</p>'}
 <button class="secondary-btn" onclick="addImpact(${c.id})">＋ 평가 항목 추가</button></div>
 <div><h3>검토 및 승인 기록</h3>${(c.reviews||[]).length?c.reviews.map(x=>detailLine(x.name,`${x.decision} / ${x.date} / ${x.opinion||""}`)).join(""):'<p class="help">등록된 검토·승인 기록이 없습니다.</p>'}<button class="secondary-btn" onclick="addReview(${c.id})">＋ 검토·승인 기록</button></div>
 <div><h3>실행 항목</h3>${(c.tasks||[]).length?c.tasks.map((x,i)=>`<label class="check-row"><input type="checkbox" ${x.done?"checked":""} onchange="toggleTask(${c.id},${i},this.checked)"><span>${esc(x.name)} · ${esc(x.assignee)} · 기한 ${esc(x.due||"-")}</span></label>`).join(""):'<p class="help">실행 항목이 없습니다.</p>'}<button class="secondary-btn" onclick="addTask(${c.id})">＋ 실행 항목 추가</button></div>
 </div><div class="card" style="margin-top:16px;background:#fafbfe"><h3>검증 및 종료</h3><div class="form-group"><label>검증 결과 / 결론</label><textarea id="verification-text" rows="2" placeholder="검증 방법, 결과 및 결론을 기록하세요.">${esc(c.verification||"")}</textarea></div><div class="form-actions"><button class="secondary-btn" onclick="saveVerification(${c.id})">검증 기록 저장</button><button class="primary-btn" onclick="advanceStatus(${c.id})">다음 단계로 진행</button><button class="danger-btn" onclick="cancelChange(${c.id})">취소 처리</button></div></div>
 <div class="form-actions"><button class="secondary-btn" onclick="setView('changes')">목록으로</button><button class="secondary-btn" onclick="exportOne(${c.id})">변경 요약 CSV</button></div></div>`;}
function detailLine(k,v){return `<div class="notice"><span>${esc(k)}</span><strong style="white-space:normal;text-align:right;max-width:65%">${esc(v)}</strong></div>`;}
function addImpact(id){const c=changes.find(x=>x.id===id);const item=prompt("평가 항목을 입력하세요.");if(!item)return;const result=prompt("평가 결과: 영향 있음 / 영향 없음 / 해당 없음 / 추가 검토 필요","영향 있음");if(!result)return;const reason=prompt("판단 근거를 입력하세요.");if(!reason)return;c.impact.push({item,result,reason});if(c.status==="접수")c.status="영향평가 중";save();openDetail(id);toast("영향평가를 저장했습니다.");}
function addReview(id){const c=changes.find(x=>x.id===id);const name=prompt("검토자 또는 승인자 성명/직책");if(!name)return;const decision=prompt("결과: 승인 / 반려 / 보완 요청","승인");if(!decision)return;const date=prompt("실제 검토일 (YYYY-MM-DD)",new Date().toISOString().slice(0,10));const opinion=prompt("검토 의견","");c.reviews.push({name,decision,date,opinion});if(decision==="승인")c.status="승인";else if(decision==="반려")c.status="반려";else c.status="보완 요청";save();openDetail(id);toast("검토 기록을 저장했습니다.");}
function addTask(id){const c=changes.find(x=>x.id===id);const name=prompt("실행 항목");if(!name)return;const assignee=prompt("담당자/부서","품질");const due=prompt("완료 예정일 (YYYY-MM-DD)","");c.tasks.push({name,assignee,due,done:false});if(c.status==="승인")c.status="실행 중";save();openDetail(id);toast("실행 항목을 추가했습니다.");}
function toggleTask(id,i,v){const c=changes.find(x=>x.id===id);c.tasks[i].done=v;if(c.tasks.length&&c.tasks.every(t=>t.done))c.status="검증 중";save();openDetail(id);}
function saveVerification(id){const c=changes.find(x=>x.id===id);c.verification=document.getElementById("verification-text").value;save();toast("검증 기록을 저장했습니다.");}
function advanceStatus(id){const c=changes.find(x=>x.id===id);const order=["접수","영향평가 중","검토 중","승인","실행 중","검증 중","종료"];const i=order.indexOf(c.status);if(c.status==="접수"&&!c.impact.length){toast("먼저 영향평가 항목을 등록하세요.");return;}if(c.status==="영향평가 중"){if(c.impact.some(x=>!x.reason)){toast("평가 근거를 확인하세요.");return;}c.status="검토 중";}
 else if(c.status==="검토 중"){if(!c.reviews.some(x=>x.decision==="승인")){toast("승인 기록을 먼저 등록하세요.");return;}c.status="승인";}
 else if(c.status==="승인"){c.status="실행 중";}
 else if(c.status==="실행 중"){if(c.tasks.some(t=>!t.done)){toast("미완료 실행 항목이 있습니다.");return;}c.status="검증 중";}
 else if(c.status==="검증 중"){if(!c.verification.trim()){toast("검증 결과를 입력하세요.");return;}c.status="종료";c.closed=true;}
 else {toast("현재 단계에서 진행할 수 없습니다.");return;}
 save();openDetail(id);toast("진행 상태가 변경되었습니다.");}
function cancelChange(id){if(!confirm("이 변경 건을 취소 상태로 변경하시겠습니까?"))return;const c=changes.find(x=>x.id===id);c.status="취소";save();openDetail(id);}
function renderReports(root){const closed=changes.filter(c=>c.status==="종료").length;const types={};changes.forEach(c=>types[c.type]=(types[c.type]||0)+1);root.innerHTML=`<div class="page-intro">현재 등록된 시제품 데이터를 기준으로 통계와 목록 파일을 생성합니다.</div><div class="grid stats">${stat("전체 변경",changes.length,"누적 등록")}${stat("종료 완료",closed,"종료 상태")}${stat("진행 중",changes.filter(c=>!["종료","취소","반려"].includes(c.status)).length,"진행 상태")}${stat("변경 유형",Object.keys(types).length,"분류 수")}</div><div class="grid two-col"><div class="card"><h2>유형별 변경 현황</h2>${Object.entries(types).map(([k,v])=>notice(k,v+"건")).join("")||'<p class="help">데이터 없음</p>'}</div><div class="card"><h2>보고서 생성</h2><p class="help">시제품 출력은 CSV 파일입니다. 운영 버전에서는 기존 회사 양식에 맞춘 PDF/Excel 템플릿으로 구현합니다.</p><div class="status-list"><button class="secondary-btn" onclick="downloadRegister()">변경관리대장 CSV 다운로드</button><button class="secondary-btn" onclick="downloadSummary()">통계 요약 CSV 다운로드</button><button class="secondary-btn" onclick="downloadJSON()">데이터 백업 JSON 다운로드</button><button class="danger-btn" onclick="resetDemo()">시제품 데이터 초기화</button></div></div></div>`;}
function csvEscape(v){return '"'+String(v??"").replace(/"/g,'""')+'"';}
function download(name,content,type="text/csv;charset=utf-8"){const blob=new Blob(["\ufeff"+content],{type});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href);}
function downloadRegister(){const rows=[["변경번호","제목","유형","등급","신청자","신청일","상태","변경 사유"],...changes.map(c=>[c.no,c.title,c.type,c.grade,c.requester,c.date,c.status,c.reason])];download("change-register.csv",rows.map(r=>r.map(csvEscape).join(",")).join("\n"));}
function downloadSummary(){const types={};changes.forEach(c=>types[c.type]=(types[c.type]||0)+1);const rows=[["항목","건수"],["전체 변경",changes.length],["종료",changes.filter(c=>c.status==="종료").length],["진행 중",changes.filter(c=>!["종료","취소","반려"].includes(c.status)).length],...Object.entries(types)];download("change-summary.csv",rows.map(r=>r.map(csvEscape).join(",")).join("\n"));}
function downloadJSON(){download("qms-change-backup-demo.json",JSON.stringify(changes,null,2),"application/json");}
function exportOne(id){const c=changes.find(x=>x.id===id);download(`${c.no}-summary.csv`,[["항목","내용"],["변경번호",c.no],["제목",c.title],["유형",c.type],["상태",c.status],["사유",c.reason],["변경 전",c.before],["변경 후",c.after]].map(r=>r.map(csvEscape).join(",")).join("\n"));}
function resetDemo(){if(!confirm("시제품 데이터를 초기화하시겠습니까?"))return;changes=seed.map(x=>({...x}));save();render();toast("초기화했습니다.");}
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
document.getElementById("quick-add").addEventListener("click",()=>setView("register"));
render();
