# AI Agent Instructions — zensand

## Project

Digital Zen Garden: a relaxing sand simulator website. A round ceramic plate (see plate-reference-image.jpg) ~80% filled with sand, viewed from an orbitable oblique side-down camera (360° around the plate, clamped elevation and zoom). Click to pour sand, drag a rake to carve furrows.

- Stack: Vite + TypeScript + Three.js
- Simulation: 2D height-field grid (sandpile / angle-of-repose toppling)
- Rendering: Three.js plane mesh displaced by the height field each frame
- Entry point: src/main.ts

## Rules

- Always keep project documentation up to date, including status.md (step statuses) whenever work is done or decisions are made.
- status.md is the source of truth for the plan and progress. Write it as plain statements of what the project is — not as decision history or references to previous discussions.
- Whenever updating any doc file, rewrite the text to describe the current decisions and how they function — never describe what a previous decision was or how it differs from the current one.
- Commit when a change worth committing has been made and it makes sense to do so (a coherent unit of work is complete), with a clear commit message.
