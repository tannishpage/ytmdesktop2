import { contextBridge, ipcRenderer } from "electron";
import pkg from "../package.json";

export default {
  ipcRenderer: {
    emit: (event, ...data) => ipcRenderer.send(event, ...data),
    emitTo: (id, event, ...data) => ipcRenderer.sendTo(id, event, ...data),
    on: (channel, func) => ipcRenderer.on(channel, func),
    invoke: (channel, ...data) => ipcRenderer.invoke(channel, ...data),
    appVersion: pkg.version,
  },
  process: {
    version: pkg.version,
    environment: process.env.NODE_ENV,
    platform: process.platform
  },
  api: {
    version: pkg.version,
    plugins: [],
    settings: {
      open: () => ipcRenderer.send("settings.show"),
      close: () => ipcRenderer.send("settings.close"),
    },
    installUpdate: () => ipcRenderer.send("app.installUpdate"),
    checkUpdate: () => ipcRenderer.send("app.checkUpdate"),
    settingsProvider: {
      getAll: (defaultValue) =>
        ipcRenderer.invoke("settingsProvider.getAll", defaultValue),
      get: (key, defaultValue) =>
        ipcRenderer.invoke("settingsProvider.get", key, defaultValue),
      set: (key, value) =>
        new Promise((resolve) => {
          return resolve(ipcRenderer.send("settingsProvider.set", key, value));
        }),
      update: (key, value) =>
        ipcRenderer.invoke("settingsProvider.update", key, value),
      save: () => ipcRenderer.send("settingsProvider.save")
    },
    minimize: () => ipcRenderer.send("app.minimize"),
    maximize: () => ipcRenderer.send("app.maximize"),
    quit: () => ipcRenderer.send("app.quit"),
    action: (event, ...data) => ipcRenderer.invoke(`action:${event}`, ...data),
    invoke: (event, ...data) => ipcRenderer.invoke(event, ...data),
    emit: (event, ...data) => ipcRenderer.send(event, ...data),
    emitTo: (id, event, ...data) => ipcRenderer.sendTo(id, event, ...data),
    on: (channel, func) => ipcRenderer.on(channel, func),
  },
};
