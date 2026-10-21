import * as THREE from 'three';
import { populateInterior } from './interior.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

await document.fonts.load('700 32px Komorebi').catch(()=>{});

// 雨の街 — a small, entirely geometric world. No external textures or UI.
const scene = new THREE.Scene();
scene.background = new THREE.Color('#131d2d');
scene.fog = new THREE.FogExp2('#172238', 0.016);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.16;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);
renderer.domElement.setAttribute('aria-label', '雨夜便利店三维微缩场景。拖拽旋转，滚轮或双指缩放，方向键旋转。');
renderer.domElement.tabIndex = 0;
const camera = new THREE.PerspectiveCamera(36, innerWidth / innerHeight, 0.1, 240);
const initialDirection = new THREE.Vector3(11.8, 9.1, 16.7).normalize();
const target = new THREE.Vector3(0, 1.9, 0);
function fitDistance() { return Math.max(26.5, 32 / Math.max(0.3, camera.aspect)); }
camera.position.copy(initialDirection.clone().multiplyScalar(fitDistance()).add(target));
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(target);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.rotateSpeed = 0.6;
controls.zoomSpeed = 0.8;
controls.enablePan = false;
controls.minDistance = 10;
controls.maxDistance = Math.max(60,fitDistance()*1.5);
controls.minPolarAngle = 0.22;
controls.maxPolarAngle = Math.PI / 2 - 0.065;
controls.update();
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.34, 0.52, 1.08);
composer.addPass(bloom);
composer.addPass(new OutputPass());

let seed = 71425;
const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const range = (a,b) => a + (b-a)*rand();
const palette = ['#f4bd76','#d86260','#78ad99','#efdaaa','#69a6bb','#c689b0','#a7bb66','#f1e7c8'];
const world = new THREE.Group(); scene.add(world);
const gradient = new THREE.DataTexture(new Uint8Array([80,145,206,255]), 4, 1, THREE.RedFormat);
gradient.minFilter = gradient.magFilter = THREE.NearestFilter; gradient.needsUpdate = true;
const mats = new Map();
function toon(color, glow = 0) {
  const key=color+':'+glow;
  if (!mats.has(key)) mats.set(key, new THREE.MeshToonMaterial({color, gradientMap:gradient, emissive:color, emissiveIntensity:glow}));
  return mats.get(key);
}
const ink = new THREE.LineBasicMaterial({color:'#142131',transparent:true,opacity:0.74});
const softInk = new THREE.LineBasicMaterial({color:'#253647',transparent:true,opacity:0.36});
const white = toon('#ebe2c8',0.12), metal = toon('#6d8c96'), dark = toon('#243948');
const teal = toon('#4c9b92'), cream = toon('#d7cdb2'), pink = toon('#d57e86');
const glass = new THREE.MeshBasicMaterial({color:'#a9e0db', transparent:true, opacity:0.085, side:THREE.DoubleSide, depthWrite:false});
const roofGroup = new THREE.Group(); world.add(roofGroup);
const roofMaterials = new Set();
const unitBox = new THREE.BoxGeometry(1,1,1);
const unitEdges = new THREE.EdgesGeometry(unitBox);
function outline(mesh, subtle=false) {
  const edge = new THREE.LineSegments(mesh.geometry === unitBox ? unitEdges : new THREE.EdgesGeometry(mesh.geometry,25), subtle?softInk:ink);
  mesh.add(edge); return mesh;
}
function mesh(geo, material, x,y,z, parent=world, outlined=false) {
  const m = new THREE.Mesh(geo,material); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; parent.add(m);
  if(outlined) outline(m); return m;
}
function box(x,y,z,w,h,d,material,parent=world,outlined=true) {
  const m=mesh(unitBox,typeof material==='string'?toon(material):material,x,y,z,parent,outlined);
  m.scale.set(w,h,d); return m;
}
function cyl(x,y,z,r,h,material,parent=world,n=12) {
  return mesh(new THREE.CylinderGeometry(r,r,h,n),typeof material==='string'?toon(material):material,x,y,z,parent,true);
}
function tube(points,r,material,parent=world,segments=24) {
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  return mesh(new THREE.TubeGeometry(curve,segments,r,6,false),typeof material==='string'?toon(material):material,0,0,0,parent);
}
function rod(a,b,r,material,parent=world) {
  const av=new THREE.Vector3(...a), bv=new THREE.Vector3(...b), diff=bv.clone().sub(av);
  const m=mesh(new THREE.CylinderGeometry(r,r,diff.length(),8),typeof material==='string'?toon(material):material,...av.clone().add(bv).multiplyScalar(.5).toArray(),parent);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),diff.normalize()); return m;
}
function lightMaterial(color, strength=1.6) {
  const c=new THREE.Color(color).multiplyScalar(strength);
  return new THREE.MeshBasicMaterial({color:c,toneMapped:false});
}
const warmLight=lightMaterial('#ffe8b0',1.6), coolLight=lightMaterial('#b6f4e8',1.35);
function label(text,w,h,{bg='#efe9cb',color='#265955',font=72,weight=700,sub='',border=false}={}) {
  const canvas=document.createElement('canvas'); canvas.width=1024; canvas.height=Math.round(1024*h/w);
  const ctx=canvas.getContext('2d');
  if(bg) {ctx.fillStyle=bg;ctx.fillRect(0,0,canvas.width,canvas.height);}
  if(border){ctx.strokeStyle=color;ctx.lineWidth=10;ctx.strokeRect(14,14,canvas.width-28,canvas.height-28);}
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;
  ctx.font=`${weight} ${font}px "Komorebi","Noto Sans CJK JP","Noto Sans",sans-serif`;
  ctx.fillText(text,512,canvas.height*(sub?.42:.51),960);
  if(sub){ctx.font='500 32px "Komorebi","Noto Sans CJK JP",sans-serif';ctx.fillText(sub,512,canvas.height*.78,930);}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  return new THREE.MeshBasicMaterial({map:texture,transparent:!bg,side:THREE.DoubleSide,toneMapped:false});
}
function panel(x,y,z,w,h,material,rotation=0,parent=world) {
  const p=mesh(new THREE.PlaneGeometry(w,h),material,x,y,z,parent);p.rotation.y=rotation;p.castShadow=false;return p;
}
function groundPanel(x,y,z,w,d,material,rotation=0,parent=world) {
  const p=mesh(new THREE.PlaneGeometry(w,d),material,x,y,z,parent);p.rotation.x=-Math.PI/2;p.rotation.z=rotation;p.castShadow=false;return p;
}
// Batch the tiny products, pavers and fittings to keep the miniature fluid to orbit.
const batches = new Map();
function item(x,y,z,w,h,d,color,rotation=0,parent=world) {
  const key=color + (parent===world?'':'-'+parent.uuid);
  if(!batches.has(key)) batches.set(key,{color,parent,transforms:[]});
  batches.get(key).transforms.push({x,y,z,w,h,d,rotation});
}

