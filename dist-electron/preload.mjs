"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(
      channel,
      (event, ...args2) => listener(event, ...args2)
    );
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  },
  addProduct: (product) => electron.ipcRenderer.invoke("add-product", product),
  getProducts: (query) => electron.ipcRenderer.invoke("get-products", query),
  getProductByNameOrBarCode: (query) => electron.ipcRenderer.invoke("get-product-by-name-or-bar-code", query),
  updateProduct: (product) => electron.ipcRenderer.invoke("update-product", product),
  deleteProduct: (id) => electron.ipcRenderer.invoke("delete-product", id)
  // You can expose other APTs you need here.
  // ...
});
