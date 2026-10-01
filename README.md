# Slop alarm! 100% vibe coded, thank Qwen3.8-27b.
Completely vibe coded simple helper tool for calculating the resulting new facing orientation of pv-modules when mounted at an additional angle, e.g. on a rooftop. The resulting angle and orientation is different if panels are mounted on a roof which features it's own angle. This tool visualizes and calculates what is going on.

# PV Module Orientation

A self-contained, dependency-free web tool that computes the **effective facing and tilt** of
rooftop solar modules on a **pitched roof** with a **mounting-kit tilt**, and shows the result
in a live 3-D view.

Give it three inputs — the gable (ridge) direction, the roof pitch, and the mounting-kit tilt —
and it returns, per roof side:

- **Effective facing** — the azimuth the panel surface points to after the kit tilt
- **Effective tilt** — the angle of the panel surface from horizontal
- The roof-plane facing it started from, and the full 3-D surface normal

No build step, no framework — open `index.html` in a browser and it runs.

## Inputs

| Symbol | Name | Range | Meaning |
|:--:|------|:--:|---------|
| `G`  | Gable facing direction | −180° … 180° | Azimuth the ridge/gable axis points |
| `α`  | Roof tilt | 5° … 60° | Pitch of each roof plane from horizontal |
| `β`  | Mounting-kit tilt | 0° … 30° | Extra tilt added by the mounting system, toward the gable |

Azimuth convention: `0° = S`, `−90° = E`, `+90° = W`, `±180° = N`.

## The math (closed form)

For a roof plane facing `φ`, the panel surface normal is the roof normal tilted toward the
gable direction by `β`:

```
n_roof(φ) = sin α · h(φ) + cos α · ẑ
n_pv      = cos β · n_roof(φ) + sin β · ĝ
```

where `h(φ)` is the unit horizontal vector for azimuth `φ` and `ĝ` is the unit gable axis.
This yields two useful scalars:

```
γ (effective tilt)     = acos(cos α · cos β)
δ (facing shift)       = atan(tan β / sin α)
```

`γ` depends only on `α` and `β`; `δ` rotates each roof-plane facing toward the gable direction
by the same amount. The 3-D view is driven directly by the vector form `n = cosβ·n_roof + sinβ·ĝ`.

## The 3-D view

`index.html` renders a small gabled house on a canvas. Each roof panel is a rigid quad that is
rotated by `β` around its own hinge axis (the intersection line of the roof plane and the tilted
panel plane) and lifted off the roof so it never sinks into the surface — matching how a real
mounting kit floats the panel on rails. Front faces show the cell grid; the back face shows the
frame and junction box. A compass shows the ridge direction and each panel's effective facing.

## Project layout

```
index.html          UI + canvas renderer (no dependencies)
pv-math.js          Pure orientation math — usable in the browser and in Node
```

## Run

Just open `index.html` in any modern browser.
