# Physical circuit adventure

The public `#game` route uses the electrical city missions as puzzles inside a miniature circuit. It does not mount `DeviceBoardController` or open a schematic editor. The old diagram modules remain for archived consumers and their model tests.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows | Move Ray in screen directions |
| Q | Cycle nearby parts, terminals and copper tracks |
| C | Select the nearest terminal directly |
| E / Enter / Space | Interact with the highlighted target; pick the first terminal and then the second |
| X / Delete | Remove only the highlighted track in rewiring missions |
| M | Read the selected component without editing it |
| Left / Right, Enter | Choose and apply a component setting |
| Escape | Close the setting chooser or cancel a pending connection |
| F / T | Test the actual electrical mission |
| H | Ask for a hint based on the current mission state |
| R | Reset a tripped protector |
| V | Toggle the overview, particularly useful on phones |
| L / N | Missions / next mission after success |

Touch controls execute the same actions and use the existing movement joystick. Looking at a remote object does not repair it: Ray must approach it first.

## Modules

- `WorldCircuit.js`: maps each electrical part to its own physical position, creates exact terminal identities, selects nearby targets and exposes valid part actions. Clinic loads are materialized as four separate branches matching its existing power rules.
- `WorldRoutes.js`: routes the real `board.wires` as orthogonal copper paths around bodies, penalizing shared runs and marking crossings separately from solder junctions.
- `WorldHints.js`: state-dependent diagnostic clues for the existing missions.
- `CityRayScene.js`: draws parts, solder pads, etched substrate, crossing bridges, the held connection preview and selection/hint rings. Lamps use the real circuit readings.
- `CityRayGame.js`: coordinates physical movement, keyboard/touch actions and mission completion.
- `CityRayHUD.js`: mission objective, plate, current target, local setting chooser and control legend. It contains no circuit editor.

Gate, street and station are rewiring puzzles; the other missions keep their circuit topology fixed and expose the original component settings, branch switches and source controls. Removing an essential load is not a substitute for solving those missions.

The environmental-puzzle direction is inspired by [Machinarium, Amanita Design](https://amanita-design.net/games/machinarium.html). Artwork is procedural Three.js geometry using this project's established olive, cream, brass and rust palette; no original game artwork is copied.

## Verification

`npm test` includes electrical-model and physical-layout checks. `npm run test:physical-circuit:browser` requires the local server on port 4173 and installed Chrome. It walks the first mission using keyboard events, connects its missing return path, cuts a selected bypass, replaces a resistor via keyboard, renders all twelve networks, and checks desktop/portrait/landscape layouts. Set `CIRCUIT_ARTIFACTS` to change the screenshot directory.
