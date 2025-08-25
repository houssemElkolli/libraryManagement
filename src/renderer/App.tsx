import React, { useState } from "react";
import ProductCRUD from "./components/ProductCRUD";
import ShoppingCart from "./components/ShoppingCart";
import "../App.css";
const App: React.FC = () => {
    // console.log("window.api:", window.api);
    const [currentView, setCurrentView] = useState<"crud" | "cart">("crud");

    return (
        <div className="container">
            <header className="header">
                <h1 className="title">Gestionnaire de produits</h1>
                <nav className="nav">
                    <button
                        className={`nav-button ${
                            currentView === "crud" ? "active" : ""
                        }`}
                        onClick={() => setCurrentView("crud")}
                    >
                        Gérer les produits
                    </button>
                    <button
                        className={`nav-button ${
                            currentView === "cart" ? "active" : ""
                        }`}
                        onClick={() => setCurrentView("cart")}
                    >
                        Panier d'achats
                    </button>
                </nav>
            </header>
            <main className="content">
                {currentView === "crud" ? <ProductCRUD /> : <ShoppingCart />}
            </main>
        </div>
    );
};

export default App;
