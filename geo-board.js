/* 작도판(GeoCanvas) — student40.html 안의 GEO를 그대로 옮긴 것. 교사 화면에서 학생 작도를 다시 그려 보여 줄 때 쓴다(2026-11-12) */
const GEO = (()=>{
const GRID = 40;
const TOUCH_TOL = 30; // 모바일에서 점 주변을 터치해도 잡히도록 넉넉하게 잡은 히트 반경(SVG 좌표계 기준)
let _uid = 0;
const uid = () => 'o' + (_uid++);

/* ---------- 기하 수학 유틸 ---------- */
const sub = (a,b) => ({x:a.x-b.x, y:a.y-b.y});
const add = (a,b) => ({x:a.x+b.x, y:a.y+b.y});
const scl = (a,s) => ({x:a.x*s, y:a.y*s});
const norm = a => { const m = Math.hypot(a.x,a.y)||1; return {x:a.x/m,y:a.y/m}; };
const perp = a => ({x:-a.y, y:a.x});
const mid = (a,b) => ({x:(a.x+b.x)/2, y:(a.y+b.y)/2});
const dist = (a,b) => Math.hypot(a.x-b.x, a.y-b.y);
const samePt = (a,b,tol=5) => a && b && dist(a,b) < tol;

function distToLine(p,a,b){
  const dx=b.x-a.x, dy=b.y-a.y, len=Math.hypot(dx,dy)||1;
  return Math.abs((p.x-a.x)*dy - (p.y-a.y)*dx)/len;
}
function distToSegment(p,a,b){
  const dx=b.x-a.x, dy=b.y-a.y, len2=dx*dx+dy*dy;
  let t = len2===0?0:((p.x-a.x)*dx+(p.y-a.y)*dy)/len2;
  t = Math.max(0,Math.min(1,t));
  return Math.hypot(p.x-(a.x+t*dx), p.y-(a.y+t*dy));
}
function lineLineIntersection(a1,b1,a2,b2){
  const x1=a1.x,y1=a1.y,x2=b1.x,y2=b1.y,x3=a2.x,y3=a2.y,x4=b2.x,y4=b2.y;
  const d=(x1-x2)*(y3-y4)-(y1-y2)*(x3-x4);
  if(Math.abs(d)<1e-9) return null;
  const t=((x1-x3)*(y3-y4)-(y1-y3)*(x3-x4))/d;
  return {x:x1+t*(x2-x1), y:y1+t*(y2-y1)};
}
function circleLineIntersection(center,r,a,b){
  const dx=b.x-a.x, dy=b.y-a.y;
  const fx=a.x-center.x, fy=a.y-center.y;
  const A=dx*dx+dy*dy, B=2*(fx*dx+fy*dy), C=fx*fx+fy*fy-r*r;
  let disc=B*B-4*A*C;
  if(disc<0) return [];
  disc=Math.sqrt(disc);
  const t1=(-B-disc)/(2*A), t2=(-B+disc)/(2*A);
  const pts=[];
  [t1,t2].forEach(t=>pts.push({x:a.x+t*dx, y:a.y+t*dy}));
  return pts;
}
function circleCircleIntersection(c1,r1,c2,r2){
  const d=dist(c1,c2);
  if(d>r1+r2||d<Math.abs(r1-r2)||d===0) return [];
  const a=(r1*r1-r2*r2+d*d)/(2*d);
  const h=Math.sqrt(Math.max(0,r1*r1-a*a));
  const xm=c1.x+a*(c2.x-c1.x)/d, ym=c1.y+a*(c2.y-c1.y)/d;
  return [
    {x:xm+h*(c2.y-c1.y)/d, y:ym-h*(c2.x-c1.x)/d},
    {x:xm-h*(c2.y-c1.y)/d, y:ym+h*(c2.x-c1.x)/d}
  ];
}
function projectOntoLine(p,a,b){
  const dx=b.x-a.x, dy=b.y-a.y, len2=dx*dx+dy*dy||1;
  const t=((p.x-a.x)*dx+(p.y-a.y)*dy)/len2;
  return {x:a.x+t*dx, y:a.y+t*dy};
}
function projectOntoSegment(p,a,b){
  const dx=b.x-a.x, dy=b.y-a.y, len2=dx*dx+dy*dy||1;
  let t=((p.x-a.x)*dx+(p.y-a.y)*dy)/len2;
  t=Math.max(0,Math.min(1,t));
  return {x:a.x+t*dx, y:a.y+t*dy};
}
function projectOntoCircle(p,center,r){
  const d=norm(sub(p,center));
  return {x:center.x+d.x*r, y:center.y+d.y*r};
}
function angleDeg(a,b,c){
  const v1=sub(a,b), v2=sub(c,b);
  const mag=Math.hypot(v1.x,v1.y)*Math.hypot(v2.x,v2.y) || 1;
  let cos=(v1.x*v2.x+v1.y*v2.y)/mag;
  cos=Math.max(-1,Math.min(1,cos));
  return Math.acos(cos)*180/Math.PI;
}
function bisectorDir(a,b,c){
  const u=norm(sub(a,b)), v=norm(sub(c,b));
  let d=norm(add(u,v));
  if(Math.hypot(d.x,d.y)<1e-6) d=perp(norm(sub(c,a)));
  return d;
}
function arcInfo(b,a,c,r){
  const a1=Math.atan2(a.y-b.y,a.x-b.x), a2=Math.atan2(c.y-b.y,c.x-b.x);
  let diff=a2-a1;
  while(diff<=-Math.PI) diff+=2*Math.PI;
  while(diff>Math.PI) diff-=2*Math.PI;
  const end=a1+diff;
  const p1={x:b.x+r*Math.cos(a1), y:b.y+r*Math.sin(a1)};
  const p2={x:b.x+r*Math.cos(end), y:b.y+r*Math.sin(end)};
  const sweep = diff>0?1:0;
  return {path:`M ${p1.x} ${p1.y} A ${r} ${r} 0 0 ${sweep} ${p2.x} ${p2.y}`, deg: Math.abs(diff)*180/Math.PI, mid:{x:b.x+(r+16)*Math.cos(a1+diff/2), y:b.y+(r+16)*Math.sin(a1+diff/2)}};
}
const ok = msg => ({ok:true,msg});
const fail = msg => ({ok:false,msg});

/* ---------- 도구 메타 ---------- */
const TOOL_META = {
  move:{label:'이동'}, point:{label:'점'}, line:{label:'직선'}, segment:{label:'선분'},
  circleCP:{label:'원(중심,통과점)'}, circleCR:{label:'원(중심,반지름)'},
  perpBisector:{label:'수직이등분선'}, angleBisector:{label:'각의 이등분선'}, perp:{label:'수선'},
  intersect:{label:'교점'}, midpoint:{label:'중점'}, polygon:{label:'다각형'}, lengthTool:{label:'길이 재기'}, angleTool:{label:'각도 재기'},
  angleInput:{label:'각도 입력 작도'}
};
const ALL_TOOLS = ['point','line','segment','circleCP','circleCR','intersect','midpoint','perp','perpBisector','angleBisector','polygon','lengthTool','angleTool','angleInput'];
const TOOL_HELP = {
  lengthTool: '"길이 재기" 도구를 클릭한 뒤, 선분을 바로 클릭하거나 점 두 개를 순서대로 클릭하세요. 화면에 길이 값이 나타나요.',
  angleTool: '"각도 재기" 도구를 클릭한 뒤, 점 세 개를 순서대로 클릭하세요(가운데 점이 꼭짓점). 화면에 각도 값이 나타나요.',
  perp: '"수선" 도구를 클릭한 뒤, 기준이 되는 직선/선분/반직선을 먼저 클릭하고, 그다음 그 직선에 수직인 선이 지나갈 점을 클릭하세요.'
};
const INTERSECTABLE = ['line','segment','perpBisector','circleCP','circleCR','angleBisector','perp'];

/* ---------- GeoCanvas 클래스 ---------- */
class GeoCanvas{
  constructor(svgEl, cfg, onChange){
    this.svg = svgEl;
    this.width = cfg.width || 600;
    this.height = cfg.height || 400;
    this.points = [];
    this.objects = [];
    this.history = [];
    this.tool = 'move';
    this.pending = [];
    this.pendingObjs = [];
    this.dragging = null;
    this.redoStack = [];
    this.onChange = onChange || (()=>{});
    (cfg.points||[]).forEach(p => this.addPoint(p.x,p.y,{label:p.label, locked:true}));
    (cfg.presetObjects||[]).forEach(o => {
      const resolved = Object.assign({}, o);
      ['p1','p2','center','through','r1','r2','a','b','c','p','refP1','refP2'].forEach(k=>{
        if(resolved[k] && typeof resolved[k]==='string'){ const pt=this.points.find(p=>p.label===resolved[k]); if(pt) resolved[k]=pt.id; }
      });
      if(resolved.ids) resolved.ids = resolved.ids.map(l=>{ const pt=this.points.find(p=>p.label===l); return pt?pt.id:l; });
      const obj = Object.assign({id:uid(), locked:true}, resolved);
      this.objects.push(obj);
    });
    this._wire();
    this.render();
  }
  addPoint(x,y,opts={}){
    const used = new Set(this.points.map(p=>p.label));
    const pool = 'PQRSTUVWXYZLMNKJIHGFED'.split('');
    const label = opts.label || pool.find(l=>!used.has(l)) || ('X'+this.points.length);
    const p = {id:uid(), label, x, y, locked: !!opts.locked, constraint: opts.constraint||null, computed: opts.computed||null};
    this.points.push(p);
    if(!opts.locked || opts.trackHistory){ this.history.push({kind:'point', id:p.id}); this.redoStack=[]; }
    return p;
  }
  // computed: {kind:'intersection', o1, o2} 형태의 점은 매 render()마다 두 도형(o1,o2)의 교점을
  // 다시 계산해서 위치를 갱신한다. 두 점이 만나는 경우(원-원, 원-직선)에는 직전 위치에 더 가까운
  // 쪽을 골라서, 도형을 움직여도 엉뚱한 교점으로 순간이동하지 않게 한다.
  _recomputeComputedPoints(){
    this.points.forEach(p=>{
      if(!p.computed || p.computed.kind!=='intersection') return;
      const o1=this.objects.find(o=>o.id===p.computed.o1), o2=this.objects.find(o=>o.id===p.computed.o2);
      if(!o1||!o2) return;
      const pts=this.computeIntersections(o1,o2);
      if(!pts.length) return; // 교점이 사라지면 마지막 위치를 그대로 유지
      let best=pts[0], bd=dist(pts[0],p);
      pts.forEach(cand=>{ const d=dist(cand,p); if(d<bd){bd=d;best=cand;} });
      p.x=best.x; p.y=best.y;
    });
  }
  addObject(o){
    const obj = Object.assign({id:uid(), locked:false}, o);
    this.objects.push(obj);
    this.history.push({kind:'object', id:obj.id});
    this.redoStack=[];
    return obj;
  }
  resolvePoint(id){ return this.points.find(p=>p.id===id); }
  byLabel(label){ return this.points.find(p=>p.label===label); }
  pickPoint(pt){ return this.findPointNear(pt,TOUCH_TOL) || this.addPoint(pt.x,pt.y); }
  findPointNear(pt,tol){
    let best=null,bd=tol;
    for(const p of this.points){ const d=dist(p,pt); if(d<bd){bd=d;best=p;} }
    return best;
  }
  getObjGeom(o){
    switch(o.type){
      case 'line': case 'segment': case 'perpBisector':
        return {p1:this.resolvePoint(o.p1), p2:this.resolvePoint(o.p2)};
      case 'circleCP': return {center:this.resolvePoint(o.center), through:this.resolvePoint(o.through)};
      case 'circleCR': return {center:this.resolvePoint(o.center), r1:this.resolvePoint(o.r1), r2:this.resolvePoint(o.r2)};
      case 'angleBisector': case 'angleLabel': return {a:this.resolvePoint(o.a), b:this.resolvePoint(o.b), c:this.resolvePoint(o.c)};
      case 'polygon': return {pts:o.ids.map(id=>this.resolvePoint(id))};
      case 'lengthLabel': return {p1:this.resolvePoint(o.p1), p2:this.resolvePoint(o.p2)};
      case 'perp': return {p:this.resolvePoint(o.p), refP1:this.resolvePoint(o.refP1), refP2:this.resolvePoint(o.refP2)};
    }
  }
  asLine(o){
    const g=this.getObjGeom(o);
    if(o.type==='line'||o.type==='segment') return [g.p1,g.p2];
    if(o.type==='perpBisector'){ const M=mid(g.p1,g.p2); const d=perp(norm(sub(g.p2,g.p1))); return [M, add(M,d)]; }
    if(o.type==='angleBisector'){ const d=bisectorDir(g.a,g.b,g.c); return [g.b, add(g.b,d)]; }
    if(o.type==='perp'){ const d=perp(norm(sub(g.refP2,g.refP1))); return [g.p, add(g.p,d)]; }
    return null;
  }
  asCircle(o){
    const g=this.getObjGeom(o);
    if(o.type==='circleCP') return {center:g.center, r: dist(g.center,g.through)};
    if(o.type==='circleCR') return {center:g.center, r: dist(g.r1,g.r2)};
    return null;
  }
  _projectOntoObject(o,pt){
    const l=this.asLine(o), c=this.asCircle(o);
    if(c) return projectOntoCircle(pt,c.center,c.r);
    if(l) return o.type==='segment' ? projectOntoSegment(pt,l[0],l[1]) : projectOntoLine(pt,l[0],l[1]);
    return pt;
  }
  objDistToPoint(o,pt){
    const l=this.asLine(o), c=this.asCircle(o);
    if(l){ return o.type==='segment' ? distToSegment(pt,l[0],l[1]) : distToLine(pt,l[0],l[1]); }
    if(c){ return Math.abs(dist(c.center,pt)-c.r); }
    return Infinity;
  }
  // 다각형의 변도 선분처럼 고를 수 있게(수직이등분선·원(반지름)·수선·길이 재기에서 변을 바로 클릭) — 2026-10-21
  findSegLike(pt,tol){ const o=this.findObjectNear(pt,tol); if(o && (o.type==='segment'||o.type==='line'||o.type==='ray')) return o; if(this.findPointNear(pt,tol)) return o;   // 점(꼭짓점) 근처를 누르면 점 고르기가 먼저(두 점을 차례로 누르는 방법)
    let best=null,bd=tol;
    for(const q of this.objects){ if(q.type!=='polygon' || !q.ids) continue; const ids=q.ids; for(let i=0;i<ids.length;i++){ const a=this.resolvePoint(ids[i]), b=this.resolvePoint(ids[(i+1)%ids.length]); if(!a||!b) continue; const d=distToSegment(pt,a,b); if(d<bd){ bd=d; best={type:'segment', p1:ids[i], p2:ids[(i+1)%ids.length]}; } } }
    return best || o; }
  findObjectNear(pt,tol){
    let best=null,bd=tol;
    for(const o of this.objects){
      if(!INTERSECTABLE.includes(o.type)) continue;
      const g=this.getObjGeom(o);
      if(Object.values(g).some(v=>!v)) continue;
      const d=this.objDistToPoint(o,pt);
      if(d<bd){bd=d;best=o;}
    }
    return best;
  }
  computeIntersections(o1,o2){
    const l1=this.asLine(o1), c1=this.asCircle(o1), l2=this.asLine(o2), c2=this.asCircle(o2);
    if(l1&&l2){ const p=lineLineIntersection(l1[0],l1[1],l2[0],l2[1]); return p?[p]:[]; }
    if(l1&&c2) return circleLineIntersection(c2.center,c2.r,l1[0],l1[1]);
    if(c1&&l2) return circleLineIntersection(c1.center,c1.r,l2[0],l2[1]);
    if(c1&&c2) return circleCircleIntersection(c1.center,c1.r,c2.center,c2.r);
    return [];
  }
  // 교점 도구 개선: 두 도형을 순서대로 각각 클릭하지 않아도, 두 도형이 실제로 교차하는
  // 지점 자체를 터치하면 그 두 도형을 자동으로 찾아 바로 교점을 만들어준다(기존의
  // "도형을 하나씩 순서대로 클릭" 방식도 그대로 남겨둔다 — handleToolClick의 'intersect' 참고).
  findIntersectionNear(pt, tol){
    const objs = this.objects.filter(o=>INTERSECTABLE.includes(o.type));
    let best=null, bd=tol;
    for(let i=0;i<objs.length;i++){
      for(let j=i+1;j<objs.length;j++){
        const o1=objs[i], o2=objs[j];
        const g1=this.getObjGeom(o1), g2=this.getObjGeom(o2);
        if(!g1||!g2) continue;
        if(Object.values(g1).some(v=>Array.isArray(v)?v.some(x=>!x):!v)) continue;
        if(Object.values(g2).some(v=>Array.isArray(v)?v.some(x=>!x):!v)) continue;
        this.computeIntersections(o1,o2).forEach(ip=>{
          if(ip.x<0||ip.x>this.width||ip.y<0||ip.y>this.height) return;
          const d=dist(pt,ip);
          if(d<bd){ bd=d; best={o1,o2,point:ip}; }
        });
      }
    }
    return best;
  }
  setTool(t){ this.tool=t; this.pending=[]; this.pendingObjs=[]; this.render(); }
  reset(){
    this.points = this.points.filter(p=>p.locked);
    this.objects = this.objects.filter(o=>o.locked);
    this.history=[]; this.redoStack=[]; this.pending=[]; this.pendingObjs=[]; this.dragging=null;
    this.render();
  }
  undo(){
    const last = this.history.pop();
    if(!last) return;
    let entry;
    if(last.kind==='point'){
      const point = this.points.find(p=>p.id===last.id);
      const relatedObjects = this.objects.filter(o=>this._refsPoint(o,last.id));
      this.points = this.points.filter(p=>p.id!==last.id);
      this.objects = this.objects.filter(o=>!this._refsPoint(o,last.id));
      entry = {kind:'point', id:last.id, point, relatedObjects};
    } else {
      const object = this.objects.find(o=>o.id===last.id);
      this.objects = this.objects.filter(o=>o.id!==last.id);
      entry = {kind:'object', id:last.id, object};
    }
    this.redoStack.push(entry);
    this.pending=[]; this.pendingObjs=[];
    this.render();
  }
  redo(){
    const last = this.redoStack.pop();
    if(!last) return;
    if(last.kind==='point'){
      if(last.point) this.points.push(last.point);
      if(last.relatedObjects && last.relatedObjects.length) this.objects.push(...last.relatedObjects);
    } else if(last.object){
      this.objects.push(last.object);
    }
    this.history.push({kind:last.kind, id:last.id});
    this.pending=[]; this.pendingObjs=[];
    this.render();
  }
  _refsPoint(o,pid){
    return [o.p1,o.p2,o.center,o.through,o.r1,o.r2,o.a,o.b,o.c,o.p,o.refP1,o.refP2].includes(pid) || (o.ids && o.ids.includes(pid));
  }
  getSvgCoords(e){
    const pt = this.svg.createSVGPoint();
    const t = e.touches && e.touches[0] ? e.touches[0] : e;
    pt.x=t.clientX; pt.y=t.clientY;
    const ctm = this.svg.getScreenCTM().inverse();
    const loc = pt.matrixTransform(ctm);
    return {x:loc.x, y:loc.y};
  }
  _wire(){
    const down = e=>{
      e.preventDefault();
      const pt=this.getSvgCoords(e);
      if(this.tool==='move'){
        const p=this.findPointNear(pt,TOUCH_TOL);
        if(p && !p.locked) this.dragging=p;
        return;
      }
      this.handleToolClick(pt);
    };
    const move = e=>{
      if(!this.dragging) return;
      e.preventDefault();
      const pt=this.getSvgCoords(e);
      let nx=pt.x, ny=pt.y;
      if(this.dragging.constraint){
        const o=this.objects.find(ob=>ob.id===this.dragging.constraint.objId);
        if(o){ const proj=this._projectOntoObject(o,pt); nx=proj.x; ny=proj.y; }
      }
      this.dragging.x = Math.max(0,Math.min(this.width,nx));
      this.dragging.y = Math.max(0,Math.min(this.height,ny));
      this.render();
    };
    const up = ()=>{ this.dragging=null; };
    this.svg.addEventListener('mousedown', down);
    this.svg.addEventListener('touchstart', down, {passive:false});
    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', move, {passive:false});
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);
  }
  handleToolClick(pt){
    switch(this.tool){
      case 'point': {
        if(this.findPointNear(pt,TOUCH_TOL)) break;
        const o=this.findObjectNear(pt,TOUCH_TOL);
        if(o){ const proj=this._projectOntoObject(o,pt); this.addPoint(proj.x,proj.y,{constraint:{objId:o.id}}); }
        else { this.addPoint(pt.x,pt.y); }
        break;
      }
      case 'line': case 'segment': {
        const p=this.pickPoint(pt); this.pending.push(p.id);
        if(this.pending.length>=2){ const [a,b]=this.pending; if(a!==b) this.addObject({type:this.tool,p1:a,p2:b}); this.pending=[]; }
        break;
      }
      case 'circleCP': {
        const p=this.pickPoint(pt); this.pending.push(p.id);
        if(this.pending.length>=2){ const [c,t]=this.pending; if(c!==t) this.addObject({type:'circleCP',center:c,through:t}); this.pending=[]; }
        break;
      }
      case 'circleCR': {
        if(this.pending.length===0){
          const p=this.pickPoint(pt); this.pending.push(p.id);
          break;
        }
        // 중심을 고른 뒤: 선분을 클릭하면 그 선분의 길이를 반지름으로 바로 사용
        const segObj=this.findSegLike(pt,TOUCH_TOL);
        if(segObj && segObj.type==='segment'){
          const cId=this.pending[0]; this.pending=[];
          this.addObject({type:'circleCR', center:cId, r1:segObj.p1, r2:segObj.p2});
          break;
        }
        const p=this.pickPoint(pt); this.pending.push(p.id);
        if(this.pending.length>=3){ const [c,r1,r2]=this.pending; this.addObject({type:'circleCR',center:c,r1,r2}); this.pending=[]; }
        break;
      }
      case 'perpBisector': {
        if(this.pending.length===0){
          const segObj=this.findSegLike(pt,TOUCH_TOL);
          if(segObj && (segObj.type==='segment'||segObj.type==='line')){
            this.addObject({type:'perpBisector', p1:segObj.p1, p2:segObj.p2});
            break;
          }
        }
        const p=this.pickPoint(pt); this.pending.push(p.id);
        if(this.pending.length>=2){ const [a,b]=this.pending; this.addObject({type:'perpBisector',p1:a,p2:b}); this.pending=[]; }
        break;
      }
      case 'angleBisector': {
        const p=this.pickPoint(pt); this.pending.push(p.id);
        if(this.pending.length>=3){ const [a,b,c]=this.pending; this.addObject({type:'angleBisector',a,b,c}); this.pending=[]; }
        break;
      }
      case 'polygon': {
        const p=this.pickPoint(pt);
        if(this.pending.length>=3 && p.id===this.pending[0]){ this.addObject({type:'polygon', ids:[...this.pending]}); this.pending=[]; }
        else this.pending.push(p.id);
        break;
      }
      case 'intersect': {
        // 두 도형이 만나는 지점을 바로 터치한 경우: 어떤 두 도형인지 자동으로 찾아 바로 교점을 만든다.
        const direct = this.findIntersectionNear(pt, TOUCH_TOL);
        if(direct){
          if(!this.findPointNear(direct.point,6)){
            this.addPoint(direct.point.x, direct.point.y, {locked:true, trackHistory:true, computed:{kind:'intersection', o1:direct.o1.id, o2:direct.o2.id}});
          }
          this.pendingObjs=[];
          break;
        }
        const o=this.findObjectNear(pt,TOUCH_TOL);
        if(o){
          this.pendingObjs.push(o);
          if(this.pendingObjs.length>=2){
            const [o1,o2]=this.pendingObjs;
            if(o1!==o2){
              const pts=this.computeIntersections(o1,o2);
              pts.forEach(ip=>{
                if(ip.x>=0&&ip.x<=this.width&&ip.y>=0&&ip.y<=this.height && !this.findPointNear(ip,6)){
                  // computed 태그를 달아두면 o1/o2가 나중에 움직여도(그 위의 점을 드래그해도)
                  // 이 교점이 매 render()마다 새 위치로 따라온다.
                  this.addPoint(ip.x,ip.y,{locked:true, trackHistory:true, computed:{kind:'intersection', o1:o1.id, o2:o2.id}});
                }
              });
            }
            this.pendingObjs=[];
          }
        }
        break;
      }
      case 'midpoint': {
        if(this.pending.length===0){ const so=this.findSegLike(pt,TOUCH_TOL);   // 선분(다각형의 변)을 누르면 바로 그 중점을 찍는다(2026-10-21)
          if(so && (so.type==='segment') && !this.findPointNear(pt,TOUCH_TOL)){ const A=this.resolvePoint(so.p1), B=this.resolvePoint(so.p2); if(A&&B){ const m=mid(A,B); if(!this.findPointNear(m,6)) this.addPoint(m.x,m.y,{locked:true, trackHistory:true}); } break; } }
        const p=this.pickPoint(pt); this.pending.push(p.id);
        if(this.pending.length>=2){
          const [aId,bId]=this.pending; this.pending=[];
          if(aId!==bId){
            const A=this.resolvePoint(aId), B=this.resolvePoint(bId);
            if(A&&B){
              const m=mid(A,B);
              if(!this.findPointNear(m,6)) this.addPoint(m.x,m.y,{locked:true, trackHistory:true});
            }
          }
        }
        break;
      }
      case 'perp': {
        // 1단계: 수선이 지나갈 점을 먼저 클릭한다(기존 점 또는 새 점).
        if(this.pending.length===0){
          const p=this.pickPoint(pt);
          this.pending.push(p.id);
          break;
        }
        // 2단계: 그 점을 지나고, 클릭한 직선류(직선/선분/반직선)에 수직인 선을 그린다.
        // 주의: 그 점이 클릭한 직선/선분의 끝점(꼭짓점)이어도 수선을 그릴 수 있어야 한다
        // (예: 선분 AB에서 점 A를 지나는 수선). 예전에는 pId!==o.p1 && pId!==o.p2 조건 때문에
        // 이 경우가 막혀 있었다.
        const pId=this.pending[0]; this.pending=[];
        const o=this.findSegLike(pt,TOUCH_TOL);
        if(o && (o.type==='line'||o.type==='segment'||o.type==='ray')){
          this.addObject({type:'perp', p:pId, refP1:o.p1, refP2:o.p2});
        }
        break;
      }
      case 'lengthTool': {
        if(this.pending.length===0){
          const segObj=this.findSegLike(pt,TOUCH_TOL);
          if(segObj && (segObj.type==='segment'||segObj.type==='line')){
            this.addObject({type:'lengthLabel', p1:segObj.p1, p2:segObj.p2});
            break;
          }
        }
        const p=this.pickPoint(pt); this.pending.push(p.id);
        if(this.pending.length>=2){ const [a,b]=this.pending; this.addObject({type:'lengthLabel',p1:a,p2:b}); this.pending=[]; }
        break;
      }
      case 'angleTool': {
        const p=this.pickPoint(pt); this.pending.push(p.id);
        if(this.pending.length>=3){ const [a,b,c]=this.pending; this.addObject({type:'angleLabel',a,b,c}); this.pending=[]; }
        break;
      }
      case 'angleInput': {
        const p=this.pickPoint(pt); this.pending.push(p.id);
        if(this.pending.length>=2){
          const [bId,aId]=this.pending; this.pending=[];
          const val=window.prompt('꼭짓점 → 팔 순서로 두 점을 선택했어요.\n각의 크기를 입력하세요 (도, 0~360):','60');
          if(val!==null){
            const deg=parseFloat(val);
            if(!isNaN(deg)){
              const B=this.resolvePoint(bId), A=this.resolvePoint(aId);
              if(B&&A){
                const dir=norm(sub(A,B)), rad=deg*Math.PI/180, len=dist(A,B)||100;
                const rot={x:dir.x*Math.cos(rad)-dir.y*Math.sin(rad), y:dir.x*Math.sin(rad)+dir.y*Math.cos(rad)};
                const C=this.addPoint(B.x+rot.x*len, B.y+rot.y*len, {});
                this.addObject({type:'angleLabel', a:aId, b:bId, c:C.id});
              }
            }
          }
        }
        break;
      }
    }
    this.render();
  }
  render(){
    this._recomputeComputedPoints();
    const NS='http://www.w3.org/2000/svg';
    while(this.svg.firstChild) this.svg.removeChild(this.svg.firstChild);
    // grid
    const g0=document.createElementNS(NS,'g');
    for(let x=0;x<=this.width;x+=GRID){
      const l=document.createElementNS(NS,'line');
      l.setAttribute('x1',x); l.setAttribute('y1',0); l.setAttribute('x2',x); l.setAttribute('y2',this.height);
      l.setAttribute('stroke','#f0f0f0'); g0.appendChild(l);
    }
    for(let y=0;y<=this.height;y+=GRID){
      const l=document.createElementNS(NS,'line');
      l.setAttribute('x1',0); l.setAttribute('y1',y); l.setAttribute('x2',this.width); l.setAttribute('y2',y);
      l.setAttribute('stroke','#f0f0f0'); g0.appendChild(l);
    }
    this.svg.appendChild(g0);

    const extend=(origin,dir,len=1000)=>({x1:origin.x-dir.x*len,y1:origin.y-dir.y*len,x2:origin.x+dir.x*len,y2:origin.y+dir.y*len});
    const mkLine=(x1,y1,x2,y2,color,dash)=>{
      const l=document.createElementNS(NS,'line');
      l.setAttribute('x1',x1);l.setAttribute('y1',y1);l.setAttribute('x2',x2);l.setAttribute('y2',y2);
      l.setAttribute('stroke',color); l.setAttribute('stroke-width',2);
      if(dash) l.setAttribute('stroke-dasharray',dash);
      this.svg.appendChild(l);
    };

    this.objects.forEach(o=>{
      const g=this.getObjGeom(o);
      if(!g || Object.values(g).some(v=>Array.isArray(v)? v.some(x=>!x) : !v)) return;
      if(o.type==='line'){ const e=extend(g.p1,norm(sub(g.p2,g.p1))); mkLine(e.x1,e.y1,e.x2,e.y2,'#1565c0'); }
      else if(o.type==='segment'){ mkLine(g.p1.x,g.p1.y,g.p2.x,g.p2.y,'#1565c0'); }
      else if(o.type==='perpBisector'){
        const M=mid(g.p1,g.p2), d=perp(norm(sub(g.p2,g.p1))); const e=extend(M,d);
        mkLine(e.x1,e.y1,e.x2,e.y2,'#6a1b9a');
      }
      else if(o.type==='angleBisector'){
        const d=bisectorDir(g.a,g.b,g.c);
        mkLine(g.b.x,g.b.y,g.b.x+d.x*500,g.b.y+d.y*500,'#e65100');
      }
      else if(o.type==='perp'){
        const d=perp(norm(sub(g.refP2,g.refP1))); const e=extend(g.p,d);
        mkLine(e.x1,e.y1,e.x2,e.y2,'#00838f');
      }
      else if(o.type==='circleCP'||o.type==='circleCR'){
        const c=this.asCircle(o);
        const el=document.createElementNS(NS,'circle');
        el.setAttribute('cx',c.center.x); el.setAttribute('cy',c.center.y); el.setAttribute('r',Math.max(c.r,0.1));
        el.setAttribute('stroke','#2e7d32'); el.setAttribute('fill','none'); el.setAttribute('stroke-width',2);
        this.svg.appendChild(el);
      }
      else if(o.type==='polygon'){
        const pts=g.pts.map(p=>`${p.x},${p.y}`).join(' ');
        const el=document.createElementNS(NS,'polygon');
        el.setAttribute('points',pts); el.setAttribute('fill','#1565c0'); el.setAttribute('fill-opacity','0.12');
        el.setAttribute('stroke','#1565c0'); el.setAttribute('stroke-width','2');
        this.svg.appendChild(el);
      }
      else if(o.type==='lengthLabel'){
        mkLine(g.p1.x,g.p1.y,g.p2.x,g.p2.y,'#999','3,3');
        const m=mid(g.p1,g.p2);
        const t=document.createElementNS(NS,'text');
        t.setAttribute('x',m.x); t.setAttribute('y',m.y-8); t.setAttribute('fill','#c62828');
        t.setAttribute('font-size','14'); t.setAttribute('font-weight','bold'); t.setAttribute('text-anchor','middle');
        t.textContent=(dist(g.p1,g.p2)/GRID).toFixed(2);
        this.svg.appendChild(t);
      }
      else if(o.type==='angleLabel'){
        const info=arcInfo(g.b,g.a,g.c,28);
        const path=document.createElementNS(NS,'path');
        path.setAttribute('d',info.path); path.setAttribute('stroke','#c62828'); path.setAttribute('fill','none'); path.setAttribute('stroke-width','2');
        this.svg.appendChild(path);
        const t=document.createElementNS(NS,'text');
        t.setAttribute('x',info.mid.x); t.setAttribute('y',info.mid.y); t.setAttribute('fill','#c62828');
        t.setAttribute('font-size','13'); t.setAttribute('font-weight','bold'); t.setAttribute('text-anchor','middle');
        t.textContent=info.deg.toFixed(1)+'°';
        this.svg.appendChild(t);
      }
    });

    // pending highlight
    [...this.pending].forEach(id=>{
      const p=this.resolvePoint(id); if(!p) return;
      const c=document.createElementNS(NS,'circle');
      c.setAttribute('cx',p.x); c.setAttribute('cy',p.y); c.setAttribute('r',10);
      c.setAttribute('fill','none'); c.setAttribute('stroke','#fbc02d'); c.setAttribute('stroke-width','3');
      this.svg.appendChild(c);
    });

    // points
    this.points.forEach(p=>{
      const c=document.createElementNS(NS,'circle');
      c.setAttribute('cx',p.x); c.setAttribute('cy',p.y); c.setAttribute('r',5);
      c.setAttribute('fill', p.locked ? '#212121' : '#0277bd');
      c.setAttribute('stroke','#fff'); c.setAttribute('stroke-width','1.5');
      this.svg.appendChild(c);
      const t=document.createElementNS(NS,'text');
      t.setAttribute('x',p.x+9); t.setAttribute('y',p.y-8);
      t.setAttribute('font-size','14'); t.setAttribute('font-weight','bold'); t.setAttribute('fill','#222');
      t.textContent=p.label;
      this.svg.appendChild(t);
    });

    this.onChange(this);
  }
}
/* 저장된 도형 스냅샷(objectSnapshots/{taskId})을 캔버스에 다시 그려 넣는다.
   좌표(x,y)와 점-도형 연결 관계만 복원하고, 제약조건/계산점 메타데이터나 되돌리기 기록까지는
   복원하지 않는다 — 그 정도만으로도 "다시 접속했더니 그려둔 도형이 사라졌다"는 문제는 해결된다.
   (제출완료로 잠긴 과제는 캔버스가 pointer-events:none이라 어차피 읽기전용으로만 보인다.) */
function restoreObjectSnapshot(cv, snapshot){
  if(!cv || !snapshot) return;
  const remap = {};
  (snapshot.points||[]).forEach(sp=>{
    let target = cv.points.find(p=>p.label===sp.label);
    if(target){ target.x=sp.x; target.y=sp.y; }
    else { target = cv.addPoint(sp.x, sp.y, {label:sp.label}); }
    remap[sp.id] = target.id;
  });
  const keys=['p1','p2','center','through','r1','r2','a','b','c','p','refP1','refP2'];
  (snapshot.objects||[]).forEach(so=>{
    const obj = {type:so.type};
    keys.forEach(k=>{ if(so[k]!=null) obj[k] = (remap[so[k]]!==undefined) ? remap[so[k]] : so[k]; });
    if(so.ids) obj.ids = so.ids.map(id=> remap[id]!==undefined ? remap[id] : id);
    cv.addObject(obj);
  });
  cv.render();
}

/* ---------- 과제 정의 ---------- */
function snapshotOf(cv){ return { points: cv.points.map(p=>({id:p.id, x:Math.round(p.x), y:Math.round(p.y), label:p.label})), objects: cv.objects.filter(o=>!o.locked).map(o=>{ const s={id:o.id,type:o.type}; ['p1','p2','center','through','r1','r2','a','b','c','p','refP1','refP2'].forEach(k=>{ if(o[k]!=null) s[k]=o[k]; }); if(o.ids) s.ids=o.ids; return s; }) }; }
return { GeoCanvas, TOOL_META, restoreObjectSnapshot, snapshotOf };
})();
window.GEO = GEO;
