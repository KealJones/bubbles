The fluid solver in `script.js` is adapted from Pavel Dobryakov's WebGL Fluid Simulation:
https://github.com/PavelDoGreat/WebGL-Fluid-Simulation

Copyright (c) 2017 Pavel Dobryakov. The original MIT license is included in `LICENSE`.

The embedded version uses automatic dye injection and stirring, with additional impulses
where bubbles merge. Bloom, sunrays, and shaded smoke lighting are disabled. The output
encodes bounded, advected dye values for the soap-film shader; continuously renewed dye
keeps the film visible without accumulating into white. The soap-film shader maps this
live fluid data to interference colors rather than showing a miniature fluid image.

The bubble renderer's smooth surface union and refractive rim profile are adapted from
Amazing Glass (Copyright (c) 2026 Ivan Tomac). Its MIT license is included at
`../amazing-glass-LICENSE.txt`.
