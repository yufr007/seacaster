/**
 * Stylized premium water for SeaCaster.
 * Broad readable forms beat photoreal noise on a phone: layered swells, soft depth bands,
 * sparse foam ribbons and controlled sun glints. The shader deliberately avoids screen-space
 * reflections/post-processing so the fishing loop stays fast in Base's embedded mobile browser.
 */
export const waterVertexShader = `
  uniform float time;
  varying vec3 vWorld;
  varying float vWave;
  varying float vCrest;

  float waveHeight(vec2 p, float t) {
    float a = sin(p.x * .56 + t * .86) * .072;
    float b = cos(p.y * .41 + t * .61) * .052;
    float c = sin((p.x + p.y) * .23 - t * .38) * .028;
    return a + b + c;
  }

  void main() {
    vec3 p = position;
    vec3 base = (modelMatrix * vec4(p, 1.0)).xyz;
    float h = waveHeight(base.xz, time);
    p.z = h;
    vWave = h;
    vCrest = smoothstep(.055, .14, h);
    vWorld = (modelMatrix * vec4(p, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

export const waterFragmentShader = `
  uniform float time;
  uniform vec3 deep;
  uniform vec3 shallow;
  uniform float daylight;
  varying vec3 vWorld;
  varying float vWave;
  varying float vCrest;

  float band(vec2 p, float scale, float speed, float phase) {
    float n = sin(p.x * scale + sin(p.y * scale * .72 + time * speed) * 1.55 + time * speed + phase);
    return smoothstep(.82, .995, n);
  }

  void main() {
    float nearWater = smoothstep(-35.0, 8.0, vWorld.z);
    float lateral = .5 + .5 * sin(vWorld.x * .045);
    vec3 color = mix(deep, shallow, clamp(.12 + nearWater * .62 + lateral * .05, 0.0, 1.0));

    // Large painterly turquoise bands give the water depth and motion without noisy realism.
    float broad = .5 + .5 * sin(vWorld.x * .11 + vWorld.z * .075 + time * .075);
    color *= .94 + broad * .075;

    // Two sparse foam/glint families. Keeping them broad is important at 390px width.
    float ribbonA = band(vWorld.xz, .82, .24, 0.0);
    float ribbonB = band(vWorld.zx + vec2(12.0, -7.0), 1.34, -.18, 2.1);
    float foam = clamp(ribbonA * .54 + ribbonB * .30 + vCrest * .22, 0.0, 1.0);
    vec3 foamColor = mix(vec3(.70, .91, .88), vec3(.91, 1.0, .91), daylight);
    color = mix(color, foamColor, foam * (.055 + daylight * .075));

    // Quiet moving caustic value variation, not a literal underwater caustics texture.
    float caustic = sin(vWorld.x * 2.1 + time * .42) * sin(vWorld.z * 1.7 - time * .31);
    caustic = pow(max(0.0, caustic), 8.0);
    color += vec3(.025, .055, .042) * caustic * (.35 + daylight * .65);

    // Tiny crest lift keeps the surface dimensional under the authored pier and boats.
    color += vWave * vec3(.12, .16, .12);

    // Rare warm sparkle rather than a blanket glossy reflection.
    float sparkle = sin(vWorld.x * 3.3 + time * .55) * sin(vWorld.z * 4.4 - time * .48);
    sparkle = pow(max(0.0, sparkle), 28.0);
    vec3 sunGlint = mix(vec3(.55, .72, .82), vec3(1.0, .91, .62), daylight);
    color = mix(color, sunGlint, sparkle * .12 * daylight);

    gl_FragColor = vec4(color, .91);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
