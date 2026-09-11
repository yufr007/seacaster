/**
 * SeaCaster mobile water.
 * Geometry stays deterministic and shared with game/art-motion.ts so the bobber sits on
 * the surface players actually see. Shading uses the view angle, broad flow and sparse
 * crest detail instead of repeating binary bands or a heavy reflection/post stack.
 */
export const waterVertexShader = `
  uniform float time;
  varying vec3 vWorld;
  varying vec3 vNormal;
  varying float vWave;
  varying float vCrest;

  float waveHeight(vec2 p, float t) {
    float a = sin(p.x * .6 + t * .85) * .075;
    float b = cos(p.y * .43 + t * .6) * .055;
    return a + b;
  }

  void main() {
    vec3 p = position;
    vec3 base = (modelMatrix * vec4(p, 1.0)).xyz;
    float h = waveHeight(base.xz, time);
    float dx = cos(base.x * .6 + time * .85) * .045;
    float dz = -sin(base.z * .43 + time * .6) * .02365;
    p.z = h;
    vWave = h;
    vCrest = smoothstep(.075, .125, h);
    vWorld = (modelMatrix * vec4(p, 1.0)).xyz;
    vNormal = normalize(vec3(-dx, 1.0, -dz));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

export const waterFragmentShader = `
  uniform float time;
  uniform vec3 deep;
  uniform vec3 shallow;
  uniform float daylight;
  uniform vec3 cameraPosition;
  varying vec3 vWorld;
  varying vec3 vNormal;
  varying float vWave;
  varying float vCrest;

  float softFlow(vec2 p, float t) {
    float a = sin(p.x * .19 + p.y * .11 + t * .17);
    float b = sin(p.x * -.13 + p.y * .23 - t * .11 + 1.7);
    float c = cos(p.x * .31 + p.y * -.17 + t * .09 + 4.1);
    return (a + b * .72 + c * .42) / 2.14;
  }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(cameraPosition - vWorld);
    float ndv = clamp(dot(N, V), 0.0, 1.0);
    float fresnel = pow(1.0 - ndv, 3.0);

    float distanceTone = smoothstep(-44.0, 5.0, vWorld.z);
    float flow = softFlow(vWorld.xz, time);
    float broad = .5 + .5 * softFlow(vWorld.xz * .42 + vec2(7.0, -3.0), time * .46);

    // Turquoise body colour reads from above; deeper blue gathers toward the horizon.
    vec3 body = mix(deep, shallow, clamp(.20 + distanceTone * .52 + broad * .10, 0.0, 1.0));
    body *= .965 + flow * .025;
    vec3 horizon = mix(vec3(.13, .31, .43), vec3(.31, .74, .79), daylight);
    vec3 color = mix(body, horizon, fresnel * (.16 + daylight * .12));

    // Soft high-frequency breakup gives scale without producing visible repeating stripes.
    float detailA = sin(vWorld.x * 1.47 + vWorld.z * .83 + time * .38);
    float detailB = cos(vWorld.x * -.92 + vWorld.z * 1.63 - time * .29);
    float detail = .5 + .5 * (detailA * detailB);
    color += (detail - .5) * vec3(.012, .026, .022) * (.4 + daylight * .6);

    // Foam exists at actual geometric crests and at rare crossing ripples only.
    float crossing = smoothstep(.94, 1.0, detail) * smoothstep(.52, .88, flow);
    float foam = clamp(vCrest * (.34 + crossing * .42) + crossing * .16, 0.0, 1.0);
    vec3 foamColor = mix(vec3(.52, .74, .80), vec3(.88, .98, .90), daylight);
    color = mix(color, foamColor, foam * (.12 + daylight * .10));

    // Warm glints respond to the view and surface tilt instead of painting stripes over the sea.
    float facingSun = pow(clamp(N.y * .68 + N.x * -.18 + N.z * .11, 0.0, 1.0), 18.0);
    float glintMask = smoothstep(.78, .99, detail) * facingSun * daylight;
    color += vec3(1.0, .82, .48) * glintMask * .12;

    // Slight near-surface lift keeps the bait and fish readable without fake transparency noise.
    color += vWave * vec3(.06, .10, .08);
    float alpha = .94 + fresnel * .045;
    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
