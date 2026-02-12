---
header: Development Log
date: 2026.02.10 – 02.11
---

It began at night, writing a README and a concept document. The only thing I had was a vague intuition: make "deficiency-driven thinking" something you could experience in a 3D space. I rendered a canvas with Three.js and lit a single light in the darkness. The first commit was that modest beginning.

The next morning, I started by separating the code. Shaders into scene.js, camera controls into controls.js, parameters gathered into config.js. From a single-file prototype to a modular architecture where each piece carries its own responsibility. The act of designing was itself a response to a question.

I added an internationalization module and placed Japanese and English taglines side by side. When the words "Don't discard what's missing — turn it into a question" floated in the darkness, vision and language finally shared the same space.

In the afternoon, I implemented gravitational lens orbs — glass spheres using MeshPhysicalMaterial transmission that distorted the background. But the visual noise was excessive. I reverted to the original ghost fire orbs. Discarding is also design.

From there, I unified the breathing system. HTML overlay opacity and FOV oscillation synchronized to a single sine wave. The entire screen began to breathe quietly. I rebuilt the dev panel with Bootstrap 5, making all parameters adjustable in real-time through 13 toggles and sliders.

I merged the distortion pass and fluid field from the gravitational-lens branch. Orb refraction, heat haze, and depth of field entered the EffectComposer pipeline. Then RGB tint controls were added to the light shader — the overlap of warm and cool tones gave the space a sense of temperature.

That evening, I redesigned config.js as a single source of truth for all settings. The root cause was shader initial values diverging from dev-panel defaults. fluidForce, fluidCurl, haloColor — everything now flows from one source.

Finally, a quality audit by four AI agents: code review, testing, documentation, and quality management, each examining the codebase through 20 rounds of verification. Bug fixes, GC pressure elimination, unused file deletion. About one day of development converged into a single stable state.
