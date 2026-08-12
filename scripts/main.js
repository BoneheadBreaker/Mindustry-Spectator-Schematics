print("Spectator Schematics loaded");

const spectatorSchematic = KeyBind.add(
    "spectator-schematic",
    KeyCode.p,
    "spectator-schematics"
);

let p1 = null;

Events.run(Trigger.update, () => {

    if (Core.input.keyTap(spectatorSchematic)) {

        let x = Math.round(
            Core.input.mouseWorldX() / Vars.tilesize
        );

        let y = Math.round(
            Core.input.mouseWorldY() / Vars.tilesize
        );

        if (p1 === null) {

            // First corner
            p1 = {
                x: x,
                y: y
            };

            Vars.ui.hudfrag.showToast(
                "Corner 1 set - press the key again for corner 2"
            );

        } else {

            // Second corner
            let s = Vars.schematics.create(
                Math.min(p1.x, x),
                Math.min(p1.y, y),
                Math.max(p1.x, x),
                Math.max(p1.y, y)
            );

            // Prepare for next scheme
            p1 = null;

            Vars.ui.showTextInput(
                "Schematic Name",
                "Enter a name:",
                40,
                "",
                false,
                n => {

                    if (n.length > 0) {
                        s.tags.put("name", n);
                    }

                    Vars.schematics.add(s);

                    Vars.ui.hudfrag.showToast(
                        "Saved " + s.tiles.size + " blocks!"
                    );
                }
            );
        }
    }
});

Vars.ui.hudfrag.showToast(
    "Press your Spectator Schematic key for first corner"
);