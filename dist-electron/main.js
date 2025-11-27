import { app as r, ipcMain as g, clipboard as a, nativeImage as h, globalShortcut as u, BrowserWindow as y, screen as S } from "electron";
import c from "path";
import { fileURLToPath as A } from "url";
import x from "fs";
const T = A(import.meta.url), f = c.dirname(T);
let e = null, n = [], d = "", p = "";
r.disableHardwareAcceleration();
function b() {
  console.log("Creating window...");
  let t;
  const o = [
    c.join(f, "preload.js"),
    c.join(f, "preload.mjs"),
    c.join(f, "preload.cjs")
  ];
  for (const s of o)
    if (x.existsSync(s)) {
      t = s, console.log("Found preload at:", t);
      break;
    }
  if (t || (console.error("No preload script found!"), t = o[0]), e = new y({
    width: 450,
    height: 650,
    show: !1,
    alwaysOnTop: !0,
    frame: !1,
    skipTaskbar: !0,
    transparent: !1,
    resizable: !0,
    minimizable: !1,
    maximizable: !1,
    fullscreenable: !1,
    focusable: !0,
    movable: !0,
    backgroundColor: "#00000000",
    // macOS specific settings for better floating
    ...process.platform === "darwin" ? {
      titleBarStyle: "hidden",
      vibrancy: "under-window",
      visualEffectState: "active",
      type: "panel"
    } : {
      thickFrame: !1
    },
    webPreferences: {
      preload: t,
      nodeIntegration: !1,
      contextIsolation: !0,
      webSecurity: !1,
      backgroundThrottling: !1
    }
  }), m(), process.env.VITE_DEV_SERVER_URL)
    console.log("Loading dev server:", process.env.VITE_DEV_SERVER_URL), e.loadURL(process.env.VITE_DEV_SERVER_URL), e.webContents.openDevTools();
  else {
    const s = c.join(f, "../dist/index.html");
    console.log("Loading production:", s), e.loadFile(s);
  }
  e.on("show", () => {
    console.log("Window shown, reapplying floating settings"), m(), e == null || e.focus();
  }), e.on("blur", () => {
    setTimeout(() => {
      e && !e.webContents.isDevToolsOpened() && e.isVisible() && (console.log("Window lost focus, hiding..."), e.hide());
    }, 150);
  }), e.on("ready-to-show", () => {
    console.log("Window is ready to show");
  }), e.on("focus", () => {
    console.log("Window focused");
  }), e.on("closed", () => {
    e = null;
  });
}
function m() {
  if (e)
    if (console.log("Applying floating settings..."), process.platform === "darwin")
      try {
        e.setAlwaysOnTop(!0, "floating", 1), e.setVisibleOnAllWorkspaces(!0, {
          visibleOnFullScreen: !0
        }), e.setFullScreenable(!1), e.setHasShadow(!0), e.setFocusable(!0), console.log("macOS floating settings applied");
      } catch (t) {
        console.log("Error applying macOS floating settings:", t), e.setAlwaysOnTop(!0), e.setVisibleOnAllWorkspaces(!0);
      }
    else if (process.platform === "win32")
      try {
        e.setAlwaysOnTop(!0, "screen-saver"), e.setVisibleOnAllWorkspaces(!0), e.setFocusable(!0), console.log("Windows floating settings applied");
      } catch (t) {
        console.log("Error applying Windows floating settings:", t), e.setAlwaysOnTop(!0);
      }
    else
      try {
        e.setAlwaysOnTop(!0), e.setVisibleOnAllWorkspaces(!0), e.setFocusable(!0), console.log("Linux floating settings applied");
      } catch (t) {
        console.log("Error applying Linux floating settings:", t);
      }
}
g.handle("get-history", () => n);
g.handle("copy-text", (t, o) => {
  a.writeText(o), d = o;
  const s = {
    id: Date.now(),
    text: o,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  return n.unshift(s), n.length > 300 && (n = n.slice(0, 300)), e == null || e.webContents.send("history-update", n), !0;
});
g.handle("copy-image", (t, o) => {
  const s = h.createFromDataURL(o);
  a.writeImage(s), p = o;
  const i = {
    id: Date.now(),
    image: o,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  n.unshift(i), n.length > 300 && (n = n.slice(0, 300)), e == null || e.webContents.send("history-update", n);
});
g.handle("clear-history", () => {
  n = [], d = "", p = "", e == null || e.webContents.send("history-update", n);
});
g.handle("paste-item", async (t, o) => {
  if (o.text) {
    a.writeText(o.text), d = o.text, console.log("Text copied to clipboard, preparing to paste..."), e == null || e.hide(), await new Promise((i) => setTimeout(i, 300));
    let s = !1;
    if (process.platform === "darwin")
      try {
        const { exec: i } = await import("child_process");
        i(`osascript -e '
          tell application "System Events"
            delay 0.1
            keystroke "v" using command down
          end tell
        '`, (l) => {
          l ? console.log("AppleScript paste failed:", l) : (console.log("✓ AppleScript paste succeeded"), s = !0);
        }), await new Promise((l) => setTimeout(l, 200));
      } catch (i) {
        console.log("AppleScript execution failed:", i);
      }
    else if (process.platform === "win32")
      try {
        const { exec: i } = await import("child_process");
        i(`powershell -command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v')"`), console.log("✓ Windows paste command sent"), s = !0;
      } catch (i) {
        console.log("Windows paste failed:", i);
      }
    else
      try {
        const { exec: i } = await import("child_process");
        i("xdotool key ctrl+v"), console.log("✓ Linux paste command sent"), s = !0;
      } catch (i) {
        console.log("Linux paste failed:", i);
      }
    s || console.log("Auto-paste not attempted or failed");
  }
  o.image && (a.writeImage(h.createFromDataURL(o.image)), p = o.image, e == null || e.hide(), console.log("Image copied to clipboard"));
});
setInterval(() => {
  if (!e) return;
  const t = a.readText().trim();
  if (t && t !== d && t.length > 0) {
    console.log("New text detected:", t.substring(0, 50) + "...");
    const s = {
      id: Date.now(),
      text: t,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    n.unshift(s), d = t, n.length > 300 && (n = n.slice(0, 300)), e.webContents.send("history-update", n);
  }
  const o = a.readImage();
  if (!o.isEmpty()) {
    const s = o.toDataURL();
    if (s && s !== p) {
      console.log("New image detected");
      const i = {
        id: Date.now(),
        image: s,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      n.unshift(i), p = s, n.length > 300 && (n = n.slice(0, 300)), e.webContents.send("history-update", n);
    }
  }
}, 800);
const v = () => {
  if (e)
    if (e.isVisible())
      e.hide();
    else {
      console.log("Showing window..."), m(), e.show(), e.focus();
      const t = S.getPrimaryDisplay(), { width: o, height: s } = t.workAreaSize, i = e.getBounds(), w = Math.round((o - i.width) / 2), l = Math.round((s - i.height) / 2);
      e.setPosition(w, l), console.log("Window shown and focused");
    }
};
r.whenReady().then(() => {
  console.log("App is ready"), b();
  const t = process.platform === "darwin" ? "Command+Shift+V" : "Ctrl+Shift+V";
  u.register(t, v) ? console.log(`Global shortcut registered: ${t}`) : console.error(`Failed to register shortcut: ${t}`), u.register("Escape", () => {
    e != null && e.isVisible() && e.hide();
  });
});
r.on("window-all-closed", () => {
  process.platform !== "darwin" && r.quit();
});
r.on("activate", () => {
  y.getAllWindows().length === 0 && b();
});
r.on("will-quit", () => {
  u.unregisterAll();
});
