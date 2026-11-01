import re
src=open('/tmp/claude-0/escape/print/build.py',encoding='utf-8').read()
ns={};exec(src.split('def front')[0],ns);cards,DIS=ns['cards'],ns['DIS']
main=[c for c in cards if not c[0].startswith('연습') and c[0]!='규칙']
typ={c[0]:c[1] for c in main}
def shows(c):  # 카드에 보이는 번호 (vis chips + hidden)
    return re.findall(r'<span><b>(\w+)</b>',c[4])+re.findall(r'class="hid"[^>]*>(\d+)<',c[4])
SH={c[0]:shows(c) for c in main}
solve={'52':'35','94':'58','44':'4','73':'29','3':'43','6':'86'}
traps={'47','63','85','69'}
alive={'시작'};seen={'시작'};log=[];gone=set()
def disc(k):
    d=DIS.get(k,'')
    if d and d[0].isdigit():
        for x in d.split(','): x=x.strip();alive.discard(x);gone.add(x)
changed=True
while changed:
    changed=False
    for k in list(alive):
        for v in SH.get(k,[]):
            if v not in seen: seen.add(v);alive.add(v);changed=True;log.append(f'{k} 보기 {v}');disc(v)
        if k in solve and solve[k] not in seen:
            v=solve[k];seen.add(v);alive.add(v);changed=True;log.append(f'{k} 풀기 → {v}');disc(v)
    R=[k for k in alive if typ.get(k)=='red'];B=[k for k in alive if typ.get(k)=='blue']
    for r in R:
        for b in B:
            s=str(int(r)+int(b))
            if s in typ and s not in seen and s not in traps:
                seen.add(s);alive.add(s);changed=True;log.append(f'{r}+{b} → {s}');disc(s)
print('도달',len(seen-traps),'/',len(typ)-len(traps),'엔딩',('99' in seen))
print('못 간 카드',[k for k in typ if k not in seen and k not in traps])
# 함정이 실제로 걸릴 수 있는 순간이 있는지 (두 카드가 동시에 살아 있던 적)
print('조합 기록:',[l for l in log if '+' in l])
