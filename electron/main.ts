import { app, BrowserWindow, ipcMain } from "electron";
// import { createRequire } from 'node:module'
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
    addProduct,
    getProducts,
    updateProduct,
    deleteProduct,
    getProductByNameOrBarCode,
} from "../src/database/mysql.ts";

// const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, "..");

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
    ? path.join(process.env.APP_ROOT, "public")
    : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
    win = new BrowserWindow({
        icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
        webPreferences: {
            preload: path.join(__dirname, "preload.mjs"),
        },
    });

    // Test active push message to Renderer-process.
    win.webContents.on("did-finish-load", () => {
        win?.webContents.send(
            "main-process-message",
            new Date().toLocaleString()
        );
    });

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL);
    } else {
        // win.loadFile('dist/index.html')
        win.loadFile(path.join(RENDERER_DIST, "index.html"));
    }
}

// IPC Handlers for the Database
// Add a new product to the database
ipcMain.handle("add-product", async (_, product) => {
    try {
        await addProduct(product);
        return { success: true };
    } catch (error) {
        console.error("Failed to add product:", error);
        const userError = (error as Error).message.includes('ER_DUP_ENTRY')
            ? "Un produit avec ce nom ou ce code-barres existe déjà."
            : "Échec de l'ajout du produit. Veuillez vérifier les informations.";
        return { success: false, error: userError };
    }
});

// Get all products from the database
ipcMain.handle("get-products", async (_, query) => {
    try {
        const products = await getProducts(query);
        return { success: true, data: products };
    } catch (error) {
        console.error("Failed to get products:", error);
        return { success: false, error: "Échec du chargement des produits." };
    }
});
// Get all products from the database
ipcMain.handle("get-product-by-name-or-bar-code", async (_, query) => {
    try {
        const products = await getProductByNameOrBarCode(query);
        return { success: true, data: products };
    } catch (error) {
        console.error("Failed to get product by name or barcode:", error);
        return { success: false, error: "Produit non trouvé ou erreur de recherche." };
    }
});

// Update an existing product
ipcMain.handle("update-product", async (_, product) => {
    try {
        await updateProduct(product);
        return { success: true };
    } catch (error) {
        console.error("Failed to update product:", error);
        const userError = (error as Error).message.includes('ER_DUP_ENTRY')
            ? "Un produit avec ce nom ou ce code-barres existe déjà."
            : "Échec de la mise à jour du produit. Veuillez vérifier les informations.";
        return { success: false, error: userError };
    }
});

// Delete a product by its ID
ipcMain.handle("delete-product", async (_, id) => {
    try {
        await deleteProduct(id);
        return { success: true };
    } catch (error) {
        console.error("Failed to delete product:", error);
        const userError = (error as Error).message.includes('ER_ROW_IS_REFERENCED')
            ? "Impossible de supprimer ce produit car il est lié à d'autres données."
            : "Échec de la suppression du produit. Veuillez réessayer.";
        return { success: false, error: userError };
    }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
        win = null;
    }
});

app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.whenReady().then(createWindow);
