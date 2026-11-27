import { BackSide, BoxGeometry, Color, DirectionalLight, EdgesGeometry, Fog, Group, HemisphereLight,
  LineBasicMaterial, LineSegments, Mesh, MeshStandardMaterial, Scene, ShaderMaterial, SphereGeometry,
  type BufferGeometry, type Material } from 'three';
import { FlightWorldQuery, type FlightData } from '../world/FlightWorldQuery.ts';
import type { SolidBox } from '../world/CapsuleBox.ts';
import type { Environment } from './SceneSwitch.ts';
import { sceneControlPolicy } from './SceneControlPolicy.ts';
import { solarPosition, validSolar, type SolarSettings } from './SolarPosition.ts';
import type { TimeOfDay } from './CityScene.ts';

export function createFlight():Environment {
  const scene=new Scene(),environment=new Group();environment.name='Flight validation · bounded airspace';
  scene.background=new Color('#9bc9ec');scene.fog=new Fog('#9bc9ec',65,135);scene.add(environment);
  const hemisphere=new HemisphereLight('#d4edff','#7c8a6a',2);
  const sun=new DirectionalLight('#fff2d6',3);sun.position.set(15,30,10);sun.castShadow=true;
  Object.assign(sun.shadow.camera,{left:-42,right:42,top:42,bottom:-42,near:.1,far:110});
  sun.shadow.mapSize.set(1024,1024);sun.shadow.bias=-.0003;scene.add(hemisphere,sun);
  const geometries=new Set<BufferGeometry>(),materials=new Set<Material>();
  const data:FlightData={bounds:{minX:-40,maxX:40,minY:0,maxY:40,minZ:-40,maxZ:40},
    solids:[
      {id:'flight-tower',minX:7,maxX:11,minY:0,maxY:23,minZ:-10,maxZ:-6},
      {id:'landing-low',minX:-12,maxX:-4,minY:0,maxY:5,minZ:-12,maxZ:-4},
      {id:'landing-high',minX:14,maxX:24,minY:0,maxY:12,minZ:8,maxZ:18},
    ],surfaces:[{id:'flight-floor',minX:-40,maxX:40,minZ:-40,maxZ:40,height:0}],
    forbidden:[{id:'restricted-airspace',minX:-25,maxX:-17,minY:8,maxY:25,minZ:12,maxZ:22}]};
  const boxMesh=(b:SolidBox,color:string):Mesh=>{
    const geometry=new BoxGeometry(b.maxX-b.minX,b.maxY-b.minY,b.maxZ-b.minZ);
    const material=new MeshStandardMaterial({color,roughness:.85});
    geometries.add(geometry);materials.add(material);
    const mesh=new Mesh(geometry,material);mesh.position.set((b.minX+b.maxX)/2,(b.minY+b.maxY)/2,(b.minZ+b.maxZ)/2);
    mesh.castShadow=true;mesh.receiveShadow=true;environment.add(mesh);return mesh;
  };
  const floor=boxMesh({id:'floor',...data.bounds,minY:-.4,maxY:0},'#69886b');
  floor.name='Landing ground';floor.userData.walkable=true;
  for(const b of data.solids){
    const mesh=boxMesh(b,b.id==='flight-tower'?'#687e96':'#b6a681');
    mesh.name=b.id==='flight-tower'?'Solid tower':'Landing platform · '+b.maxY+'m';
    mesh.userData.solidBox={...b};mesh.userData.walkable=true;
    data.surfaces=[...data.surfaces,{...b,height:b.maxY}];
  }
  const outline=(b:SolidBox,color:string,name:string):void=>{
    const source=new BoxGeometry(b.maxX-b.minX,b.maxY-b.minY,b.maxZ-b.minZ),edges=new EdgesGeometry(source);source.dispose();
    const material=new LineBasicMaterial({color,transparent:true,opacity:.65});geometries.add(edges);materials.add(material);
    const lines=new LineSegments(edges,material);lines.position.set((b.minX+b.maxX)/2,(b.minY+b.maxY)/2,(b.minZ+b.maxZ)/2);
    lines.name=name;lines.userData.cameraObstruction=false;lines.raycast=()=>{};environment.add(lines);
  };
  outline({id:'flight-range',...data.bounds},'#f6d76c','Allowed flight-range · hard boundary · 3m warning');
  for(const b of data.forbidden)outline(b,'#ff5a65','Forbidden '+b.id+' · flight/ground');
  const skyGeometry=new SphereGeometry(150,24,12);
  const daylight={value:1};
  const skyMaterial=new ShaderMaterial({side:BackSide,depthWrite:false,uniforms:{daylight},
    vertexShader:'varying vec3 skyDirection; void main(){ skyDirection=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader:'varying vec3 skyDirection; uniform float daylight; void main(){ float h=clamp(normalize(skyDirection).y,0.0,1.0); vec3 day=mix(vec3(.75,.88,.97),vec3(.12,.39,.74),pow(h,.6)); gl_FragColor=vec4(mix(vec3(.025,.045,.09),day,daylight),1.0); }'});
  geometries.add(skyGeometry);materials.add(skyMaterial);
  const sky=new Mesh(skyGeometry,skyMaterial);sky.name='Procedural sky';sky.renderOrder=-10;
  sky.userData.cameraObstruction=false;sky.userData.preserveLightMaterial=true;sky.raycast=()=>{};environment.add(sky);
  const cloudGeometry=new SphereGeometry(1,10,6),cloudMaterial=new MeshStandardMaterial({color:'#f0f5fa',roughness:1,transparent:true,opacity:.75,depthWrite:false});
  geometries.add(cloudGeometry);materials.add(cloudMaterial);
  const clouds:Mesh[]=[];
  for(let i=0;i<14;i++){
    const cloud=new Mesh(cloudGeometry,cloudMaterial);cloud.position.set(Math.sin(i*2.4)*31,27+Math.sin(i*3)*4,Math.cos(i*2.4)*31);
    cloud.scale.set(4+i%3,1.2,2.5);cloud.name='Visual cloud · no collision';cloud.userData.cameraObstruction=false;
    cloud.userData.preserveLightMaterial=true;cloud.raycast=()=>{};environment.add(cloud);clouds.push(cloud);
  }
  let solar:SolarSettings={enabled:false,hour:12,season:'spring',latitude:25},time:TimeOfDay='day',disposed=false;
  const sync=():void=>{
    const d=solarPosition(solar.enabled?solar.hour:{day:12,evening:17,night:0}[time],solar.season,solar.latitude);
    sun.position.set(d.x*45,d.y*45,d.z*45);sun.visible=d.y>0;sun.intensity=3*Math.max(0,d.y);
    hemisphere.intensity=.3+1.7*Math.max(0,d.y);daylight.value=.12+.88*Math.max(0,d.y);
    const color=d.y>.1?'#9bc9ec':d.y>0?'#c59b80':'#172738';(scene.background as Color).set(color);(scene.fog as Fog).color.set(color);
  };sync();
  return {id:'flight',scene,environment,spawn:{x:0,z:5},cityFeatures:false,
    controls:sceneControlPolicy('open',{groundNavigation:false}),
    walkableWorld:{bounds:data.bounds,obstacles:[],groundHeight:()=>0,query:new FlightWorldQuery(data)},
    solar:{getSettings:()=>({...solar}),configure(patch){const next={...solar,...patch};if(disposed||!validSolar(next))return false;solar=next;sync();return true;},
      getTime:()=>time,setTime(next){if(disposed||!['day','evening','night'].includes(next))return false;time=next;solar.enabled=false;sync();return true;}},
    update(delta,reduced){if(disposed||reduced||!Number.isFinite(delta))return;for(const cloud of clouds){cloud.position.x+=Math.max(0,Math.min(.05,delta))*.25;if(cloud.position.x>39)cloud.position.x=-39;}},
    dispose(){if(disposed)return;disposed=true;for(const g of geometries)g.dispose();for(const m of materials)m.dispose();sun.dispose();scene.clear();},
  };
}