scene.add(new THREE.HemisphereLight('#b2c7ed','#514e68',1.55));
scene.add(new THREE.AmbientLight('#8facc7',0.25));
const moon=new THREE.DirectionalLight('#b3d2ff',2.2);moon.position.set(-6,15,10);moon.castShadow=true;
moon.shadow.mapSize.set(2048,2048);moon.shadow.camera.left=-12;moon.shadow.camera.right=12;moon.shadow.camera.top=12;moon.shadow.camera.bottom=-12;moon.shadow.normalBias=.025;moon.shadow.bias=-.0001;moon.shadow.radius=3;scene.add(moon);
function point(color,intensity,x,y,z,distance=8) {
  const l=new THREE.PointLight(color,intensity,distance,2);l.position.set(x,y,z);world.add(l);return l;
}
point('#ffd59a',28,-2.8,2.7,-1.5,9);
point('#ffe4b6',23,1.6,2.5,-2.7,8);
point('#5cf9dd',9,-1,3.55,1.5,7);

// A complete square plinth, with a chamfered sidewalk and an L-shaped street.
box(0,-.35,0,14,.66,14,toon('#35485b'));
box(0,-.66,0,13.82,.13,13.82,toon('#1c2b3e'));
box(0,-.007,0,13.99,.035,13.99,toon('#25364c'),world,false);
const sidewalkShape=new THREE.Shape();sidewalkShape.moveTo(-6.8,-6.8);sidewalkShape.lineTo(4.45,-6.8);sidewalkShape.lineTo(4.45,-1.40);sidewalkShape.lineTo(4.12,-1.40);sidewalkShape.lineTo(4.12,-.14);sidewalkShape.lineTo(4.45,-.14);sidewalkShape.lineTo(4.45,1.5);sidewalkShape.quadraticCurveTo(4.45,2.0,3.95,2.0);sidewalkShape.lineTo(-6.8,2.0);sidewalkShape.closePath();
const pavementGeo=new THREE.ExtrudeGeometry(sidewalkShape,{depth:.17,bevelEnabled:false});pavementGeo.rotateX(Math.PI/2);
mesh(pavementGeo,toon('#687d89'),0,.19,0,world,true);
// Fine paving seams, damp curb stones and the narrow service alley.
for(let x=-6.55;x<4.1;x+=.65) for(let z=-6.5;z<1.95;z+=.68){
  if(x> -5.05 && x<3.02 && z<.9 && z>-5.05)continue;
  if(x+.314>4.12&&z+.328> -1.40&&z-.328<-.14)continue;
  item(x,.197,z,.628,.012,.655,rand()>.45?'#6a7d87':'#647a87');
}
for(let x=-6.45;x<4.01;x+=.46)box(x,.205,2.02,.445,.22,.24,rand()>.7?'#8d9aa0':'#7c919c',world,false);
for(let z=-6.7;z<1.69;z+=.46){if(z> -1.53&&z<-.05)continue;box(4.43,.205,z,.24,.22,.445,'#7c919c',world,false);}
for(let i=0;i<8;i++)box(-5.75+i*.12,.22,1.42,.055,.015,.36,'#c8aa63',world,false);
for(let z=.9;z<1.92;z+=.17)box(.92,.22,z,1.22,.015,.08,'#bca36b',world,false);
// A single, compact crossing over the right-hand branch of the existing L street.
// Pedestrians move east-west; vehicle travel runs north-south. Both ends meet pavement.
const crosswalk={x0:4.60,x1:6.39,z0:-1.31,z1:-.23};
box(6.70,.092,-4.125,.59,.184,5.45,toon('#6d818d'));
box(6.70,.092,.78,.59,.184,1.84,toon('#6d818d'));
box(6.95,.102,-.77,.09,.204,1.26,toon('#6d818d'));
for(let z=-6.68;z<1.6;z+=.47){
 if(z> -1.63&&z<.12)continue;
 box(6.72,.196,z,.48,.02,.449,'#718691',world,false);
 box(6.40,.135,z,.10,.22,.45,'#88999e',world,false);
}
// Curb ramps connect to the two landings without raised kerbs across the pedestrian path.
function curbRamp(x0,x1,z0,z1,reverse=false){
 const low=.027,high=.206;const ya=reverse?low:high,yb=reverse?high:low;
 const vertices=new Float32Array([x0,ya,z0,x1,yb,z0,x1,yb,z1,x0,ya,z0,x1,yb,z1,x0,ya,z1]);
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(vertices,3));geo.computeVertexNormals();
 const m=mesh(geo,toon('#87999d'),0,0,0,world);m.material=m.material.clone();m.material.side=THREE.DoubleSide;
}
box(3.816,.197,-.77,.607,.012,1.26,'#6a7d87',world,false);
curbRamp(4.12,4.57,-1.40,-.14);curbRamp(6.40,6.91,-1.40,-.14,true);
for(let i=0;i<4;i++)box(4.80+i*.427,.031,-.77,.267,.014,1.08,'#bcc9c8',world,false);
// Short stop line on the approach, clear of the crossing and junction turn.
box(5.56,.031,.28,1.35,.014,.095,'#aebfc0',world,false);
for(let z of[-6.1,-4.9,-3.7,-2.5])box(6.28,.031,z,.035,.014,.62,'#8eaaaE',world,false);
for(let x=-6.5;x<3.9;x+=1.65)box(x,.03,5.0,.87,.014,.065,'#859aa8',world,false);
for(let x of[4.15,6.72])for(let dx of[-.068,.068])for(let z=-1.19;z<-.29;z+=.15)
 item(x+dx,(x<5?(x+dx<4.12?.203:.206-(x+dx-4.12)/.45*.179):.027+(x+dx-6.40)/.51*.179)+.0065,z,.040,.013,.040,'#bdaf7c');
// Water follows the gutter and skips the lowered crossing entrance.
for(const z of[-1.82,.24])drain(4.72,z,Math.PI/2);
// Two compact parking bays, with wheel stops.
for(let x of [-5.45,-3.15]){
 box(x-1.02,.035,3.44,.035,.01,2.12,'#b5c4c9',world,false);
 box(x,.035,4.49,2.07,.01,.035,'#b5c4c9',world,false);
 box(x,.09,2.57,1.05,.12,.18,'#8195a0');
 groundPanel(x,.045,3.1,.38,.48,label(x===-5.45?'1':'2',1,1,{bg:null,color:'#b5c4c9',font:720}));
}
box(-2.12,.035,3.44,.035,.01,2.12,'#b5c4c9',world,false);
function drain(x,z,rot=0){
 const g=new THREE.Group();g.position.set(x,.045,z);g.rotation.y=rot;world.add(g);
 box(0,0,0,.82,.04,.30,'#25353f',g);
 for(let i=0;i<9;i++)box(-.35+i*.087,.025,0,.025,.018,.24,'#708b93',g,false);
}
drain(-1.05,2.23);drain(3.6,2.25);drain(4.67,-3.6,Math.PI/2);
const manhole=cyl(-1.3,.039,5.88,.43,.026,'#3e5669',world,36);
for(let x=-.24;x<=.24;x+=.12)for(let z=-.24;z<=.24;z+=.12)item(-1.3+x,.057,5.88+z,.07,.007,.018,'#627b8c');

