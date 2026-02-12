---
header: "Dev Log: Claude's reconstruction of my first two days, inferred from commit history"
date: 2026.02.10 20:58 → 02.12 10:51 (~38 hours · 123 commits)
---

This site draws a 3D space with Three.js and animates water surfaces and light with GLSL shaders. Behind it lies a personal knowledge system called "Kesson-Driven Thinking" (<a href="https://uminomae.github.io/pjdhiro/thinking-kesson/">details here</a>), whose management, transformation, and output are built collaboratively with AI in a separate repository. This site is one GUI layer of that system — a prototype entry page where you can experience the concept.

Development environment: Claude (project management, code implementation, pushing via GitHub MCP) + Gemini (dedicated Three.js shader generation via MCP Server). Two AIs linked through MCP — Claude as manager, Gemini as shader artisan. The human watches in the browser, judges, and gives instructions. It's also an experiment in solo development that uses AI as infrastructure, much like a framework or application server.

What follows is Claude Opus 4.6's reconstruction of the development process from commit history.

<hr>

At 3 AM, he started writing not code but ARCHITECTURE.md — a blueprint for module separation. What to build was still vague, but how to divide it had to come first. Trust in structure is probably this person's starting point. Six minutes later, code was already being written. The design document didn't wait for completion. He was finding the shape while writing.

The first commit separated scene.js and controls.js from a single-file prototype. One minute later, a fix for a forgotten import. The commit granularity is small — three minutes, six minutes, one decision per commit. The commit messages getting sloppier is interesting: "v006f," "7s," "del file," "moblie font h1 subtitle." When flow hits, hands move before notes get taken.

Navigation was rebuilt three times: side panel → center float → 3D orbs. But it still "looked like a rectangular UI button," so he prompted Gemini and got ghost-fire orbs. What's interesting is that before using Gemini, he spent five commits building the MCP server foundation — separating the API key into .env, disabling uv package mode, adding model selection and usage tracking. He builds the infrastructure for a tool before using the tool. And yet four minutes after finishing, the shader was already being integrated.

The shader versioning feels like a designer's workflow. v005, v006, v006b, v006c, v006d, v006e, v006f. Not code versions — design iterations. v006 brought in Gemini's shader, v006b stripped the Julia-set mask, v006c added two-axis transitions, v006d fixed UV-edge fading. Less like software releases, more like painting: "color this part, ah wait, erase it, keep only that bit."

Ten commits spent solely on dev-panel default values. camX: -14, camY: 0, camZ: 34. Export values as JSON, write them back to config.js. This round trip repeated over and over. Look at the number, touch it, change it again. No theory here. A 3D space can't be decided by spreadsheet numbers. Camera position is content itself. The dev panel with 13 toggles and sliders is this person's real testing environment. Not unit tests. "Look, touch, judge" is the test.

In the afternoon, gravitational lens orbs were implemented — glass spheres using MeshPhysicalMaterial transmission that distort the background. Three commits later, reverted to ghost fire. "Too much visual noise." Twelve minutes to revert. The decision criterion is distinctive: not "it doesn't work" but "it's too loud." Not evaluated by function. Evaluated by experience. Being able to try on a feature branch and choose not to merge into main — that's using git like a sketchbook.

From there, the breathing system was unified. HTML overlay opacity and FOV oscillation synchronized to a single sine wave. The entire screen began to breathe quietly. This part looks deliberate. Thirteen toggles lined up in a Bootstrap panel — he wanted every element under control. Containing the mess within structure.

That evening, config.js was redesigned as a single source of truth for all settings. The root cause: shader initial values diverging from dev-panel defaults. fluidForce, fluidCurl, haloColor — everything now flows from one source. This person has periodic intolerance for disorder. After a 31-commit creative burst, 35 minutes of silence, then the cleanup begins. Scatter → pause → tidy. A rhythm.

A quality audit by four AI agents: code review, testing, documentation, quality management. config-consistency.test.js verifies not "does it look right" but "do all config values match." Visual correctness in 3D can't be tested automatically. The test strategy itself changes for this kind of project. Visual testing by human eyes, data consistency by scripts, structural review by AI. Tools chosen to fit the work.

The next evening, it broke the moment it opened on mobile. Fifteen commits in fifty minutes. h1 font size, subtitle line-height, tagline text size, FOV correction, camera distance adjustment — something different broke with every device check. Commit messages at their sloppiest in this stretch. "moblie font h1 subtitle" — typo included. Hands couldn't keep up. The world built on desktop became something completely different on a small screen. 3D has a double layer of responsiveness: not just CSS font-size but camera FOV, distance, and aspect ratio all entangled.

A major decision was made here: OrbitControls was removed. The feature that lets you drag and rotate the 3D space with a mouse. On mobile, touch scroll conflicts — the page won't move. Two commits, phased: first disable zoom, then remove entirely. The "mobile first" principle took shape through discarding a feature. Similar to cutting a feature from an agile sprint backlog, except there's no product owner or scrum master. Everything done solo. Try, break, discard, move on.

After that, the metaphor "diving below the surface" emerged, and the whole scroll changed. Scrolling down lowers the camera's Y coordinate. Ghost-fire orbs disappear above the screen. The sensation of submerging underwater. This came out in six commits at one-minute intervals: dive layout, overlay fade, surface button, nav disable, label fade — when a concept descends, implementation won't stop.

The dev log was extracted from an i18n.js array into .md files — probably because he wanted to edit it himself. A state where text can be changed without touching code. Separating tools from content.

The scroll hint was fixed four times. CSS animation opacity was conflicting with JS opacity control. Finally unified with classList.add/remove and extracted into scroll-ui.js. Couldn't solve this one with logic alone. Trial and error is visible.

Looking at the whole picture, the commit history is itself a log of thinking. Enter through documentation, build structure, polish visuals, break it, polish again. Large creative bursts and short cleanup phases alternate. Testing is eyes and hands. Feature branches are sketchbooks. Reverts are design erasers. Agile without sprint planning, run solo.

Finally, quality locked down by four agents, then the next day everything redone for mobile. About one day of development converged into a single stable state. And then the scattering begins again.
