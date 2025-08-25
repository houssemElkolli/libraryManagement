import React, { useState, useEffect, useRef } from "react";
import { Product } from "../../database/mysql";

interface CartItem extends Product {
    cartQuantity: number;
    subtotal: number;
}

const ShoppingCart: React.FC = () => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [totalPrice, setTotalPrice] = useState<number>(0);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const searchRef = useRef<HTMLInputElement>(null);

    searchRef.current?.focus();

    const handleSearchAndAddToCart = async (query: string) => {
        if (!query) return;

        setIsLoading(true);
        setErrorMessage(null);

        try {
            //@ts-ignore
            const result = await window.ipcRenderer.getProductByNameOrBarCode(
                query
            );
            const products = result.data as Product[];

            if (products.length > 0) {
                const foundProduct = products[0];

                setCartItems((prevItems) => {
                    const existingItemIndex = prevItems.findIndex(
                        (item) =>
                            item.id === foundProduct.id ||
                            item.bar_code === foundProduct.bar_code
                    );

                    let updatedCart: CartItem[];

                    if (existingItemIndex !== -1) {
                        const existingItem = prevItems[existingItemIndex];
                        const updatedItem: CartItem = {
                            ...existingItem,
                            cartQuantity: existingItem.cartQuantity + 1,
                            subtotal:
                                (existingItem.cartQuantity + 1) *
                                existingItem.price,
                        };

                        const itemsWithoutExisting = prevItems.filter(
                            (_, index) => index !== existingItemIndex
                        );

                        updatedCart = [updatedItem, ...itemsWithoutExisting];
                    } else {
                        const newCartItem: CartItem = {
                            ...foundProduct,
                            cartQuantity: 1,
                            subtotal: foundProduct.price,
                        };
                        updatedCart = [newCartItem, ...prevItems];
                    }
                    return updatedCart;
                });
                searchRef.current?.focus();
                setSearchQuery("");
            } else {
                setErrorMessage(
                    "Produit non trouvé. Veuillez vérifier le nom ou le code-barres."
                );
            }
        } catch (error) {
            console.error("Failed to search and add to cart:", error);
            setErrorMessage("Erreur générale. Veuillez réessayer.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearCart = () => {
        setSearchQuery("");
        setCartItems([]);
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            handleSearchAndAddToCart(searchQuery);
        }, 1000);

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery]);

    useEffect(() => {
        const total = cartItems.reduce(
            (acc, item) => acc + item.price * item.cartQuantity,
            0
        );
        setTotalPrice(total);
    }, [cartItems]);

    const handleQuantityChange = (id: number, quantity: number) => {
        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.id === id
                    ? {
                          ...item,
                          cartQuantity: quantity > 0 ? quantity : 1,
                          subtotal: (quantity > 0 ? quantity : 1) * item.price,
                      }
                    : item
            )
        );
    };

    const handleRemoveItem = (id: number) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
    };

    return (
        <div className="cart-container">
            <h2 className="section-title">Panier</h2>
            <input
                type="text"
                placeholder="Scannez un code-barres ou tapez le nom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                disabled={isLoading}
                ref={searchRef}
            />
            {errorMessage && (
                <p
                    className="error-message"
                    style={{ color: "red", marginTop: "10px" }}
                >
                    {errorMessage}
                </p>
            )}
            <div className="cart-summary">
                <strong className="cart-total-label">Prix total:</strong>
                <span className="cart-total-price">{totalPrice} DA</span>
                <button className="clear-cart-button" onClick={handleClearCart}>
                    Vider le panier
                </button>
            </div>
            {cartItems.length === 0 ? (
                <p className="empty-cart-message">Votre panier est vide.</p>
            ) : (
                <ul className="cart-list">
                    {cartItems.map((item) => (
                        <li key={item.id} className="cart-item">
                            <div className="cart-info">
                                <span className="cart-item-name">
                                    {item.name}
                                </span>
                                <span className="cart-item-price">
                                    {item.price} DA
                                </span>
                            </div>
                            <div className="cart-quantity-controls">
                                <button
                                    className="quantity-button"
                                    onClick={() =>
                                        handleQuantityChange(
                                            item.id,
                                            item.cartQuantity - 1
                                        )
                                    }
                                >
                                    -
                                </button>
                                <span className="cart-item-quantity">
                                    {item.cartQuantity}
                                </span>
                                <button
                                    className="quantity-button"
                                    onClick={() =>
                                        handleQuantityChange(
                                            item.id,
                                            item.cartQuantity + 1
                                        )
                                    }
                                >
                                    +
                                </button>
                            </div>
                            <span className="cart-item-subtotal">
                                {item.subtotal} DA
                            </span>
                            <button
                                className="remove-button"
                                onClick={() => handleRemoveItem(item.id)}
                            >
                                &times;
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ShoppingCart;