// Warm shop shell: broad, unobstructed glazing on two sides.
box(-1,.275,-2.1,7.8,.18,5.6,white);
box(-1,1.98,-4.86,7.8,3.25,.16,toon('#c9c5b0',.12));
box(-4.86,1.98,-2.1,.16,3.25,5.6,toon('#b5b8ae'));
box(2.87,1.98,-4.33,.16,3.25,1.21,toon('#b5b8ae'));
// Individual floor tiles with very fine grout.
for(let x=-4.54;x<2.72;x+=.51)for(let z=-4.52;z<.6;z+=.51)item(x,.376,z,.496,.022,.496,rand()>.6?'#e2d6b8':'#e9ddc0');
for(const x of [-4.83,-2.33,-.36,1.84,2.86])box(x,1.92,.76,.09,3.12,.12,metal);
box(-1,.5,.77,7.84,.19,.14,metal);
box(-1,3.48,.77,7.94,.20,.18,cream);
for(const [x,w] of [[-3.58,2.4],[-1.345,1.87],[2.34,.91]]){
 panel(x,1.99,.783,w,2.77,glass);
 box(x,.90,.801,w,.06,.022,teal,world,false);
 box(x,1.0,.80,w,.025,.022,white,world,false);
}
for(let z of [-3.69,-1.52,.73])box(2.89,1.94,z,.12,3.12,.1,metal);
for(const [z,d]of[[-2.60,2.06],[-.40,2.12]]){
 panel(2.899,1.96,z,d,2.78,glass,Math.PI/2);
 box(2.92,.90,z,.022,.06,d,teal,world,false);
}
box(2.89,.5,-1.49,.14,.19,4.48,metal);
// Automatic sliding door; doors move into the fixed glass on either side.
const doorLeft=new THREE.Group(),doorRight=new THREE.Group();world.add(doorLeft,doorRight);
function door(group,x){
 group.position.set(x,0,.907);
 panel(0,1.91,0,1.02,2.82,glass,0,group);
 for(let dx of[-.51,.51])box(dx,1.91,0,.042,2.86,.058,metal,group);
 for(let y of[.5,3.32])box(0,y,0,1.02,.045,.058,metal,group);
 box(0,.92,.02,1.02,.065,.022,teal,group,false);
 box(.36,1.63,.044,.027,.48,.038,white,group,false);
 panel(0,1.46,.039,.48,.15,label('自動ドア',3.2,1,{font:185,bg:'#e7ddbe',color:'#60716d'}),0,group);
}
door(doorLeft,.20);door(doorRight,1.27);
box(.74,3.39,.89,.3,.10,.11,dark);
box(.74,.292,.84,2.15,.194,.24,'#8b9795');
box(.74,.399,.897,2.13,.016,.14,'#707e80',world,false);
for(let z of[.878,.919])box(.74,.410,z,2.16,.010,.009,metal,world,false);
box(.74,3.402,.934,2.2,.047,.065,metal);
box(-.533,1.91,.012,.042,2.82,.025,dark,doorRight,false);
box(.74,.22,1.25,2.03,.032,.64,'#355553');
groundPanel(.74,.24,1.25,1.62,.35,label('いらっしゃいませ',5,1,{bg:null,color:'#c1d1b0',font:118}));

const interior=populateInterior({THREE,world,box,mesh,cyl,tube,rod,panel,groundPanel,label,item,toon,lightMaterial,white,metal,dark,teal,cream,glass,warmLight,coolLight});

// The store's mint-and-cream fascia wraps around the glazed corner.
box(-1,3.71,.83,8.22,.59,.39,toon('#306f6b',.15));
box(-1,3.71,1.033,8.06,.43,.02,lightMaterial('#cde9c7',1.15),world,false);
const mainSign=panel(-1,3.72,1.05,6.1,.37,label('こもれび マート',16.5,1,{font:53,color:'#266d64',bg:'#e9f0ce',sub:''}));
box(-1,3.46,1.04,8.2,.085,.04,teal,world,false);
box(-1,4.01,.84,8.31,.10,.54,metal);
box(3.03,3.71,-2.04,.37,.59,5.71,toon('#306f6b',.15));
box(3.225,3.71,-2.04,.021,.43,5.53,lightMaterial('#d6e7c5',1.05),world,false);
panel(3.241,3.72,-1.75,3.53,.37,label('KOMOREBI',9.5,1,{font:97,color:'#337767',bg:'#e9f0ce'}),Math.PI/2);
box(3.25,3.46,-2.04,.04,.085,5.70,teal,world,false);
// Slim rain canopy: pane divisions, translucent panels and drainage lip.
box(-1,3.32,1.07,8.08,.075,.71,teal);
for(let i=0;i<10;i++)box(-4.64+i*.79,3.354,1.16,.75,.026,.80,toon('#739f9f',.08),world,false);
box(-1,3.315,1.59,8.1,.085,.08,metal);
box(-1,3.275,1.22,7.40,.035,.045,warmLight,world,false);
box(3.05,3.32,-1.38,.65,.075,4.50,teal);
// Shallow removable-looking roof slab, detailed as a collectible model.
for(let [x,y,z,w,h,d,c]of[
 [-1,3.91,-2.11,8.05,.16,5.67,'#617b87'],[-1,4.025,-2.11,7.77,.07,5.4,'#6e8790'],
 [-1,4.11,-4.89,8.1,.25,.13,'#73909a'],[-4.99,4.11,-2.1,.13,.25,5.61,'#73909a'],
 [2.98,4.11,-2.1,.13,.25,5.61,'#73909a']]){
 const m=toon(c).clone();m.transparent=true;roofMaterials.add(m);box(x,y,z,w,h,d,m,roofGroup);
}
for(let x=-4.55;x<2.8;x+=.50)box(x,4.063,-2.1,.017,.007,5.28,'#536d7c',roofGroup,false);
// Rooftop vent and external AC units enrich the reverse viewing angle.
function aircon(x,y,z,parent=world,rotation=0){
 const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=rotation;parent.add(g);
 box(0,0,0,1.17,.71,.52,cream,g);
 const fan=cyl(-.22,0,.282,.24,.029,dark,g,24);fan.rotation.x=Math.PI/2;
 for(let i=0;i<5;i++){
  const spoke=box(-.22,0,.308,.36,.027,.015,metal,g,false);spoke.rotation.z=i*Math.PI/5;
 }
 for(let j=0;j<7;j++)box(.34,-.25+j*.08,.272,.25,.018,.025,metal,g,false);
 box(-.4,-.40,0,.13,.13,.43,dark,g);box(.4,-.40,0,.13,.13,.43,dark,g);
 return g;
}
aircon(-3.35,4.52,-3.67,roofGroup);aircon(-1.98,4.52,-3.67,roofGroup);
cyl(.67,4.21,-3.69,.16,.28,metal,roofGroup);box(.67,4.38,-3.69,.43,.07,.43,metal,roofGroup);
aircon(3.47,.668,-4.08,world,Math.PI/2);
tube([[3.11,1.04,-4.65],[3.5,1.04,-4.65],[3.5,.60,-4.55]],.046,cream);
// Gutter downpipes and back service fittings.
for(const x of[-4.96,2.95])tube([[x,3.47,1.42],[x,3.47,1.68],[x,.54,1.68],[x,.23,1.89]],.045,metal);
box(-2.4,1.72,-4.976,.83,1.06,.16,dark);
for(let y=1.34;y<2.2;y+=.13)box(-2.4,y,-5.065,.73,.025,.016,metal,world,false);
box(-.90,1.14,-4.987,.57,.82,.12,metal);
tube([[-.90,.72,-5.03],[-.90,.41,-5.13],[2.83,.41,-5.13],[2.83,.52,-4.95]],.025,metal);

