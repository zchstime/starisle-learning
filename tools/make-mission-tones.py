"""Original listening stimuli; no recorded third-party music."""
import math, wave, struct
from pathlib import Path
RATE=22050
# frequency, seconds, gain; zero frequency = a clearly separated pause
scores=[[(330,.45,.45),(0,.35,0),(660,.45,.45)],[(130,.12,.5),(0,.38,0)]*4,[(262,.45,.4),(330,.45,.4),(392,.45,.4)],[(440,.5,.55),(0,.4,0),(440,.5,.16)],[(130,.12,.45),(0,.55,0)]*4+[(0,.7,0)]+[(130,.12,.45),(0,.20,0)]*4,[(262,.3,.4),(330,.3,.4),(392,.3,.4),(0,.7,0),(392,.3,.4),(330,.3,.4),(262,.3,.4),(0,.7,0),(262,.3,.4),(330,.3,.4),(392,.3,.4)]]
for grade,score in enumerate(scores,1):
 frames=[]
 for freq,seconds,gain in score:
  n=int(seconds*RATE)
  for i in range(n):
   envelope=min(1,i/(RATE*.015),(n-i)/(RATE*.04))
   value=math.sin(2*math.pi*freq*i/RATE)*gain*max(0,envelope)
   frames.append(struct.pack('<h',int(value*32767)))
 path=Path(f'assets/resources/voice/tone_mission_g{grade}.wav')
 with wave.open(str(path),'wb') as w:
  w.setnchannels(1);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(b''.join(frames))
 print(path)
