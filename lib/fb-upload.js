/* 사진·PDF 올리기 — Firebase Storage (2026-11-07, Vercel Blob에서 옮김: Vercel 무료 요금제로 내리기 위해)
   window.FbUpload(path, file, {contentType}) → {url}   (예전 Vercel Blob upload()와 같은 모양으로 돌려준다)
   - 파일 이름 끝에 무작위 글자를 붙여 남이 주소를 짐작하지 못하게 한다.
   - 이미 Vercel Blob에 올라간 예전 사진 주소는 그대로 둔다(새로 올리는 것만 여기로).
   - Firebase 저장소 규칙: prob32/·prob33/·bn/ 아래에만, 로그인(익명)한 사람만, 10MB 아래 이미지·PDF만 올릴 수 있다(규칙은 선생님이 Firebase 화면에서 설정). */
(function(){
  const V = '10.12.2';
  const CFG = {
    apiKey: 'AIzaSyBK7NlpKOr1ozAXF96vS8p7YyjiNaAJlfI',
    authDomain: 'brojuntest.firebaseapp.com',
    databaseURL: 'https://brojuntest-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 'brojuntest',
    storageBucket: 'brojuntest.firebasestorage.app',
    messagingSenderId: '426333242398',
    appId: '1:426333242398:web:b3ae216d5269ce13065a0f'
  };
  const load = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('업로드 도구를 불러오지 못했어요.')); document.head.appendChild(s); });
  let ready = null;
  function init(){
    if (ready) return ready;
    return ready = (async () => {
      const base = `https://www.gstatic.com/firebasejs/${V}/`;
      if (!window.firebase) await load(base + 'firebase-app-compat.js');
      if (!firebase.auth) await load(base + 'firebase-auth-compat.js');
      if (!firebase.storage) await load(base + 'firebase-storage-compat.js');
      if (!firebase.apps.length) firebase.initializeApp(CFG);
      const auth = firebase.auth();
      if (!auth.currentUser) await auth.signInAnonymously();
      return firebase.storage();
    })().catch(e => { ready = null; throw e; });
  }
  window.FbUpload = async function(path, file, opts){
    const st = await init();
    const rnd = Math.random().toString(36).slice(2, 10);
    const p = /\.\w+$/.test(path) ? path.replace(/(\.\w+)$/, '-' + rnd + '$1') : path + '-' + rnd;
    const snap = await st.ref(p).put(file, { contentType: (opts && opts.contentType) || file.type || 'application/octet-stream' });
    return { url: await snap.ref.getDownloadURL(), pathname: p };
  };
})();
