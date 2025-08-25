import { ipcRenderer, contextBridge } from "electron";

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("ipcRenderer", {
    on(...args: Parameters<typeof ipcRenderer.on>) {
        const [channel, listener] = args;
        return ipcRenderer.on(channel, (event, ...args) =>
            listener(event, ...args)
        );
    },
    off(...args: Parameters<typeof ipcRenderer.off>) {
        const [channel, ...omit] = args;
        return ipcRenderer.off(channel, ...omit);
    },
    send(...args: Parameters<typeof ipcRenderer.send>) {
        const [channel, ...omit] = args;
        return ipcRenderer.send(channel, ...omit);
    },
    invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
        const [channel, ...omit] = args;
        return ipcRenderer.invoke(channel, ...omit);
    },

    addProduct: (product: any) => ipcRenderer.invoke("add-product", product),

    getProducts: (query: string) => ipcRenderer.invoke("get-products", query),

    getProductByNameOrBarCode: (query: string) =>
        ipcRenderer.invoke("get-product-by-name-or-bar-code", query),

    updateProduct: (product: any) =>
        ipcRenderer.invoke("update-product", product),

    deleteProduct: (id: any) => ipcRenderer.invoke("delete-product", id),

    // You can expose other APTs you need here.
    // ...
});