// Two vending machines tuck into the left-hand pocket of the sidewalk.
function vending(x,z,color,caption){
 const g=new THREE.Group();g.position.set(x,0,z);world.add(g);
 box(0,1.49,0,1.13,2.56,.88,color,g);
 box(0,2.78,0,1.15,.07,.93,metal,g);
 box(-.09,1.93,.46,.85,1.21,.055,lightMaterial('#e1edd7',1.12),g,false);
 box(0,.62,.46,.82,.25,.045,dark,g);
 box(0,.67,.49,.62,.055,.045,metal,g,false);
 panel(0,2.55,.457,.91,.23,label(caption,4,1,{font:128,bg:'#eff0da',color:'#487e73'}),0,g);
 for(let row=0;row<3;row++)for(let col=0;col<5;col++){
  const dx=-.41+col*.159, y=1.54+row*.32;
  cyl(dx,y,.513,.047,.19,toon(palette[(row*2+col)%8],.18),g,10);
  item(x+dx,y+.006,z+.565,.067,.06,.012,'#efe4cc');
  cyl(dx,y+.111,.513,.026,.031,white,g,8);
  box(dx,y-.14,.51,.085,.025,.015,teal,g,false);
 }
 box(.443,1.41,.49,.15,.49,.038,'#294c52',g);
 box(.444,1.52,.516,.075,.033,.01,warmLight,g,false);
 box(.443,1.35,.52,.08,.065,.028,metal,g,false);
 for(let i=0;i<7;i++)box(-.02,.94+i*.041,.451,.70,.012,.018,metal,g,false);
 box(-.37,.22,0,.15,.16,.65,dark,g);box(.37,.22,0,.15,.16,.65,dark,g);
 return g;
}
vending(-5.75,-.1,toon('#7da9a3'),'DRINKS');
vending(-5.75,-1.28,toon('#b77980'),'あったかい');
point('#98ecda',9,-5.77,1.54,.83,4);
// Recycling station beside the entrance.
for(let i=0;i<3;i++){
 const x=-3.83+i*.43;
 box(x,.70,1.18,.39,.99,.46,toon(i===1?'#769596':'#bec7b6'));
 box(x,1.21,1.18,.42,.065,.49,metal);
 const hole=cyl(x,1.04,1.424,.09,.012,dark,world,20);hole.rotation.x=Math.PI/2;
 panel(x,.73,1.418,.26,.19,label(['缶','PET','紙'][i],1.4,1,{font:300,color:'#487b70'}));
}
// Umbrella rack with folded umbrellas and curved handles; no figures.
const umbrellas=new THREE.Group();umbrellas.position.set(2.37,.22,1.30);world.add(umbrellas);
for(let x of[-.32,.32])for(let z of[-.14,.14])rod([x,.02,z],[x,.66,z],.018,metal,umbrellas);
box(0,.05,0,.74,.05,.39,metal,umbrellas);
for(let y of[.36,.65]){
 rod([-.34,y,-.17],[.34,y,-.17],.018,metal,umbrellas);rod([-.34,y,.17],[.34,y,.17],.018,metal,umbrellas);
 rod([-.34,y,-.17],[-.34,y,.17],.018,metal,umbrellas);rod([.34,y,-.17],[.34,y,.17],.018,metal,umbrellas);
}
for(let i=0;i<4;i++){
 const x=-.24+i*.16,z=i%2?.07:-.07;
 const umbrellaMaterial=i===1?new THREE.MeshBasicMaterial({color:'#d1e5df',transparent:true,opacity:.24,depthWrite:false,side:THREE.DoubleSide}):toon(['#617b9b','#e5d7c6','#a27085','#abc4bf'][i]);
 const fabric=mesh(new THREE.ConeGeometry(.067,.69,6),umbrellaMaterial,x,.57,z,umbrellas,true);fabric.rotation.z=.035*(i-2);
 if(i===1)for(let rib=0;rib<6;rib++){const a=rib*Math.PI/3;rod([x,.91,z],[x+Math.cos(a)*.056,.23,z+Math.sin(a)*.056],.0025,metal,umbrellas);}
 rod([x,.15,z],[x,1.11,z],.012,metal,umbrellas);
 tube([[x,1.10,z],[x,1.20,z],[x+.07,1.22,z],[x+.11,1.16,z],[x+.10,1.12,z]],.016,cream,umbrellas,12);
}
// Hand-lettered seasonal posters and a tiny neighborhood noticeboard.
function poster(x,y,z,text,bg,rotation=0,w=.60,h=.83){
 const m=label(text,w,h,{bg,color:'#3b6561',font:160,sub:'こもれび マート',border:true});return panel(x,y,z,w,h,m,rotation);
}
poster(-4.08,2.15,.803,'秋の新作','#ebce9c',0,.52,.73);
poster(-2.8,2.14,.803,'おむすび','#b9d3b6',0,.50,.68);
poster(2.926,2.05,-2.90,'挽きたて珈琲','#e9d8b5',Math.PI/2,.61,.85);
const board=new THREE.Group();board.position.set(3.48,0,-5.44);board.rotation.y=.23;world.add(board);
for(let x of[-.55,.55])box(x,1.14,0,.05,1.89,.06,dark,board);
box(0,1.60,0,1.31,1.18,.12,metal,board);
box(0,1.60,.067,1.20,1.07,.012,'#ad9e84',board,false);
panel(0,2.05,.082,1.10,.15,label('町内のお知らせ',7.2,1,{font:112}),0,board);
for(let i=0;i<4;i++){
 panel(-.32+(i%2)*.60,1.79-Math.floor(i/2)*.42,.082,.45,.34,label(['秋まつり','お知らせ','9 / 28','清掃の日'][i],1.4,1,{font:162,bg:['#dedac0','#bfcbb3','#cfbca5','#b4c2c7'][i]}),0,board);
}
box(0,2.24,-.01,1.5,.08,.38,teal,board);
// Bicycle with spoked wheels, mudguards, chain, basket, rack and kickstand.
function bicycle(x,z,angle){
 const g=new THREE.Group();g.position.set(x,.25,z);g.rotation.y=angle;world.add(g);
 const rubber=toon('#263844');
 for(let wx of[-.69,.69]){
  mesh(new THREE.TorusGeometry(.415,.040,10,40),rubber,wx,.45,0,g);
  mesh(new THREE.TorusGeometry(.36,.018,6,36),metal,wx,.45,0,g);
  cyl(wx,.45,0,.049,.15,metal,g,12).rotation.x=Math.PI/2;
  for(let j=0;j<12;j++){
   const a=j*Math.PI/6;rod([wx,.45,0],[wx+Math.cos(a)*.35,.45+Math.sin(a)*.35,0],.006,metal,g);
  }
  const guard=mesh(new THREE.TorusGeometry(.445,.022,6,24,Math.PI),cream,wx,.45,0,g);guard.rotation.z=0;
 }
 const frame=toon('#b88b73');
 for(const [a,b] of [
  [[-.69,.45,0],[-.10,.45,0]],[[-.10,.45,0],[-.30,1.02,0]],[[-.30,1.02,0],[-.69,.45,0]],
  [[-.30,1.02,0],[.40,1.07,0]],[[.40,1.07,0],[-.10,.45,0]],[[.40,1.07,0],[.69,.45,0]]
 ])rod(a,b,.027,frame,g);
 rod([-.30,1.00,0],[-.33,1.17,0],.024,metal,g);box(-.36,1.2,0,.36,.07,.22,dark,g);
 rod([.4,1.05,0],[.35,1.39,0],.024,metal,g);
 tube([[.35,1.39,-.29],[.30,1.38,-.14],[.35,1.39,.14],[.35,1.39,.29]],.023,metal,g,12);
 box(.32,1.39,-.26,.15,.048,.063,dark,g,false);box(.32,1.39,.26,.15,.048,.063,dark,g,false);
 mesh(new THREE.TorusGeometry(.13,.016,6,20),metal,-.10,.45,.074,g);
 rod([-.1,.45,-.17],[-.1,.45,.17],.017,metal,g);
 box(-.10,.44,.20,.19,.036,.11,dark,g);box(-.10,.46,-.20,.19,.036,.11,dark,g);
 tube([[-.69,.45,.07],[-.14,.59,.07],[.02,.45,.07],[-.15,.32,.07],[-.69,.45,.07]],.009,metal,g);
 box(-.72,.96,0,.60,.032,.27,metal,g);
 rod([-.9,.95,0],[-.69,.46,0],.012,metal,g);
 rod([-.45,.95,0],[-.69,.46,0],.012,metal,g);
 // Wire basket.
 box(.63,1.10,0,.38,.024,.41,metal,g);
 for(let a of[-.20,.20])rod([.45,1.1,a],[.41,1.44,a],.012,metal,g);
 for(let a of[-.20,.20])rod([.82,1.1,a],[.84,1.44,a],.012,metal,g);
 for(let y=1.18;y<1.46;y+=.09){
  rod([.42,y,-.21],[.84,y,-.21],.009,metal,g);rod([.42,y,.21],[.84,y,.21],.009,metal,g);
  rod([.84,y,-.21],[.84,y,.21],.009,metal,g);
 }
 for(let zz=-.17;zz<.21;zz+=.085)rod([.84,1.1,zz],[.84,1.44,zz],.007,metal,g);
 rod([-.05,.46,0],[.16,.01,.28],.014,metal,g);
 const headlamp=cyl(.80,1.00,.01,.054,.06,warmLight,g,14);headlamp.rotation.z=Math.PI/2;
 return g;
}
bicycle(3.61,-.87,Math.PI/2+.16);
// Small safety rails articulate the rounded street corner.
function railing(x,z,length,rotation=0){
 const g=new THREE.Group();g.position.set(x,.18,z);g.rotation.y=rotation;world.add(g);
 tube([[-length/2,.01,0],[-length/2,.62,0],[-length/2+.12,.76,0],[length/2-.12,.76,0],[length/2,.62,0],[length/2,.01,0]],.042,cream,g,24);
 rod([-length/2,.38,0],[length/2,.38,0],.027,cream,g);
 for(let dx of[-length/2,length/2])box(dx,.037,0,.19,.06,.18,metal,g);
 for(let dx of[-length*.33,length*.33])box(dx,.73,.044,.12,.10,.018,teal,g,false);
}
railing(3.1,1.89,1.14);railing(4.33,.74,1.52,Math.PI/2);railing(4.34,-2.06,1.28,Math.PI/2);
// A streetlamp pools warm light onto the wet crossing.
const lampX=5.18,lampZ=4.83;
box(lampX,.102,lampZ,.61,.204,.70,'#71868f');
cyl(lampX,.13,lampZ,.23,.23,dark);
cyl(lampX,2.46,lampZ,.075,4.75,metal);
tube([[lampX,4.66,lampZ],[lampX,5.04,lampZ],[lampX-.19,5.20,lampZ],[lampX-.66,5.20,lampZ]],.066,metal);
box(lampX-.72,5.14,lampZ,.72,.13,.38,dark);
box(lampX-.72,5.058,lampZ,.58,.026,.27,warmLight,world,false);
const lampLight=point('#ffce90',37,lampX-.65,4.90,lampZ,10);
// Small street-name and parking signs: all signage belongs to the miniature.
cyl(-1.65,1.68,1.85,.034,3.01,metal);
box(-1.65,2.86,1.85,.59,.61,.065,teal);
panel(-1.65,2.86,1.891,.54,.56,label('P',1,1,{bg:'#39766f',color:'#e1efcb',font:720}));
panel(-1.65,2.32,1.891,.59,.25,label('お客様専用',2.36,1,{bg:'#dfdec1',color:'#3f6660',font:164}));
cyl(4.15,1.76,1.61,.043,3.13,metal);
box(4.15,2.97,1.61,1.23,.26,.07,teal);
panel(4.15,2.97,1.653,1.18,.215,label('こもれび通り',5.5,1,{bg:'#2c655f',color:'#e5e7ce',font:135}));
// Utility poles with transformers, insulators, cable loops and gently sagging wires.
function pole(x,z,h,alongVerge=false){
 const previousParts=new Set(world.children);
 cyl(x,h/2,z,.115,h,toon('#7d898f'),world,14);
 for(let y of[.3,1.05,2.08])cyl(x,y,z,.131,.08,dark,world,12);
 for(let y=.7;y<1.42;y+=.15){
  const wrap=cyl(x,y,z,.121,.08,toon('#b4a067'),world,12);
 }
 box(x,h-.6,z,1.48,.11,.12,dark);
 for(let dx of[-.57,-.19,.19,.57]){
  rod([x+dx,h-.59,z],[x+dx,h-.20,z],.022,metal);
  for(let k=0;k<3;k++)cyl(x+dx,h-.24-k*.07,z,.064,.038,cream,world,10);
 }
 box(x+.19,h-1.35,z,.16,.84,.1,metal);
 cyl(x+.34,h-1.36,z,.23,.63,toon('#788a8d'),world,14);
 cyl(x+.34,h-1.02,z,.25,.05,metal,world,14);
 tube([[x+.34,h-1.08,z],[x+.34,h-.84,z],[x-.16,h-.84,z],[x-.17,h-.53,z]],.016,dark);
 tube([[x,h-1.72,z],[x-.27,h-2.00,z+.06],[x-.33,h-2.34,z+.06],[x-.09,h-2.49,z+.04],[x+.16,h-2.16,z+.04],[x,h-1.72,z]],.014,dark);
 for(let i=0;i<5;i++)rod([x-.12,2.6+i*.51,z],[x-.28,2.6+i*.51,z],.023,metal);
 if(alongVerge){
  const group=new THREE.Group();world.add(group);group.position.set(x,0,z);world.updateMatrixWorld(true);
  for(const o of [...world.children])if(o!==group&&!previousParts.has(o))group.attach(o);
  group.rotation.y=Math.PI/2;
 }
 return {x,z,h};
}
box(-6.14,.097,2.30,.34,.194,.31,'#7c919c');
const poleA=pole(-6.14,2.3,7.21),poleB=pole(6.70,-5.74,7.58,true);
for(let i=0;i<3;i++){
 const dx=[-.57,-.19,.57][i];
 tube([[poleA.x+dx,7.00,poleA.z],[-2.65+dx,6.19,-.13],[1.74+dx,6.47,-3.1],[poleB.x,7.37,poleB.z-dx]],.018,dark,world,60);
}
tube([[-6.14,5.44,2.3],[-6.14,4.8,-1.1],[-4.86,3.81,-3.77]],.023,dark,world,36);
panel(-6.141,2.45,2.438,.20,.79,label('こもれび二丁目',.25,1,{font:150,bg:'#dfdcc5',color:'#3e6a65'}));
// Far traffic light changes gently through a complete cycle.
cyl(6.70,2.40,-1.89,.058,4.41,metal);
rod([6.70,4.45,-1.89],[5.65,4.45,-1.89],.058,metal);
box(5.55,4.38,-1.89,.98,.40,.31,dark);
const signals=[];
for(let i=0;i<3;i++){
 const c=['#8ed8b1','#e7bd6a','#d47c78'][i];
 const mat=lightMaterial(c,.23);
 const led=cyl(5.26+i*.29,4.38,-1.715,.105,.028,mat,world,18);led.rotation.x=Math.PI/2;
 const hood=mesh(new THREE.CylinderGeometry(.127,.127,.17,16,1,true,0,Math.PI),dark,5.26+i*.29,4.38,-1.672);hood.rotation.x=Math.PI/2;
 signals.push({mat,color:new THREE.Color(c)});
}
// Small alley details: a crate, hose, pots, rooftop moss, and a road cone.
box(3.56,.43,-3.2,.57,.46,.51,toon('#758e83'));
for(let i=0;i<5;i++)box(3.865,.32+i*.061,-3.2,.018,.022,.43,cream,world,false);
const cone=mesh(new THREE.ConeGeometry(.17,.57,8),toon('#be7868'),3.91,.51,-5.89,world,true);
box(3.91,.226,-5.89,.43,.056,.43,dark);
cyl(3.91,.55,-5.89,.092,.095,white,world,8);
function plant(x,z,r=.21){
 mesh(new THREE.CylinderGeometry(r,r*.7,.35,9),toon('#90756b'),x,.37,z,world,true);
 cyl(x,.55,z,r*.88,.018,toon('#40574e'),world,9);
 for(let i=0;i<7;i++){
  const a=i*Math.PI*2/7;const leaf=mesh(new THREE.SphereGeometry(.15,7,5),toon(i%2?'#708f81':'#557f72'),x+Math.cos(a)*.11,.66+rand()*.10,z+Math.sin(a)*.11);
  leaf.scale.set(.6,1.55,.43);leaf.rotation.z=Math.cos(a)*.5;leaf.rotation.x=Math.sin(a)*.5;
 }
}
plant(-6.17,-2.08);plant(3.86,-6.14,.18);plant(-5.51,-5.65,.24);
for(let i=0;i<10;i++){
 const x=range(-4.7,2.8);box(x,4.069,-4.64,.12+rand()*.18,.017,.11,toon('#657f71'),roofGroup,false);
}
// Real planar reflections, gently broken up by animated surface ripples.
const reflectionShader={
 uniforms:{...THREE.UniformsUtils.clone(Reflector.ReflectorShader.uniforms),uTime:{value:0}},
 vertexShader:`uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vWorld;
 void main(){vUv=textureMatrix*vec4(position,1.);vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`uniform sampler2D tDiffuse; uniform float uTime; varying vec4 vUv; varying vec3 vWorld;
 void main(){
   if((vWorld.x<4.59 && vWorld.z<2.17)||(vWorld.x>6.39&&vWorld.z<1.70))discard;
   vec4 uv=vUv;
   float n=sin(vWorld.z*72.+sin(vWorld.x*11.)*2.+uTime*1.3)*.00085+sin(vWorld.x*19.+vWorld.z*37.-uTime*.8)*.0005;
   uv.x+=n*uv.w;uv.y+=sin(vWorld.z*44.+uTime)*.00028*uv.w;
   vec3 reflection=texture2DProj(tDiffuse,uv).rgb;
   float patches=sin(vWorld.x*1.93+sin(vWorld.z*2.13))*cos(vWorld.z*2.73+vWorld.x*.39);
   float puddles=.075+.245*smoothstep(-.35,.7,patches);
   float fragmented=.87+.13*sin(vWorld.z*121.+sin(vWorld.x*7.)+uTime*.6);puddles*=fragmented;
   gl_FragColor=vec4(reflection*.87,puddles);
 }`
};
const reflector=new Reflector(new THREE.PlaneGeometry(13.94,13.94),{textureWidth:768,textureHeight:768,clipBias:.002,shader:reflectionShader,multisample:0});
reflector.rotation.x=-Math.PI/2;reflector.position.y=.051;reflector.material.transparent=true;reflector.material.depthWrite=false;reflector.renderOrder=1;scene.add(reflector);
const reflectFrame=reflector.onBeforeRender;let frame=0;
reflector.onBeforeRender=function(...args){ if(frame%2===0)reflectFrame.apply(this,args); };
function glowPlane(x,z,w,d,color,opacity,y=.072){
 const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uColor:{value:new THREE.Color(color)},uOpacity:{value:opacity}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`varying vec2 vUv;uniform vec3 uColor;uniform float uOpacity;void main(){vec2 p=vUv*2.-1.;float a=exp(-dot(p,p)*3.9)*(1.-smoothstep(.6,1.,length(p)));gl_FragColor=vec4(uColor,a*uOpacity);}`});
 return groundPanel(x,y,z,w,d,mat);
}
glowPlane(-1.0,2.5,7.8,3.5,'#b5caa0',.16);
glowPlane(-.2,3.3,3.8,3.5,'#e1bc82',.16);
glowPlane(.3,1.65,4.3,2.15,'#eac385',.29,.23);
glowPlane(4.56,4.8,4.5,4.1,'#d8b274',.23);
glowPlane(-5.75,1.5,1.6,2.5,'#84d7d1',.22,.225);
// Irregular puddle edges over the reflective asphalt.
for(let i=0;i<20;i++){
 const x=range(-6.7,6.5),z=range(2.55,6.6),sx=range(.25,1.25),sz=range(.14,.40);
 if(x+sx>6.92||x-sx< -6.92||z+sz>6.92)continue;
 const shape=new THREE.Shape();
 for(let j=0;j<=20;j++){
  const a=j*Math.PI*2/20,r=1+.12*Math.sin(j*2.7+i);
  if(j===0)shape.moveTo(Math.cos(a)*sx*r,Math.sin(a)*sz*r);else shape.lineTo(Math.cos(a)*sx*r,Math.sin(a)*sz*r);
 }
 const p=mesh(new THREE.ShapeGeometry(shape),new THREE.MeshBasicMaterial({color:'#95bed1',transparent:true,opacity:.046,depthWrite:false,side:THREE.DoubleSide}),x,.067,z);
 p.rotation.x=-Math.PI/2;p.castShadow=false;
}
// Soft halos are physical lights in the miniature, not screen overlays.
function halo(x,y,z,color,size,opacity=.20){
 const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d');
 const gradient=ctx.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'rgba(255,255,255,.85)');gradient.addColorStop(.2,'rgba(255,255,255,.3)');gradient.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
 const texture=new THREE.CanvasTexture(c);
 const mat=new THREE.SpriteMaterial({map:texture,color,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false});
 const s=new THREE.Sprite(mat);s.position.set(x,y,z);s.scale.set(size,size,1);world.add(s);return s;
}
halo(4.48,5.07,4.83,'#ffdfb1',1.2,.22);halo(-5.82,2.15,.46,'#a1f3de',.83,.11);
// GPU-driven rain: starts and ends share the same wrap, preventing long streaks.
const rainCount=1150,rainPos=new Float32Array(rainCount*6),rainSeed=new Float32Array(rainCount*2),rainEnd=new Float32Array(rainCount*2);
for(let i=0;i<rainCount;i++){
 const x=range(-6.84,6.84),y=range(0,8.5),z=range(-6.84,6.84),s=rand();
 for(let end=0;end<2;end++){
  rainPos.set([x,y,z],i*6+end*3);rainSeed[i*2+end]=s;rainEnd[i*2+end]=end;
 }
}
const rainGeometry=new THREE.BufferGeometry();rainGeometry.setAttribute('position',new THREE.BufferAttribute(rainPos,3));rainGeometry.setAttribute('aSeed',new THREE.BufferAttribute(rainSeed,1));rainGeometry.setAttribute('aEnd',new THREE.BufferAttribute(rainEnd,1));
const rainMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0}},
 vertexShader:`attribute float aSeed;attribute float aEnd;uniform float uTime;varying float vAlpha;varying vec3 vColor;
 void main(){vec3 p=position;float y=mod(position.y-uTime*(4.8+aSeed*3.),8.5);p.y=y-aEnd*(.10+aSeed*.14);p.x+=aEnd*.024+sin(uTime*.5+aSeed*30.)*.016;
 vAlpha=(.12+aSeed*.25)*(1.-aEnd*.65)*smoothstep(.10,.40,y)*(1.-smoothstep(7.6,8.5,y));
 if(p.x> -5.05&&p.x<3.16&&p.z> -5.03&&p.z<.95&&p.y<4.18)vAlpha=0.;
 if(p.x> -5.1&&p.x<3.37&&p.z>.7&&p.z<1.66&&p.y<3.39)vAlpha=0.;
 float warm=exp(-length(vec2(p.x+1.,p.z-1.))*.47)*.65;vColor=mix(vec3(.57,.75,.88),vec3(.93,.87,.65),warm);
 gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
 fragmentShader:`varying float vAlpha;varying vec3 vColor;void main(){gl_FragColor=vec4(vColor,vAlpha);}`});
