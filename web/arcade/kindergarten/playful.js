// Third shelf: represent quantities, orient objects, assemble parts and repeat sounds.
export const PLAYFUL_ACTIVITIES={
 counting:{name:'点数小果园',theme:'green',symbol:'quantity-3',voice:'counting'},
 spatial:{name:'小熊躲猫猫',theme:'blue',symbol:'bear-inside',voice:'spatial'},
 mirror:{name:'对称小工坊',theme:'peach',symbol:'whole-butterfly',voice:'mirror'},
 weather:{name:'晴雨小衣橱',theme:'blue',symbol:'umbrella',voice:'weather'},
 puzzle:{name:'拼画小画家',theme:'green',symbol:'picture-boat',voice:'puzzle'},
 rhythm:{name:'声音小乐队',theme:'peach',symbol:'drum',voice:'rhythm'}
};
const task=(mode,types,extra={})=>({mode,types,targets:types.map((type,i)=>({id:'place-'+i,type})),...extra});
const quantities=values=>task('counting',values.map(n=>'quantity-'+n),{cues:values.map(n=>'dots-'+n)});
const positions=values=>task('spatial',values.map(()=>'teddy'),{ordered:true,hideAnswer:true,positions:values,cues:values.map(p=>'bear-'+p)});
const mirrors=values=>task('mirror',values.map(s=>'mirror-right-'+s),{cues:values.map(s=>'mirror-left-'+s)});
const clothes=(types,cues)=>{
 const result=task('weather',types,{cues});
 result.targets.forEach((t,i)=>{t.accepts=types.filter((_,j)=>cues[j]===cues[i]);});return result;
};
export const PICTURE_GRIDS={boat:[2,1],house:[3,1],fish:[2,2]};
const picture=name=>task('puzzle',Array.from({length:PICTURE_GRIDS[name][0]*PICTURE_GRIDS[name][1]},(_,i)=>'puzzle-'+name+'-'+i),{picture:name,grid:PICTURE_GRIDS[name],hideAnswer:true});
export const PLAYFUL_LESSONS={
 counting:[quantities([1,2]),quantities([1,3,4]),quantities([2,3,4,5])],
 spatial:[positions(['above','inside']),positions(['below','left','right']),positions(['inside','right','above','left','below'])],
 mirror:[mirrors(['leaf','flower']),mirrors(['flower','butterfly','leaf']),mirrors(['kite','leaf','butterfly','flower'])],
 weather:[clothes(['sunhat','umbrella'],['sun','rain']),clothes(['scarf','umbrella','sunhat'],['snow','rain','sun']),clothes(['umbrella','boots','sunhat','scarf'],['rain','rain','sun','snow'])],
 puzzle:[picture('boat'),picture('house'),picture('fish')],
 rhythm:[task('rhythm',['drum','bell'],{ordered:true,reusable:true}),task('rhythm',['drum','drum','bell'],{ordered:true,reusable:true}),task('rhythm',['bell','drum','chime','bell'],{ordered:true,reusable:true})]
};
export const PLAYFUL_NAMES={drum:'小鼓',bell:'铃铛',chime:'木琴',umbrella:'雨伞',sunhat:'遮阳帽',scarf:'围巾',boots:'雨靴',rain:'下雨',snow:'下雪',
 ...Object.fromEntries([1,2,3,4,5].flatMap(n=>[['quantity-'+n,n+'个苹果的果篮'],['dots-'+n,n+'个点的图卡']])),
 ...Object.fromEntries(Object.entries({above:'上面',below:'下面',inside:'里面',left:'左边',right:'右边'}).map(([key,label])=>['bear-'+key,'小熊在箱子'+label])),
 ...Object.fromEntries(Object.entries({leaf:'叶子',flower:'花朵',butterfly:'蝴蝶',kite:'风筝'}).flatMap(([key,label])=>[['whole-'+key,label],['mirror-left-'+key,label+'的左半边'],['mirror-right-'+key,label+'的右半边']])),
 ...Object.fromEntries(Object.entries(PICTURE_GRIDS).flatMap(([name,[cols,rows]])=>[['picture-'+name,({boat:'小帆船',house:'小房子',fish:'小鱼'})[name]],...Array.from({length:cols*rows},(_,i)=>['puzzle-'+name+'-'+i,'画片 '+(i+1)])]))
};
export const SOUND_NOTES={drum:[150,.16,'triangle',75],bell:[880,.38,'sine',660],chime:[523,.26,'sine',523]};
