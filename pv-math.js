/* pv-math.js — core orientation math (pure, no DOM — usable in node for testing)
 *
 * Azimuth convention: 0° = South, -90° = East, +90° = West, 180° = North
 * 3D axes: (N, E, up)
 *
 * Geometry (mode "toward gable"):
 *   roof plane normal:  n_roof(φ) = sin α · h(φ) + cos α · ẑ
 *   module normal:      n_pv     = cos β · n_roof(φ) + sin β · ĝ
 *   (g = unit gable axis; for a roof plane φ = G ± 90° so n_pv is already unit)
 *   effective tilt:     γ = acos(cos α · cos β)
 *   facing shift:       δ = atan(tan β / sin α)   (plane facing rotated toward G)
 */
"use strict";

const rad = d => d * Math.PI / 180;
const deg = r => r * 180 / Math.PI;

const V = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: a => Math.hypot(a[0], a[1], a[2]),
  norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
};

// unit horizontal vector for azimuth φ (0=S, -90=E, +90=W, 180=N), in (N, E, up)
// S=(-1,0,0), W=(0,-1,0):  h(φ) = -cosφ·N̂ - sinφ·Ê  →  h(0)=S, h(90)=W, h(-90)=E, h(180)=N
function h(phi) { const r = rad(phi); return [-Math.cos(r), -Math.sin(r), 0]; }

// normalize azimuth into (-180, 180] (180 instead of -180, per convention)
function normAz(t) { t = ((t + 180) % 360 + 360) % 360 - 180; return t < -179.999 ? 180 : t; }

function azOf(n)  { return normAz(deg(Math.atan2(-n[1], -n[0]))); }
function tiltOf(n){ return deg(Math.atan2(Math.hypot(n[0], n[1]), Math.max(n[2], 1e-9))); }

function roofNormal(phi, alpha) {
  const a = rad(alpha), f = h(phi);
  return [Math.sin(a) * f[0], Math.sin(a) * f[1], Math.cos(a)];
}

// module normal on the roof plane facing phi, tilted beta toward the gable direction G
function panelNormal(G, alpha, phi, beta) {
  const a = rad(alpha), b = rad(beta), g = h(G), f = h(phi);
  return [
    Math.sin(a) * Math.cos(b) * f[0] + Math.sin(b) * g[0],
    Math.sin(a) * Math.cos(b) * f[1] + Math.sin(b) * g[1],
    Math.cos(a) * Math.cos(b)
  ];
}

// main 3-input -> outputs function
function compute(G, alpha, beta) {
  // plane A = the -wW side (faces G-90), plane B = the +wW side (faces G+90)
  const phiA = normAz(G - 90), phiB = normAz(G + 90);
  const westIsA = Math.sin(rad(phiA)) >= Math.sin(rad(phiB)); // west side = plane facing more west
  const order = westIsA ? [["west", phiA], ["east", phiB]] : [["west", phiB], ["east", phiA]];
  const sides = {};
  for (const [k, phi] of order) {
    const n = panelNormal(G, alpha, phi, beta);
    sides[k] = { phi, facing: azOf(n), tilt: tiltOf(n), n };
  }
  const delta = alpha < 1e-9 ? (beta > 1e-9 ? 90 : 0)
                             : deg(Math.atan(Math.tan(rad(beta)) / Math.sin(rad(alpha))));
  const gamma = deg(Math.acos(Math.cos(rad(alpha)) * Math.cos(rad(beta))));
  return { sides, delta, gamma, phiA, phiB, westIsA };
}

const CARDN = ["N","ENE","NE","NNE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
function cardinal(az) {
  let t = normAz(az - 180);
  let i = Math.round(t / 22.5) % 16; if (i < 0) i += 16;
  return CARDN[i];
}

// side label for a roof plane facing (degenerates to N/S-facing labels when gable = ±90)
function sideLabel(phi) {
  const s = Math.sin(rad(phi));
  if (s > 0.01) return "West side";
  if (s < -0.01) return "East side";
  return Math.abs(phi) < 90 ? "South side" : "North side";
}

if (typeof module !== "undefined") module.exports = { rad, deg, V, h, normAz, azOf, tiltOf, roofNormal, panelNormal, compute, cardinal, sideLabel };
