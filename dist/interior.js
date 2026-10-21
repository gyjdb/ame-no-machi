// Interior refinement, in the original shop shell. Measurements are in miniature-world units.
export function populateInterior(h){
 const {THREE,world,box,mesh,cyl,tube,rod,panel,groundPanel,label,item,toon,lightMaterial,white,metal,dark,teal,cream,glass,warmLight,coolLight}=h;
 const FLOOR=.389,fixtures=[],products=[],shelfChecks=[];
 const C=['#c8796b','#d6b56c','#729cac','#82a68e','#ded9c4','#bda988','#a38ba2','#96adac'];
 let seed=93017;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const fixture=(name,x,z,w,d)=>fixtures.push({name,x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2});
 const boxes=new THREE.BoxGeometry(1,1,1);boxes.translate(0,.5,0);
 const cylinder=new THREE.CylinderGeometry(.5,.5,1,10);cylinder.translate(0,.5,0);
 const bowl=new THREE.CylinderGeometry(.5,.37,1,12);bowl.translate(0,.5,0);
 const sphere=new THREE.SphereGeometry(.5,10,7);sphere.translate(0,.5,0);
 const bottle=new THREE.LatheGeometry([[0,0],[.37,0],[.46,.035],[.47,.62],[.40,.76],[.20,.83],[.19,1],[0,1]].map(p=>new THREE.Vector2(...p)),12);
 const pouch=new THREE.LatheGeometry([[0,0],[.36,0],[.49,.15],[.52,.58],[.40,.90],[.34,1],[0,1]].map(p=>new THREE.Vector2(...p)),8);
 function prism(points){const s=new THREE.Shape();points.forEach((p,i)=>i?s.lineTo(...p):s.moveTo(...p));s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:1,bevelEnabled:false});g.translate(0,0,-.5);return g;}
 const triangle=prism([[-.5,0],[.5,0],[0,1]]);
 const carton=prism([[-.5,0],[.5,0],[.5,.80],[0,1],[-.5,.80]]);
 const primitives={box:boxes,cylinder,bowl,sphere,bottle,pouch,triangle,carton};
 const groups=new Map();
 function part(kind,x,bottom,z,w,height,d,color,angle=0){
  const key=kind+color;if(!groups.has(key))groups.set(key,{geometry:primitives[kind],material:toon(color,.16),instances:[]});
  groups.get(key).instances.push({x,y:bottom,z,w,h:height,d,angle});
 }
 function packageMark(x,bottom,z,w,height,d,color,angle=0){
  const off=d*.51;
  part('box',x+Math.sin(angle)*off,bottom+height*.38,z+Math.cos(angle)*off,w*.58,height*.26,.003,'#eee5cb',angle);
  part('box',x+Math.sin(angle)*(off+.002),bottom+height*.48,z+Math.cos(angle)*(off+.002),w*.37,.008,.002,color,angle);
 }
 function product(kind,x,bottom,z,color,angle=0,scale=1){
  let w=.099,height=.19,d=.066;
  if(kind==='bottle'||kind==='tea'){w=.075;height=kind==='tea'?.225:.205;d=w;
   part('bottle',x,bottom,z,w,height,d,color,angle);
   part('cylinder',x,bottom+height*.92,z,w*.44,.023,w*.44,'#e9e6d1');
   part('cylinder',x,bottom+height*.30,z,w*1.01,height*.29,w*1.01,'#d9debc');
   packageMark(x,bottom,z,w,height,d,color,angle);
  }else if(kind==='milk'){
   w=.092;height=.235;d=.077;part('carton',x,bottom,z,w,height,d,'#e5e2cf',angle);
   part('box',x,bottom+height*.73,z,w*.84,.034,d*.9,color,angle);packageMark(x,bottom,z,w,height,d,color,angle);
  }else if(kind==='chips'){
   w=.112;height=.19+rand()*.029;d=.074;part('pouch',x,bottom,z,w,height,d,color,angle);
   part('box',x,bottom+height-.006,z,w*.69,.009,d*.46,'#ddceaf',angle);packageMark(x,bottom,z,w,height,d,'#7a6c52',angle);
  }else if(kind==='noodles'){
   w=.108;height=.095;d=w;part('bowl',x,bottom,z,w,height,d,color);part('cylinder',x,bottom+height,z,w*1.03,.009,d*1.03,'#e6d9ba');packageMark(x,bottom,z,w,height,d,color,angle);
  }else if(kind==='bread'){
   w=.137;height=.071;d=.083;part('sphere',x,bottom,z,w,height,d,'#bf9767',angle);
   part('box',x,bottom+.018,z,.032,.055,d*.89,'#e6d9b9',angle);
  }else if(kind==='can'){
   w=.069;height=.131;d=w;part('cylinder',x,bottom,z,w,height,d,color);part('cylinder',x,bottom+height,z,w*.93,.005,d*.93,'#b0bdb7');packageMark(x,bottom,z,w,height,d,color,angle);
  }else if(kind==='bento'){
   w=.155;height=.052;d=.12;part('box',x,bottom,z,w,.017,d,'#4b5a57',angle);
   part('box',x-.033,bottom+.017,z,.072,.024,.10,'#e9e2c7');
   part('sphere',x+.036,bottom+.017,z-.03,.044,.024,.037,'#b48650');
   part('sphere',x+.036,bottom+.017,z+.031,.039,.030,.034,'#83a375');
   part('box',x,bottom+.043,z,w*.95,.004,.022,'#c6cdb7');
  }else if(kind==='rice'||kind==='sandwich'){
   w=.109;height=.115;d=.059;part('triangle',x,bottom,z,w,height,d,'#e9e2c9',angle);
   if(kind==='rice')part('box',x,bottom,z+d*.49,w*.36,height*.44,.009,'#455853',angle);
   else {part('triangle',x,bottom+.012,z+d*.51,w*.69,height*.72,.003,'#c9b16d',angle);part('triangle',x,bottom+.014,z+d*.54,w*.44,height*.45,.003,'#91aa79',angle);}
  }else if(kind==='dessert'){
   w=.086;height=.081;d=w;part('bowl',x,bottom,z,w,height,d,'#e7ddc1');part('sphere',x,bottom+height,z,w*.92,.038,d*.92,color);
  }else if(kind==='toiletry'){
   w=.086;height=.196;d=.065;part('bottle',x,bottom,z,w,height,d,'#d7e1d6');part('box',x,bottom+height,z,w*.48,.018,d*.55,color);packageMark(x,bottom,z,w,height,d,color,angle);
  }else{
   w=kind==='candy'?.067:.087;height=kind==='candy'?.114:.183;d=.048;
   part('box',x,bottom,z,w,height,d,color,angle);packageMark(x,bottom,z,w,height,d,'#858979',angle);
   part('box',x,bottom+height-.012,z,w*.95,.011,d*.94,'#d6d2b8',angle);
  }
  products.push({kind,x,z,bottom,top:bottom+height,w,d});return {w,height,d};
 }
 const labelCache=new Map();
 function ticket(text='¥138',color='#507567',bg='#efe4c8'){
  const key=text+color+bg;if(!labelCache.has(key))labelCache.set(key,label(text,3.6,1,{font:164,color,bg}));return labelCache.get(key);
 }
 function price(x,y,z,text='¥138',rotation=0,w=.135){panel(x,y,z,w,.041,ticket(text),rotation);}
 function sign(x,y,z,w,text){panel(x,y,z,w,.13,label(text,w/.13,1,{font:Math.min(155,720*.13/w),color:'#52796a',bg:'#e8dfc0'}));}

 // Three real hollow refrigerator bays. There is no solid body in front of the contents.
 function refrigerator(x,kind,title){
  const width=1.60,z=-4.44,depth=.60;fixture('refrigerator-'+kind,x,z,width,depth);
  box(x,.446,z,width,.112,depth,white);
  box(x,1.60,z-.277,width,2.40,.045,toon('#a9c2b4',.12));
  for(let dx of[-width/2+.025,width/2-.025])box(x+dx,1.60,z,.045,2.40,depth,white);
  box(x,2.83,z,width,.095,depth,white);
  box(x,2.69,z+.305,width-.035,.183,.035,coolLight,world,false);
  sign(x,2.69,z+.328,width-.09,title);
  for(let dx of[-.728,.728])box(x+dx,1.62,z+.235,.018,1.96,.018,coolLight,world,false);
  const surfaces=[.574,.973,1.372,1.771,2.17];
  surfaces.forEach((y,row)=>{
   box(x,y-.014,z+.015,width-.09,.027,depth-.11,white,world,false);
   box(x,y-.014,z+.275,width-.09,.053,.025,cream,world,false);
   const food=kind==='food',cols=food?9:12,pitch=(width-.16)/cols;
   for(let col=0;col<cols;col++)for(let back=0;back<2;back++){
    if(rand()<.025&&back===1)continue;
    let pKind=food?['bento','rice','sandwich','dessert','bento'][row]:kind==='milk'?(row%2?'milk':'tea'):(row===0?'can':'bottle');
    const px=x-(width-.16)/2+pitch*(col+.5),pz=z+(food?-.067:.003)+back*.16;
    const p=product(pKind,px,y,pz,C[(col+row*2)%C.length]);
    shelfChecks.push({kind:pKind,bottom:y,support:y,top:y+p.height,ceiling:row===4?2.575:surfaces[row+1]-.028});
   }
   for(let i=0;i<6;i++)price(x-.62+i*.247,y-.009,z+.293,kind==='food'?'¥298':'¥148');
  });
  for(let dx of[-.40,.40]){
   panel(x+dx,1.56,z+.317,.751,2.083,glass);
   box(x+dx+.304,1.52,z+.344,.023,.55,.030,metal,world,false);
  }
  box(x,1.56,z+.329,.035,2.12,.04,metal,world,false);
 }
 refrigerator(-3.85,'drink','ドリンク');refrigerator(-2.20,'milk','ミルク・お茶');refrigerator(-.55,'food','お弁当・サンド');

 // Low window row, medium snack row, then the taller pantry row: three separate aisles.
 function gondola(name,z,tiers,category){
  const x=-2.90,width=3.10,depth=.58;fixture(name,x,z,width,depth);
  box(x,.446,z,width,.114,depth,cream);
  box(x,tiers[tiers.length-1]/2+.20,z,width-.04,tiers[tiers.length-1]-.38,.030,cream,world,false);
  for(let dx of[-width/2+.029,width/2-.029])box(x+dx,(tiers.at(-1)+.39)/2,z,.031,tiers.at(-1)-.39,.55,metal,world,false);
  tiers.forEach((y,row)=>{
   box(x,y-.015,z,width,.030,depth,white,world,false);
   for(let side of[-1,1]){
    box(x,y-.015,z+side*.292,width,.046,.018,cream,world,false);
    for(let col=0;col<20;col++)for(let behind=0;behind<2;behind++){
     if(behind===1&&rand()<.065)continue;
     const kind=category[(row+Math.floor(col/7))%category.length];
     const px=x-width/2+.107+col*.1517,pz=z+side*(.102+behind*.123);
     const p=product(kind,px,y,pz,C[(Math.floor(col/4)+row)%C.length],side<0?Math.PI:0);
     shelfChecks.push({kind,bottom:y,support:y,top:y+p.height,ceiling:row===tiers.length-1?y+.32:tiers[row+1]-.031});
    }
    for(let i=0;i<10;i++)price(x-1.40+i*.310,y-.012,z+side*.306,i%4===1?'¥108':'¥158',side<0?Math.PI:0);
   }
  });
  // Small category pennants attach directly to the backboard.
  for(let dx of[-1.04,.0,1.04]){
   rod([x+dx,tiers.at(-1),z],[x+dx,tiers.at(-1)+.32,z],.007,metal);
   panel(x+dx,tiers.at(-1)+.32,z+.02,.57,.105,label(['新商品','お菓子','毎日の品'][Math.round(dx+1)],5.43,1,{font:138,bg:'#dedfc2',color:'#57796b'}));
  }
 }
 gondola('front-gondola',-.29,[.53,.85,1.17],['bread','candy','chips']);
 gondola('middle-gondola',-1.65,[.53,.86,1.19,1.52],['chips','noodles','candy']);
 gondola('rear-gondola',-3.01,[.53,.9,1.27,1.64],['toiletry','bottle','pantry']);
 // Filled open chilled display in the front window, below the sightline into the aisles.
 fixture('window-chilled-case',-.56,-.15,1.10,.65);
 box(-.56,.438,-.15,1.10,.096,.65,white);
 for(let x of[-1.09,-.03])box(x,.814,-.15,.036,.78,.65,white,world,false);
 box(-.56,.82,-.452,1.09,.80,.035,toon('#94b4a5',.15));
 [.536,.817,1.098].forEach((y,row)=>{
  box(-.56,y-.018,-.15,1.03,.036,.58,white,world,false);
  for(let col=0;col<8;col++)for(let depth=0;depth<3;depth++){
   if(rand()<.028)continue;
   product(['dessert','sandwich','rice'][row],-1.015+col*.132,y,-.36+depth*.183,C[col%8]);
  }
  for(let col=0;col<5;col++)price(-.99+col*.213,y-.010,.162,row===0?'¥198':'¥138');
 });
 panel(-.56,.88,.184,1.00,.60,new THREE.MeshBasicMaterial({color:'#c8e6d4',transparent:true,opacity:.035,depthWrite:false,side:THREE.DoubleSide}));
 sign(-.56,1.292,-.432,.99,'おにぎり・スイーツ');
 rod([-1.05,1.205,-.432],[-1.05,1.34,-.432],.007,metal);rod([-.07,1.205,-.432],[-.07,1.34,-.432],.007,metal);

 // Magazines, a seasonal stand and bottle endcaps all remain inside the glazing.
 fixture('magazine-rack',-3.98,.41,1.06,.24);
 box(-3.98,.445,.41,1.06,.112,.24,metal);
 box(-3.98,.945,.31,1.06,1.00,.022,cream,world,false);
 for(let row=0;row<3;row++){
  const y=.58+row*.265;box(-3.98,y-.023,.426,1.04,.035,.23,metal,world,false);
  for(let i=0;i<6;i++){
   const x=-4.425+i*.177,col=C[(i+row*2)%8];
   box(x,y+.107,.44,.158,.216,.026,toon(col,.16),world,false);
   panel(x,y+.157,.456,.126,.052,ticket(['旅','暮らし','COFFEE','週刊','本','食'][i]));
   part('box',x,y+.04,.457,.12,.035,.003,'#e2dec4');
  }
 }
 sign(-3.98,1.435,.326,1.04,'雑誌・BOOKS');
 fixture('seasonal-promotion',-2.29,.40,.48,.22);
 box(-2.29,.449,.40,.48,.12,.22,toon('#c0b394'));
 for(let y of[.55,.82,1.09]){
  box(-2.29,y-.016,.4,.48,.030,.23,white,world,false);
  for(let i=0;i<3;i++)product(y>.9?'chips':'bread',-2.45+i*.16,y,.405,C[i+1]);
 }
 sign(-2.29,1.40,.32,.50,'秋の新作');rod([-2.29,1.11,.32],[-2.29,1.455,.32],.010,metal);
 for(const z of[-1.65,-3.01]){
  fixture('shelf-endcap-'+z,-1.11,z,.30,.54);
  box(-1.11,.443,z,.30,.108,.54,cream);
  for(let y of[.52,.86,1.20]){
   box(-1.11,y-.014,z,.30,.028,.54,white,world,false);
   for(let col=0;col<2;col++)for(let d=0;d<4;d++)product(z===-1.65?'can':'bottle',-1.19+col*.15,y,z-.20+d*.132,C[(col+d)%8]);
   price(-1.11,y-.01,z+.285,'¥118',0,.19);
  }
 }
 // Freezer chest has an open well, a filled inner basket, two sliding lids and handles.
 fixture('ice-cream-freezer',.33,-3.18,.74,.60);
 box(.33,.439,-3.18,.74,.10,.60,white);
 for(let x of[-.02,.68])box(x,.741,-3.18,.038,.55,.60,white);
 for(let z of[-3.459,-2.901])box(.33,.741,z,.70,.55,.034,white,world,false);
 box(.33,.561,-3.18,.66,.025,.50,toon('#85a997',.1));
 for(let i=0;i<4;i++)for(let j=0;j<4;j++)product('dessert',.08+i*.16,.574,-3.38+j*.13,C[(i+j)%8]);
 for(let x of[.145,.515]){groundPanel(x,1.026,-3.18,.327,.49,glass);box(x,1.04,-3.01,.12,.025,.025,metal,world,false);}
 panel(.33,.82,-2.878,.65,.15,ticket('ICE CREAM'));

 // An L counter leaves a real staff working space and a clear path to the rear door.
 fixture('checkout-front',1.92,-.965,1.45,.69);
 fixture('checkout-return',1.385,-1.99,.38,1.35);
 fixture('appliance-bench',2.55,-2.095,.39,1.43);
 box(1.92,.891,-.965,1.45,1.004,.69,toon('#98b7a2',.12));
 box(1.92,1.428,-.965,1.49,.070,.73,toon('#eadbbc',.18));
 box(1.385,.891,-1.99,.38,1.004,1.35,toon('#98b7a2',.12));
 box(1.385,1.428,-1.99,.42,.070,1.39,toon('#eadbbc',.18));
 box(1.92,.921,-.610,1.31,.266,.018,teal,world,false);
 panel(1.92,.934,-.593,1.20,.165,label('こもれび マート',7.27,1,{font:103,color:'#e9e2c6',bg:'#528d7e'}));
 // POS, angled customer display, receipt printer, scanner window and tray.
 box(1.58,1.507,-.94,.38,.087,.29,dark);
 rod([1.58,1.55,-1.00],[1.58,1.79,-1.05],.024,metal);
 const screen=box(1.58,1.835,-1.044,.38,.258,.051,dark);screen.rotation.x=-.15;
 const display=panel(1.58,1.835,-1.012,.326,.20,label('¥  398',1.63,1,{font:230,color:'#c9e7c8',bg:'#426862'}));display.rotation.x=-.15;
 box(1.565,1.562,-.79,.32,.036,.151,dark);
 for(let i=0;i<5;i++)for(let j=0;j<3;j++)part('box',1.44+i*.059,1.581,-.84+j*.045,.041,.008,.03,'#aebfb1');
 box(1.91,1.498,-1.033,.18,.06,.23,metal);
 box(1.91,1.532,-1.033,.128,.008,.174,lightMaterial('#91c4ba',.70),world,false);
 box(1.83,1.539,-.81,.125,.149,.14,white);
 box(1.83,1.622,-.754,.097,.017,.076,'#ece5cc',world,false);
 box(1.54,1.479,-.65,.22,.027,.095,'#9baea2',world,false);
 // Small impulse purchases below the counter edge and a bag dispenser on its left side.
 for(let row=0;row<2;row++){
  box(2.1,.83+row*.20,-.58,.80,.023,.075,cream,world,false);
  for(let i=0;i<9;i++)product('candy',1.754+i*.086,.843+row*.20,-.574,C[Math.floor(i/3)]);
 }
 box(1.22,1.16,-.85,.07,.32,.25,metal);
 for(let i=0;i<6;i++)box(1.185,1.17,-.94+i*.033,.018,.27,.027,toon('#dcdcc7',.15),world,false);
 rod([1.17,1.29,-.98],[1.17,1.29,-.70],.009,metal);
 // Fried-food warmer: separate frame, open shelves, transparent panels and tiny food trays.
 box(2.28,1.493,-.963,.49,.06,.48,cream);
 for(let x of[2.05,2.51])for(let z of[-1.187,-.739])box(x,1.75,z,.015,.455,.015,metal,world,false);
 box(2.28,1.978,-.963,.51,.041,.50,cream);
 panel(2.28,1.75,-.73,.462,.416,glass);
 for(let y of[1.532,1.736]){
  box(2.28,y-.01,-.963,.445,.018,.408,'#a79775',world,false);
  for(let i=0;i<4;i++)for(let j=0;j<3;j++)part('sphere',2.116+i*.108,y,-1.105+j*.13,.085,.058,.079,['#bd945c','#b88757'][i%2]);
 }
 box(2.28,1.948,-.98,.413,.017,.038,warmLight,world,false);
 sign(2.28,2.06,-.99,.50,'あつあつ');
 // Divided oden well occupies the return, with chopsticks and a side label.
 box(1.385,1.508,-1.865,.304,.086,.472,metal);
 for(let i=0;i<2;i++)for(let j=0;j<3;j++){
  const x=1.317+i*.136,z=-2.015+j*.15;
  box(x,1.557,z,.126,.012,.137,'#97764a',world,false);
  part(j===1?'bowl':'sphere',x,1.565,z,.066,.035,.066,j===2?'#dec392':'#d3b98b');
 }
 panel(1.219,1.51,-1.865,.4,.095,ticket('おでん'),-Math.PI/2);
 cyl(1.385,1.54,-2.30,.063,.146,cream);
 for(let i=0;i<7;i++)rod([1.35+i*.011,1.52,-2.30],[1.35+i*.011,1.75,-2.30],.0035,metal);
 // Rear appliance bench, leaving 0.75 units of employee working width.
 box(2.55,.887,-2.095,.39,.996,1.43,toon('#b3c4b0',.12));
 box(2.55,1.414,-2.095,.42,.058,1.45,cream);
 // Coffee machine faces the employee aisle; mug rests directly on its drip tray.
 box(2.53,1.686,-2.54,.32,.486,.37,dark);
 box(2.354,1.55,-2.54,.037,.024,.29,metal,world,false);
 panel(2.362,1.803,-2.54,.24,.14,ticket('COFFEE','#d3e7bd','#3c645c'),-Math.PI/2);
 rod([2.365,1.69,-2.54],[2.317,1.69,-2.54],.015,metal);
 cyl(2.31,1.612,-2.54,.043,.095,white);
 // Hot-water urn, with fill lines, tap, and cup stack.
 cyl(2.53,1.619,-2.082,.104,.34,white);
 cyl(2.53,1.80,-2.082,.11,.025,dark);
 box(2.417,1.60,-2.082,.011,.18,.032,'#7dada6',world,false);
 rod([2.421,1.53,-2.082],[2.35,1.53,-2.082],.012,metal);
 box(2.31,1.448,-2.14,.19,.010,.20,metal,world,false);
 for(let i=0;i<4;i++)cyl(2.31,1.469+i*.019,-2.14,.035,.031,white);
 // Microwave with a dark window, panel and handle, on the front end of the bench.
 box(2.54,1.605,-1.591,.33,.32,.415,white);
 panel(2.359,1.60,-1.61,.29,.19,label('•••',1.526,1,{font:240,color:'#7d9b91',bg:'#3c5356'}),-Math.PI/2);
 box(2.35,1.607,-1.755,.028,.20,.018,metal,world,false);
 for(let i=0;i<3;i++)cyl(2.344,1.543+i*.06,-1.42,.010,.009,metal).rotation.z=Math.PI/2;
 // A little counter card; its feet sit on the countertop.
 box(1.37,1.469,-2.53,.255,.015,.11,metal,world,false);
 panel(1.37,1.60,-2.515,.23,.25,label('¥120',.92,1,{font:260,color:'#5c7062',bg:'#e9d8ae',sub:'COFFEE'}));
 // Back-of-house details occupy the recess to the left of the existing rear door.
 const doorY=FLOOR+2.35/2;
 box(1.98,doorY,-4.717,1.14,2.35,.072,toon('#89a29b',.1));
 for(let x of[1.40,2.56])box(x,doorY,-4.66,.026,2.39,.033,metal,world,false);
 box(1.98,2.758,-4.66,1.19,.032,.033,metal,world,false);
 panel(1.98,2.13,-4.671,.73,.19,ticket('STAFF ONLY'));
 box(2.36,1.42,-4.648,.026,.22,.035,metal);
 fixture('staff-locker',.84,-4.575,.43,.32);
 box(.84,1.049,-4.575,.43,1.32,.32,toon('#b2bdac',.11));
 for(let y of[.72,1.38]){
  box(.84,y,-4.40,.39,.60,.018,cream,world,false);
  box(.976,y,-4.38,.018,.11,.016,metal,world,false);
  for(let i=0;i<3;i++)box(.84,y+.15+i*.039,-4.38,.24,.009,.012,metal,world,false);
 }
 fixture('restocking-cart',.89,-3.985,.39,.37);
 for(let x of[.73,1.05])for(let z of[-4.12,-3.85]){
  const wheel=cyl(x,.449,z,.046,.022,dark);wheel.rotation.z=Math.PI/2;
 }
 box(.89,.51,-3.985,.39,.026,.37,metal);
 tube([[.72,.55,-4.14],[.72,1.10,-4.14],[1.06,1.10,-4.14],[1.06,.55,-4.14]],.012,metal);
 box(.87,.66,-3.974,.31,.274,.29,toon('#b9a27c',.10));
 box(.885,.866,-3.988,.27,.13,.255,toon('#c8b188',.10));
 for(let y of[.792,.936])box(.88,y,-3.99,.046,.007,.26,'#d3c299',world,false);
 panel(.87,.67,-3.823,.22,.093,ticket('食品'));
 panel(.88,2.17,-4.757,.46,.44,label('入荷予定',1.05,1,{font:164,bg:'#e2d9b8',color:'#6b8171',sub:'9 / 28'}));
 const clock=cyl(1.97,3.035,-4.682,.211,.035,'#ede5c5',world,32);clock.rotation.x=Math.PI/2;
 rod([1.97,3.035,-4.66],[1.97,3.169,-4.66],.009,dark);rod([1.97,3.035,-4.657],[2.085,2.991,-4.657],.010,dark);

 // Empty shopping baskets are nested; their hollow walls and handles remain visible.
 function shoppingBasket(x,y,z,w=.41,d=.32){
  box(x,y+.015,z,w,.03,d,teal,world,false);
  for(let xx of[x-w/2,x+w/2]){
   for(let yy of[y+.053,y+.111,y+.17])rod([xx,yy,z-d/2],[xx,yy,z+d/2],.006,teal);
   for(let zz=z-d/2;zz<z+d/2+.005;zz+=d/5)rod([xx,y+.02,zz],[xx,y+.188,zz],.006,teal);
  }
  for(let zz of[z-d/2,z+d/2]){
   for(let yy of[y+.053,y+.111,y+.17])rod([x-w/2,yy,zz],[x+w/2,yy,zz],.006,teal);
   for(let xx=x-w/2;xx<x+w/2+.005;xx+=w/6)rod([xx,y+.02,zz],[xx,y+.188,zz],.006,teal);
  }
  tube([[x-w/2,y+.188,z],[x-w/2,y+.252,z],[x+w/2,y+.252,z],[x+w/2,y+.188,z]],.009,metal);
 }
 fixture('shopping-basket-stack',2.43,.25,.46,.38);
 box(2.43,.416,.25,.46,.054,.38,metal);
 for(let i=0;i<4;i++)shoppingBasket(2.43,.443+i*.068,.25,.36+i*.022,.27+i*.018);
 // Discreet queue marks occupy the main aisle, rather than competing with the entrance.
 for(let z of[-.26,-1.18]){
  groundPanel(.58,.397,z,.39,.14,label('お待ちください',2.79,1,{font:120,bg:null,color:'#8a967e'}));
  box(.58,.397,z-.14,.40,.007,.034,'#b8a276',world,false);
 }
 groundPanel(.58,.397,-2.19,.30,.47,label('↑ レジ',.64,1,{font:280,bg:null,color:'#8d9b82'}));
 // Continuous rows of warm-white ceiling fixtures carry the eye into the shop.
 const fluorescent=lightMaterial('#fff0cf',1.28);
 for(let z of[-3.55,-2.09,-.64])for(let x of[-3.35,-1.29,1.13]){
  box(x,3.464,z,1.47,.055,.245,cream,world,false);
  box(x,3.429,z,1.40,.018,.187,fluorescent,world,false);
  for(let dx of[-.48,.48])rod([x+dx,3.491,z],[x+dx,3.81,z],.008,metal);
 }
 const backFill=new THREE.PointLight('#ffe2b1',5,5,2);backFill.position.set(-.8,2.72,-3.69);world.add(backFill);
 for(const [x,text]of[[-3.57,'おいしい、毎日。'],[-1.37,'夜も、あなたのそばに。']]){
  panel(x,3.11,-4.755,1.79,.28,label(text,6.4,1,{font:113,color:'#527e6c',bg:'#e5d8b0'}));
 }
 // Door-side information and one modest exterior A-frame leave the whole opening clear.
 panel(2.34,2.73,.807,.59,.20,label('24H OPEN',2.95,1,{font:180,color:'#e4e4c2',bg:'#548d7c'}));
 const promo=new THREE.Group();promo.position.set(-2.06,.205,1.22);world.add(promo);
 for(let x of[-.19,.19]){
  rod([x,0,-.17],[x,.70,0],.017,metal,promo);rod([x,0,.17],[x,.70,0],.017,metal,promo);
 }
 box(0,.45,.032,.40,.49,.025,cream,promo);
 panel(0,.47,.054,.33,.39,label('新発売',.85,1,{font:190,bg:'#e4d1a6',color:'#677c67',sub:'KOMOREBI'}),0,promo);

 const matrix=new THREE.Object3D();let primitiveCount=0;
 for(const {geometry,material,instances}of groups.values()){
  const inst=new THREE.InstancedMesh(geometry,material,instances.length);inst.castShadow=true;inst.receiveShadow=true;
  instances.forEach((p,i)=>{matrix.position.set(p.x,p.y,p.z);matrix.scale.set(p.w,p.h,p.d);matrix.rotation.set(0,p.angle,0);matrix.updateMatrix();inst.setMatrixAt(i,matrix.matrix);});
  world.add(inst);primitiveCount+=instances.length;
 }
 return {fixtures,products,shelfChecks,primitiveCount,steam:{x:1.385,y:1.60,z:-1.865},mainAisle:{x0:.10,x1:1.18,z0:-2.77,z1:.71},staffPassage:{x0:1.43,x1:2.55,z0:-4.58,z1:-2.85}};
}
