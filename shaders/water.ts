/**
 * Water Shader - Mobile-Optimized for Battery Performance
 * Simple sine wave displacement with gradient coloring
 */

export const waterVertexShader = `
  uniform float time;
  uniform float waveHeight;
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Simple sine wave pattern (battery-optimized, no complex math)
    float wave1 = sin(pos.x * 2.0 + time) * cos(pos.y * 1.5 + time * 0.8);
    float wave2 = sin(pos.x * 1.3 - time * 0.6) * cos(pos.y * 2.1 + time * 0.5);

    // Combine waves with reduced amplitude for subtle effect
    float elevation = (wave1 + wave2 * 0.5) * waveHeight;
    pos.z += elevation;
    vElevation = elevation;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const waterFragmentShader = `
  uniform vec3 color1; // Deep water color
  uniform vec3 color2; // Surface water color
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    // Gradient based on wave elevation
    float mixFactor = vElevation * 0.5 + 0.5;
    vec3 color = mix(color1, color2, mixFactor);

    // Add slight transparency for realistic water
    gl_FragColor = vec4(color, 0.92);
  }
`;
