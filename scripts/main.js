print("Spectator Schematics loaded");

// Settings

const mobileGuiSetting = "spectator-schematics-mobile-gui";

let mobileGuiEnabled = false;

let mobileButton = null;
let mobileMode = false;
let p1 = null;

let ignoreNextTouch = false;


// Keybind

const spectatorSchematic = KeyBind.add(
    "spectator-schematic",
    KeyCode.p,
    "spectator-schematics"
);


// Create the schematic

function createSchematic(x, y) {

    if (p1 === null) {

        // First corner
        p1 = {
            x: x,
            y: y
        };

        Vars.ui.hudfrag.showToast(
            "Corner 1 set - select corner 2"
        );

    } else {

        // Second corner
        let s = Vars.schematics.create(
            Math.min(p1.x, x),
            Math.min(p1.y, y),
            Math.max(p1.x, x),
            Math.max(p1.y, y)
        );

        // Reset corner selection
        p1 = null;

        mobileMode = false;
        updateMobileButton();

        // Ask for schematic name
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

                // Actually save the schematic
                Vars.schematics.add(s);

                Vars.ui.hudfrag.showToast(
                    "Saved " + s.tiles.size + " blocks!"
                );

                // Make sure mobile mode stays off
                mobileMode = false;
                p1 = null;
                updateMobileButton();
            }
        );
    }
}


// Keybind

Events.run(Trigger.update, () => {

    if (Core.input.keyTap(spectatorSchematic)) {

        let x = Math.round(
            Core.input.mouseWorldX() / Vars.tilesize
        );

        let y = Math.round(
            Core.input.mouseWorldY() / Vars.tilesize
        );

        createSchematic(x, y);
    }
});


// Mobile Button

function updateMobileButton() {

    if (mobileButton === null) return;

    mobileButton.clearChildren();

    if (mobileMode) {

        mobileButton.add("Cancel Schematic")
            .grow()
            .center();

    } else {

        mobileButton.add("Spectator Schematics")
            .grow()
            .center();
    }
}


function setMobileGuiVisible(visible) {

    mobileGuiEnabled = visible;

    if (mobileButton === null) return;

    mobileButton.visible = visible;

    mobileButton.touchable = visible
        ? Touchable.enabled
        : Touchable.disabled;

    if (!visible) {

        mobileMode = false;
        p1 = null;
    }

    updateMobileButton();
}


function toggleMobileMode() {

    mobileMode = !mobileMode;

    if (mobileMode) {

        p1 = null;

        Vars.ui.hudfrag.showToast(
            "Tap the first corner"
        );

    } else {

        p1 = null;

        Vars.ui.hudfrag.showToast(
            "Schematic selection cancelled"
        );
    }

    // Dont let turning it on via the gui count as a click
    ignoreNextTouch = true;

    updateMobileButton();
}


// Settings

Events.on(ClientLoadEvent, () => {

    mobileGuiEnabled = Core.settings.getBool(
        mobileGuiSetting,
        false
    );

    Vars.ui.settings.addCategory(
        "Spectator Schematics",
        table => {

            table.checkPref(
                "Enable GUI",
                false,
                enabled => {

                    mobileGuiEnabled = enabled;

                    setMobileGuiVisible(enabled);
                }
            );
        }
    );
});


// Create Gui

Events.on(ClientLoadEvent, () => {

    mobileButton = new Table();

    mobileButton.background(Styles.black6);

    mobileButton.setSize(
        240,
        60
    );

    mobileButton.setPosition(
        20,
        20
    );

    mobileButton.touchable = mobileGuiEnabled
        ? Touchable.enabled
        : Touchable.disabled;

    mobileButton.clicked(() => {

        toggleMobileMode();

    });

    Vars.ui.hudGroup.addChild(
        mobileButton
    );

    mobileButton.visible = mobileGuiEnabled;

    updateMobileButton();
});

// Gui

Events.run(Trigger.update, () => {

    if (!mobileGuiEnabled) return;
    if (!mobileMode) return;

    // Ignore the touch that activated the button.
    if (ignoreNextTouch) {

        if (!Core.input.justTouched()) {
            ignoreNextTouch = false;
        }

        return;
    }

    if (!Core.input.justTouched()) return;

    let x = Math.round(
        Core.input.mouseWorldX() / Vars.tilesize
    );

    let y = Math.round(
        Core.input.mouseWorldY() / Vars.tilesize
    );

    createSchematic(x, y);
});