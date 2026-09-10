/** Painterly water: broad bands, flowing highlights and quiet caustics, not photoreal waves. */
export const waterVertexShader = `
  uniform float time;
  varying vec3 vWorld;
  varying float vWave;
  void main() {
    vec3 p=position;
    p.z = sin(p.x*.6+time*.85)*.075 + cos(p.y*.43-time*.6)*.055;
    vWave=p.z;
    vWorld=(modelMatrix*vec4(p,1.)).xyz;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
  }
`;
export const waterFragmentShader = `
  uniform float time;
  uniform vec3 deep;
  uniform vec3 shallow;
  uniform float daylight;
  varying vec3 vWorld;
  varying float vWave;
  void main(){
    float near= smoothstep(-30.,9.,vWorld.z);
    vec3 color=mix(deep,shallow,near*.55+.15);
    float stripe=sin(vWorld.x*.9+sin(vWorld.z*.85+time*.4)*1.4+time*.32);
    float ripple=smoothstep(.9,.99,stripe)*smoothstep(.3,.9,sin(vWorld.z*1.6-time*.3));
    color+=vec3(.09,.12,.08)*ripple*(.3+.7*daylight);
    color+=floor((vWave+.14)*22.)*.009;
    float glint=pow(max(0.,sin(vWorld.x*2.7+time*.4)*sin(vWorld.z*4.1-time*.45)),22.);
    color=mix(color,vec3(.83,.98,.85),glint*.28*daylight);
    gl_FragColor=vec4(color,.88);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
