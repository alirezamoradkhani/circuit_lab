# Desktop adventure interaction review — 2026-10-09

## Research and limits

This is an original implementation in the existing Three.js component engine. Commercial games below are design references, not source-code audits. No GPL code or commercial assets were copied.

- [Machinarium, Amanita Design](https://amanita-design.net/games/machinarium.html): environmental logic and object collection are central to the adventure. Application: inspection should reveal physical observations; explicit help may reveal a solution, ordinary selection should not.
- [The Room, Fireproof](https://www.fireproofgames.com/games/the-room): tactile mechanisms and discovery through manipulating objects. Application: show the provisional cable and the physical result, rather than silently apply an operation.
- [SHENZHEN I/O, Zachtronics](https://www.zachtronics.com/shenzhen-io/): construction and experimentation within constraints. Application: keep multiple viable power routes and make overloading a recoverable experiment. We do not import its manual-heavy presentation.
- [Arcweave's open-source Godot adventure example](https://github.com/Arcweave/arcweave-godot-adventure-example): the repository's implementation explanation maps clicks to a navigation path and separates player, locations, and interactive objects. Application: selection is immediate; committing a physical action queues navigation then execution.
- [CircuitJS1 mouse handling](https://raw.githubusercontent.com/sharpie7/circuitjs1/master/src/com/lushprojects/circuitjs1/client/CirSim.java): inspected onMouseDown/onMouseUp, temporary mouse modes, drag lifecycle, and endpoint manipulation. Application: cable drafts have their own state and commit/cancel lifecycle, independent of selected objects. Our code is original and does not implement an electrical schematic editor.

These observations support interaction choices; they do not establish that our game is fun. That requires playtesting by someone who does not already know the solution.

## Problems found in our code

- Hand selection also walked and could collect objects; users could not distinguish inspection from execution.
- Action menus only appeared within reach; remote commands could silently do nothing.
- Selection doubled as a pending cable endpoint. Repeating a connection deleted it.
- Cable dragging was ignored; there was no provisional wire or compatibility feedback.
- Bottom horizontal action rows required searching and displaced tool/feedback space.
- Market's intro, objective, status and vendor dialogue exposed the solution; the actual wind direction was less legible than those instructions.
- The market's old 24 W supply allowed all three distraction devices and the latch to run simultaneously.

## Implemented contract

1. Select an object to inspect it immediately without walking or modifying it. Exit markers remain navigation targets.
2. Choose a verb in the compact right inspector; Ray walks into reach, then the command is revalidated and executed. Selecting another object, walking manually or switching tools cancels the walk. No automatic key pickup on inspection.
3. Cable mode is separate: drag endpoints or click each endpoint. Compatible means structurally connectable, not a promise that a puzzle's voltage, energy or power budget will work.
4. Preview draft while moving the mouse; invalid endpoints explain why and retain the draft. Esc/right-click cancels. Reconnecting the same pair is idempotent. Disconnect a named connection explicitly.
5. Read-only meter mode does not walk, connect or execute actions.
6. Keep feedback below the scene. Desktop inspector has a fixed side column; narrow portrait uses a bottom area, short landscape keeps a side column. No inspector overlays the world.
7. Show hover name/ring, fan direction, and a moving guard's attention arrow in world space. Market fan model orientation matches those directions.
8. Market supply is 9 W, fan 6 W, sign 3 W, dock/latch 6 W. The paper and charging routes both remain valid. Powering everything fails; after taking the key, reallocate mains or use a battery. The key remains collected, so recovery is safe.
9. Ordinary market observations describe state and behavior. Detailed instructions remain in voluntary progressive help.

## Modules and scope

- `engine/CableTool.js`: draft, validation, idempotent connection.
- `levels/runtime/CampaignInteractions.js`: orchestration, queued physical actions, meter, explicit disconnection.
- `ui/ObjectInspector.js`: short contextual action list and cable list.
- `visual/SceneFeedback.js`: shared world-space affordances.
- `GameInput.js`: pointer drag/click/cancel adapter shared with legacy workshop; new cable behavior is feature-detected.

Shared campaign interaction changes cover stages 2–12. Stage 1 retains its legacy workshop interaction class; we do not claim it was migrated to the new inspector. Only stage 3's puzzle balance and clue writing are revised here; remaining stages are not claimed to have been redesigned.

## Verification

- `npm test`: lab, city, workshop, components and all campaign logic, including both market routes, all-on overload/recovery and cable draft invariants.
- `npm run test:campaign:browser`: actual mouse workflows, route completion and save/replay, desktop/mobile/short-landscape layout checks, plus drag/cancel/unplug/meter integration.
- `npm run test:browser`: legacy workshop mouse regression.
- Screenshots are development artifacts in `.test-artifacts`, not distributed assets.
