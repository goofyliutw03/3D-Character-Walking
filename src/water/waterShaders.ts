const noise = /* glsl */`
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise2(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
`;

const waves = /* glsl */`
uniform float uTime, uWave, uFlow, uEnabled, uLow, uOpacity;
float heightAt(vec2 p) {
  if (uEnabled < .5) return 0.0;
  float t = uTime * uFlow;
  float d = length((p-vec2(0.0,-1.1))*vec2(1.0,1.15));
  float ring = sin(d*19.0-t*5.0)*exp(-d*1.8)*0.012;
  return (sin(dot(p,vec2(4.2,2.8))+t*1.3)*0.013
    + sin(dot(p,vec2(-2.8,5.4))-t*1.7)*0.009
    + sin(dot(p,vec2(7.1,-3.0))+t*2.1)*0.004 + ring) * uWave * uEnabled;
}
`;

export const waterVertex = /* glsl */`
${waves}
varying vec3 vWorld;
varying vec2 vPoint;
void main() {
  vec3 p = position;
  vPoint = p.xz;
  p.y += heightAt(p.xz);
  vec4 world = modelMatrix*vec4(p,1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix*viewMatrix*world;
}
`;

export const waterFragment = /* glsl */`
${noise}
${waves}
varying vec3 vWorld;
varying vec2 vPoint;
void main() {
  if (uEnabled < .5) {
    gl_FragColor = vec4(.035,.35,.30,uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    return;
  }
  float t = uTime*uFlow;
  vec2 p = vPoint;
  float e = 0.018;
  vec3 n = normalize(vec3(heightAt(p-vec2(e,0))-heightAt(p+vec2(e,0)),2.0*e,
    heightAt(p-vec2(0,e))-heightAt(p+vec2(0,e))));
  vec3 eye = normalize(cameraPosition-vWorld);
  float fresnel = pow(1.0-max(dot(n,eye),0.0),3.0);
  float broad = pow(max(dot(n,normalize(eye+normalize(vec3(-2,5,3)))),0.0),42.0);
  float caustic = sin(p.x*9.0+t*.35+sin(p.y*8.0-t*.4))*sin(p.y*11.0-t*.25);
  vec3 color = mix(vec3(.018,.25,.23),vec3(.10,.48,.41),.5+.2*sin(p.y*1.7));
  color += max(caustic,0.0)*.022;
  color = mix(color,vec3(.42,.68,.61),fresnel*.64);
  color += vec3(.30,.36,.30)*broad*.42*uEnabled;
  float d = length((p-vec2(0,-1.1))*vec2(1.0,1.15));
  float grain = noise2(p*25.0+vec2(t*.45,-t*.6));
  if(uLow < .5) grain = grain*.65+noise2(p*52.0-t*.7)*.35;
  float ring = pow(max(sin(d*19.0-t*5.0),0.0),14.0)*exp(-d*1.5);
  float impact = (1.0-smoothstep(.18,.62,d)) * smoothstep(.20,.69,grain);
  float edge = 1.0-smoothstep(.0,.065,min(2.0-abs(p.x),1.5-abs(p.y)));
  float foam = clamp(impact*.85+ring*.38+edge*.19,0.0,.92)*uEnabled;
  color = mix(color,vec3(.83,.94,.86),foam);
  gl_FragColor = vec4(color,uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export const fallVertex = /* glsl */`
uniform float uTime, uFlow;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position;
  p.x += sin(uv.y*13.0-uTime*uFlow*3.0)*.018*sin(uv.x*3.14159);
  p.z += sin(uv.y*8.0-uTime*uFlow*4.0)*.018;
  gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0);
}
`;

export const fallFragment = /* glsl */`
${noise}
uniform float uTime, uFlow, uLow, uOpacity;
varying vec2 vUv;
void main() {
  float t = uTime*uFlow;
  vec2 uv = vUv;
  float stream = noise2(vec2(uv.x*17.0,uv.y*5.0+t*2.5));
  float fine = stream;
  if(uLow < .5) fine = noise2(vec2(uv.x*43.0,uv.y*14.0+t*6.0));
  float edge = .035+noise2(vec2(uv.y*11.0+t*1.1,2.0))*.055;
  float mask = smoothstep(edge,edge+.045,uv.x)*smoothstep(edge,edge+.045,1.0-uv.x);
  float strands = smoothstep(.36,.78,stream*.65+fine*.35);
  float lip = smoothstep(.80,1.0,uv.y)*.25;
  float bottom = (1.0-smoothstep(.0,.22,uv.y))*.55;
  vec3 color = mix(vec3(.13,.49,.44),vec3(.85,.96,.90),strands*.83+bottom*.35+lip);
  float alpha = (.56+strands*.32+bottom*.1)*mask;
  if(alpha < .025) discard;
  gl_FragColor = vec4(color,alpha*uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;