const rain=new THREE.LineSegments(rainGeometry,rainMaterial);rain.frustumCulled=false;scene.add(rain);
// Ripples spread and dissolve on the road and unroofed sidewalk.
const rippleCount=78,rippleData=[];
const ringGeo=new THREE.RingGeometry(.86,1,36);ringGeo.rotateX(-Math.PI/2);
const rippleMat=new THREE.MeshBasicMaterial({color:'#b0d4dd',transparent:true,opacity:.28,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
const rippleMesh=new THREE.InstancedMesh(ringGeo,rippleMat,rippleCount*2);rippleMesh.frustumCulled=false;scene.add(rippleMesh);
for(let i=0;i<rippleCount;i++){
 let x,z;do{x=range(-6.65,6.65);z=range(-6.65,6.65);}while(x> -5.16&&x<3.37&&z> -5.1&&z<1.70);
 rippleData.push({x,z,y:((x<4.3&&z<1.85)||(x>6.45&&z<1.7))?.228:.081,speed:range(.42,.85),phase:rand(),radius:range(.16,.43)});
}
const dummy=new THREE.Object3D();const rippleColor=new THREE.Color();
// Roof-edge drips land in a line and create their own small splashes.
const dripCount=24,dripGeo=new THREE.BufferGeometry(),dripPositions=new Float32Array(dripCount*6),dripSeeds=[];
for(let i=0;i<dripCount;i++)dripSeeds.push({x:-4.87+i*.33,s:rand(),speed:range(.60,1.1)});
dripGeo.setAttribute('position',new THREE.BufferAttribute(dripPositions,3));
const drips=new THREE.LineSegments(dripGeo,new THREE.LineBasicMaterial({color:'#c6ded7',transparent:true,opacity:.40}));drips.frustumCulled=false;world.add(drips);
// Faint trails of water on both shop windows; moving doors stay clear.
const streakCount=70,streakGeo=new THREE.BufferGeometry(),streakPositions=new Float32Array(streakCount*6),streakData=[];
for(let i=0;i<streakCount;i++){
 const side=i>=42;
 streakData.push({side,x:side?2.919:range(-4.7,-.47),z:side?range(-3.55,.53):.808,phase:rand(),speed:range(.027,.075),length:range(.045,.16)});
}
streakGeo.setAttribute('position',new THREE.BufferAttribute(streakPositions,3));
const streaks=new THREE.LineSegments(streakGeo,new THREE.LineBasicMaterial({color:'#d7ece5',transparent:true,opacity:.19}));streaks.frustumCulled=false;world.add(streaks);
// Almost imperceptible steam above the warm oden counter.
const steamGeo=new THREE.BufferGeometry(),steamPositions=new Float32Array(18*3);
steamGeo.setAttribute('position',new THREE.BufferAttribute(steamPositions,3));
const steam=new THREE.Points(steamGeo,new THREE.PointsMaterial({color:'#efe4c5',size:.055,transparent:true,opacity:.11,depthWrite:false}));steam.frustumCulled=false;world.add(steam);

// A handful of glints follows the gutters towards the grates; rainfall density is unchanged.
const gutterGeo=new THREE.BufferGeometry(),gutterPositions=new Float32Array(26*6);
gutterGeo.setAttribute('position',new THREE.BufferAttribute(gutterPositions,3));
const gutterFlow=new THREE.LineSegments(gutterGeo,new THREE.LineBasicMaterial({color:'#9ab6bd',transparent:true,opacity:.23}));gutterFlow.frustumCulled=false;world.add(gutterFlow);

// Materialize the instanced detail batches only after all models are complete.
for(const {color,parent,transforms} of batches.values()){
 const inst=new THREE.InstancedMesh(unitBox,toon(color,.10),transforms.length);
 transforms.forEach((t,i)=>{dummy.position.set(t.x,t.y,t.z);dummy.scale.set(t.w,t.h,t.d);dummy.rotation.set(0,t.rotation,0);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);});
 inst.castShadow=true;inst.receiveShadow=true;parent.add(inst);
}
// Collapse opaque static parts and outlines by material; animated parts stay independent.
world.updateMatrixWorld(true);
const mergeGroups=new Map();
function belongsToAnimatedPart(o){
 for(let p=o;p;p=p.parent)if(p===roofGroup||p===doorLeft||p===doorRight)return true;
 return o===drips||o===streaks||o===gutterFlow;
}
const staticParts=[];
world.traverse(o=>{
 if((o.isMesh&&!o.isInstancedMesh&&!o.material.transparent||o.isLineSegments)&&!belongsToAnimatedPart(o))staticParts.push(o);
});
for(const o of staticParts){
 const key=[o.isLineSegments?'lines':'solid',o.material.uuid,o.castShadow,o.receiveShadow].join(':');
 if(!mergeGroups.has(key))mergeGroups.set(key,{material:o.material,parts:[],lines:o.isLineSegments,castShadow:o.castShadow,receiveShadow:o.receiveShadow});
 mergeGroups.get(key).parts.push(o);
}
// Capture every world transform before removing any parent meshes.
for(const batch of mergeGroups.values())batch.geometries=batch.parts.map(o=>o.geometry.clone().applyMatrix4(o.matrixWorld));
for(const batch of mergeGroups.values()){
 const merged=mergeGeometries(batch.geometries,false);
 if(!merged)continue;
 const combined=batch.lines?new THREE.LineSegments(merged,batch.material):new THREE.Mesh(merged,batch.material);
 combined.castShadow=batch.castShadow;combined.receiveShadow=batch.receiveShadow;world.add(combined);
 batch.parts.forEach(o=>o.removeFromParent());batch.geometries.forEach(g=>g.dispose());
}

// Clone the roof's shared materials so its camera-aware cutaway affects only it.
const fadingRoof=[];
roofGroup.traverse(o=>{
 if(o.material){o.material=o.material.clone();const m=o.material;fadingRoof.push({m,opacity:m.opacity,depthWrite:m.depthWrite});m.transparent=true;}
});
const smooth=(a,b,x)=>THREE.MathUtils.smoothstep(x,a,b);
let previous=performance.now(),elapsed=0,roofAlpha=1,disposed=false;
const raf={id:0};
function animate(now){
 if(disposed)return;
 raf.id=requestAnimationFrame(animate);
 const delta=Math.min((now-previous)/1000,.05);previous=now;
 if(document.hidden)return;
 elapsed+=delta;const t=elapsed;frame++;
 controls.update();
 rainMaterial.uniforms.uTime.value=t;
 reflector.material.uniforms.uTime.value=t;
 const doorPhase=t%24,opening=smooth(9,11,doorPhase)*(1-smooth(15,17,doorPhase));
 doorLeft.position.x=.20-opening*.93;doorRight.position.x=1.27+opening*.93;
 const flicker=1-.055*Math.pow(Math.sin(t*1.8)*Math.sin(t*.43),18);
 mainSign.material.color.setScalar(flicker);
 lampLight.intensity=37+Math.sin(t*.67)*.35;
 const stage=t%34,active=stage<17?0:stage<20?1:2;
 signals.forEach((s,i)=>s.mat.color.copy(s.color).multiplyScalar(i===active?1.48:.15));
 const elev=Math.asin((camera.position.y-controls.target.y)/camera.position.distanceTo(controls.target));
 const desired=1-smooth(.63,.96,elev)*.97;
 roofAlpha=THREE.MathUtils.lerp(roofAlpha,desired,1-Math.exp(-delta*6));
 fadingRoof.forEach(({m,opacity,depthWrite})=>{m.opacity=opacity*roofAlpha;m.depthWrite=roofAlpha>.98&&depthWrite;});
 roofGroup.traverse(o=>{if(o.isMesh)o.castShadow=roofAlpha>.8;});
 rippleData.forEach((r,i)=>{
  const phase=(t*r.speed+r.phase)%1;
  for(let ring=0;ring<2;ring++){
   const p=(phase+ring*.22)%1, radius=.016+p*r.radius;
   dummy.position.set(r.x,r.y+ring*.0005,r.z);dummy.rotation.set(0,0,0);dummy.scale.set(radius,1,radius);dummy.updateMatrix();rippleMesh.setMatrixAt(i*2+ring,dummy.matrix);
   rippleColor.setScalar((1-p)*smooth(0,.09,p));rippleMesh.setColorAt(i*2+ring,rippleColor);
  }
 });
 rippleMesh.instanceMatrix.needsUpdate=true;if(rippleMesh.instanceColor)rippleMesh.instanceColor.needsUpdate=true;
 dripSeeds.forEach((d,i)=>{const phase=(t*d.speed+d.s)%1,y=3.28-phase*phase*3.06;dripPositions.set([d.x,y,1.63,d.x,y-.065,1.63],i*6);});dripGeo.attributes.position.needsUpdate=true;
 streakData.forEach((s,i)=>{const y=3.22-((t*s.speed+s.phase)%1)*2.64;streakPositions.set([s.x,y,s.z,s.x+(s.side?0:.007),y-s.length,s.z+(s.side?.007:0)],i*6);});streakGeo.attributes.position.needsUpdate=true;
 for(let i=0;i<18;i++){const p=(t*.18+i/18)%1;steamPositions.set([interior.steam.x+Math.sin(p*9+i)*.044,interior.steam.y+p*.32,interior.steam.z+Math.cos(i*2)*.044],i*3);}steamGeo.attributes.position.needsUpdate=true;
 for(let i=0;i<26;i++){
  if(i<15){const x=.55+((t*.31+i*.208)%3.06);const z=2.19+Math.sin(i*7+t)*.009;gutterPositions.set([x,.076,z,x-.048,.076,z],i*6);}
  else{const z=-3.37+((t*.23+(i-15)*.131)%1.42);const x=4.62+Math.sin(i*3+t)*.008;gutterPositions.set([x,.076,z,x,.076,z-.045],i*6);}
 }
 gutterGeo.attributes.position.needsUpdate=true;
 composer.render();
}
raf.id=requestAnimationFrame(animate);
let resized=false;
addEventListener('resize',()=>{
 const oldAspect=camera.aspect;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();controls.maxDistance=Math.max(60,fitDistance()*1.5);
 renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);
 if(!resized&&Math.abs(oldAspect-camera.aspect)>.7){camera.position.copy(initialDirection.clone().multiplyScalar(fitDistance()).add(controls.target));resized=true;}
});
// Invisible, native keyboard access complements mouse and touch orbit gestures.
renderer.domElement.addEventListener('keydown',e=>{
 const direction=camera.position.clone().sub(controls.target),spherical=new THREE.Spherical().setFromVector3(direction);
 let handled=true;
 if(e.key==='ArrowLeft')spherical.theta-=.085;else if(e.key==='ArrowRight')spherical.theta+=.085;
 else if(e.key==='ArrowUp')spherical.phi=Math.max(controls.minPolarAngle,spherical.phi-.07);
 else if(e.key==='ArrowDown')spherical.phi=Math.min(controls.maxPolarAngle,spherical.phi+.07);
 else if(e.key==='+'||e.key==='=')spherical.radius=Math.max(controls.minDistance,spherical.radius*.9);
 else if(e.key==='-')spherical.radius=Math.min(controls.maxDistance,spherical.radius/ .9);
 else if(e.key==='Home'){camera.position.copy(initialDirection.clone().multiplyScalar(fitDistance()).add(target));controls.target.copy(target);controls.update();e.preventDefault();return;}
 else handled=false;
 if(handled){e.preventDefault();camera.position.copy(new THREE.Vector3().setFromSpherical(spherical).add(controls.target));controls.update();}
});
addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(raf.id);controls.dispose();renderer.dispose();composer.dispose();});
addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
