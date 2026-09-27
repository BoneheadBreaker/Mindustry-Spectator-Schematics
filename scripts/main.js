print("Spectator Schematics loaded");

// Settings Registry Storage Keys
const mobileGuiSetting = "spectator-schematics-mobile-gui";
const keybindSetting = "spectator-schematics-key";

// Mod State Tracking
let mobileGuiEnabled = true; 
let mobileButton = null;
let mobileMode = false;
let p1 = null;
let ignoreNextTouch = false;
let isRebinding = false;
let rebindButtonRef = null;

// Safe Java KeyCode Enum lookup fallbacks
let currentKeyName = Core.settings.getString(keybindSetting, "p");
let currentKeyCode = KeyCode.p;
try {
    currentKeyCode = KeyCode.valueOf(currentKeyName);
} catch(e) {
    currentKeyCode = KeyCode.p;
    currentKeyName = "p";
}

// Core Schematic Generation Macro
function createSchematic(x, y) {
    if (p1 === null) {
        p1 = { x: x, y: y };
        Vars.ui.hudfrag.showToast("Corner 1 set - select corner 2");
    } else {
        let s = Vars.schematics.create(
            Math.min(p1.x, x),
            Math.min(p1.y, y),
            Math.max(p1.x, x),
            Math.max(p1.y, y)
        );

        p1 = null;
        mobileMode = false;
        updateMobileButton();

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
                Vars.ui.hudfrag.showToast("Saved " + s.tiles.size + " blocks!");

                mobileMode = false;
                p1 = null;
                updateMobileButton();
            }
        );
    }
}

// Unified Update Loop for Hotkeys and Rebinding Capture
Events.run(Trigger.update, () => {
    // 1. Rebind Capture System (Runs when waiting for a keypress in settings)
    if (isRebinding && rebindButtonRef != null) {
        let keys = KeyCode.values();
        for (let i = 0; i < keys.length; i++) {
            if (Core.input.keyTap(keys[i])) {
                currentKeyCode = keys[i];
                currentKeyName = keys[i].toString();
                
                // Save settings permanently
                Core.settings.put(keybindSetting, currentKeyName);
                rebindButtonRef.setText(currentKeyName.toUpperCase());
                
                isRebinding = false; // Turn off capturing mode
                break;
            }
        }
        return; // Prevent triggering the macro while choosing a key bind
    }

    // 2. Standard Keybind Trigger Action Listener
    if (Core.scene && Core.scene.getKeyboardFocus() != null) return;

    if (Core.input.keyTap(currentKeyCode)) {
        let x = Math.round(Core.input.mouseWorldX() / Vars.tilesize);
        let y = Math.round(Core.input.mouseWorldY() / Vars.tilesize);
        createSchematic(x, y);
    }
});

// Build the Settings layout category button natively into the pause/escape dialog container
Events.on(ClientLoadEvent, () => {
    mobileGuiEnabled = Core.settings.getBool(mobileGuiSetting, true);

    Vars.ui.settings.addCategory(
        "Spectator Schematics", 
        Icon.settings, 
        new Cons({
            get: function(table) {
                table.add("--- Spectator Schematics Settings ---").color(Color.gold).padBottom(10);
                table.row();

                // 1. Toggle Checkbox Layout row
                table.check("Enable HUD Button GUI", mobileGuiEnabled, new Boolc({
                    get: function(enabled) {
                        mobileGuiEnabled = enabled;
                        Core.settings.put(mobileGuiSetting, enabled);
                        if (mobileButton != null) {
                            mobileButton.visible = enabled;
                        }
                    }
                })).left().padTop(5);
                
                table.row();

                // 2. Safe Rebind Layout Interface Row Configuration
                table.table(null, row => {
                    row.add("Trigger Key Code: ").left().color(Color.lightGray);
                    
                    let rebindBtn = row.button(currentKeyName.toUpperCase(), Styles.flatt, new java.lang.Runnable({ run: function() {} })).width(160).height(40).get();
                    
                    rebindBtn.clicked(new java.lang.Runnable({
                        run: function() {
                            rebindBtn.setText("PRESS ANY KEY...");
                            rebindButtonRef = rebindBtn; // Pass reference to global loop
                            isRebinding = true; // Tell standard loop to capture next input
                        }
                    }));
                }).left().padTop(10);
            }
        })
    );

    // Render the Standalone On-Screen Mobile Layout Element 
    Timer.schedule(new java.lang.Runnable({
        run: function() {
            if (Vars.ui && Vars.ui.hudGroup) {
                mobileButton = new Table();
                mobileButton.background(Styles.black6);
                mobileButton.bottom().left().margin(15); 
                mobileButton.setSize(240, 50);
                mobileButton.setPosition(30, 30);

                updateMobileButton();
                
                Vars.ui.hudGroup.addChild(mobileButton);
                mobileButton.visible = mobileGuiEnabled;
            }
        }
    }), 1.0);
});

// Update Mobile Overlay Buttons Text Node Tree Layout
function updateMobileButton() {
    if (mobileButton === null) return;
    mobileButton.clearChildren();

    let labelText = mobileMode ? "Cancel Schematic" : "Spectator Schematics";
    mobileButton.button(labelText, Styles.flatt, new java.lang.Runnable({
        run: function() {
            toggleMobileMode();
        }
    })).grow();
}

function toggleMobileMode() {
    mobileMode = !mobileMode;
    if (mobileMode) {
        p1 = null;
        Vars.ui.hudfrag.showToast("Tap the first corner");
    } else {
        p1 = null;
        Vars.ui.hudfrag.showToast("Schematic selection cancelled");
    }
    ignoreNextTouch = true;
    updateMobileButton();
}

// Continuous Screen Interaction Tap Track Listener loop
Events.run(Trigger.update, () => {
    if (!mobileMode) return;

    if (ignoreNextTouch) {
        if (!Core.input.justTouched()) {
            ignoreNextTouch = false;
        }
        return;
    }

    if (!Core.input.justTouched()) return;

    let x = Math.round(Core.input.mouseWorldX() / Vars.tilesize);
    let y = Math.round(Core.input.mouseWorldY() / Vars.tilesize);

    createSchematic(x, y);
});
