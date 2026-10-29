/* 🗑 2026-10-29 휴지통 — 학생 기록을 지우기 전에 rooms/__trash/items 에 통째로 보관한다(7일 동안 되살리기 가능).
   (2반 7번 1부 기록을 지운 뒤 되살릴 방법이 없었던 일을 계기로 만듦)
   보관 형식: {ts, why, cls, who:[학생 키…], page, entries:[{p:'rooms/…/students/키', v:값}], restoredAt?}
   - 교사 대시보드: trashSave(studentsRef, keys|null, why)  — keys가 null이면 그 반 학생 전체(반 초기화)
   - 학생 관리(mgmt): trashSaveEntries(entries, why, cls, who)
   - 되살리기·목록은 mgmt 학생 관리 창의 '휴지통' 칸에서 한다. 보관에 실패하면 지우지 않는다. */
(function(){
  const KEEP_DAYS = 7;
  const ref = () => firebase.database().ref('rooms/__trash/items');
  async function saveEntries(entries, why, cls, who){
    entries = (entries || []).filter(e=> e && e.p && e.v != null);
    if(!entries.length) return 0;
    await ref().push({ ts: Date.now(), why: String(why||''), cls: String(cls||''), who: (who||[]).slice(0, 60), page: location.pathname.split('/').pop(), entries });
    return entries.length;
  }
  window.trashSaveEntries = saveEntries;
  window.trashSave = async function(studentsRef, keys, why){
    const room = studentsRef.parent.key, cls = String(room).split('__')[0];
    let entries = [], who = [];
    if(keys == null){
      const v = (await studentsRef.once('value')).val() || {};
      Object.keys(v).forEach(k=>{ entries.push({ p: 'rooms/'+room+'/students/'+k, v: v[k] }); who.push(k); });
    } else {
      for(const k of keys){ const v = (await studentsRef.child(k).once('value')).val(); if(v != null){ entries.push({ p: 'rooms/'+room+'/students/'+k, v }); who.push(k); } }
    }
    return saveEntries(entries, why, cls, who);
  };
  /* 목록(최근 7일) — 오래된 것은 지운다 */
  window.trashList = async function(){
    const cut = Date.now() - KEEP_DAYS*86400000;
    const old = (await ref().orderByChild('ts').endAt(cut).once('value')).val() || {};
    Object.keys(old).forEach(id=> ref().child(id).remove().catch(()=>{}));
    const v = (await ref().orderByChild('ts').startAt(cut).once('value')).val() || {};
    return Object.keys(v).map(id=> Object.assign({ id }, v[id])).sort((a,b)=> b.ts - a.ts);
  };
  /* 되살리기 — 지금 비어 있는 자리만 채운다(그 사이 새로 쓴 기록은 덮어쓰지 않음). overwrite면 덮어쓴다 */
  window.trashRestore = async function(item, overwrite){
    const db = firebase.database(); let put = 0; const busy = [];
    for(const e of (item.entries || [])){
      const cur = (await db.ref(e.p).once('value')).val();
      if(cur != null && !overwrite){ busy.push(e.p.split('/').pop()); continue; }
      await db.ref(e.p).set(e.v); put++;
    }
    if(!busy.length) await ref().child(item.id).update({ restoredAt: Date.now() });
    return { put, busy };
  };
})();
