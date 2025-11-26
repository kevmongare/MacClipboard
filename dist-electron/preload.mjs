"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  getHistory: () => electron.ipcRenderer.invoke("get-history"),
  copyText: (text) => electron.ipcRenderer.invoke("copy-text", text),
  copyImage: (data) => electron.ipcRenderer.invoke("copy-image", data),
  clearHistory: () => electron.ipcRenderer.invoke("clear-history"),
  onUpdate: (callback) => electron.ipcRenderer.on("history-update", (_, data) => callback(data))
});
