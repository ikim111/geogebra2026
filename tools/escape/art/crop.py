import sys
from PIL import Image
import numpy as np
def crop(path,names):
    im=Image.open(path).convert('RGB');a=np.asarray(im).astype(int);h,w,_=a.shape
    white=(a.min(axis=2)>235)
    def cut(prof,n):  # 가운데 근처 흰 줄 찾기
        c=n//2;best=None
        for d in range(0,n//6):
            for x in (c-d,c+d):
                if prof[x]>0.9: return x
        return c
    cx=cut(white.mean(axis=0),w);cy=cut(white.mean(axis=1),h)
    boxes=[(0,0,cx,cy),(cx,0,w,cy),(0,cy,cx,h),(cx,cy,w,h)]
    for (x0,y0,x1,y1),n in zip(boxes,names):
        t=im.crop((x0,y0,x1,y1));ta=np.asarray(t).min(axis=2)>235
        rows=np.where(ta.mean(axis=1)<0.9)[0];cols=np.where(ta.mean(axis=0)<0.9)[0]
        t=t.crop((cols[0],rows[0],cols[-1]+1,rows[-1]+1))
        s=min(t.size);t=t.crop(((t.width-s)//2,(t.height-s)//2,(t.width-s)//2+s,(t.height-s)//2+s))
        t.save(f'a{n}.jpg',quality=92);print(n,t.size)
crop(sys.argv[1],sys.argv[2].split(','))
