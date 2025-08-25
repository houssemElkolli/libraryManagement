import React, { useState, useEffect } from "react";
import { Product } from "../../database/mysql";

const ProductCRUD: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [formState, setFormState] = useState({
        id: 0,
        name: "",
        bar_code: "",
        price: "",
    });
    const [isEditing, setIsEditing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        if (errorMessage || successMessage) {
            const timer = setTimeout(() => {
                setErrorMessage(null);
                setSuccessMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [errorMessage, successMessage]);

    const fetchProducts = async (query = "") => {
        setErrorMessage(null);
        setSuccessMessage(null);
        try {
            //@ts-ignore
            const result = await window.ipcRenderer.getProducts(query);

            if (Array.isArray(result)) {
                setProducts(result);
            } else if (result.success) {
                setProducts(result.data);
            } else {
                console.error(
                    "Failed to fetch products:",
                    result.error || "Unknown error"
                );
                setErrorMessage(
                    "Échec du chargement des produits. Veuillez vérifier la connexion à la base de données."
                );
            }
        } catch (error) {
            console.error("Unexpected error fetching products:", error);
            setErrorMessage(
                "Une erreur inattendue est survenue lors du chargement des produits."
            );
        }
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchProducts(searchQuery);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState({ ...formState, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        const productData = {
            name: formState.name,
            price: parseFloat(formState.price),
            bar_code: formState.bar_code,
        };

        try {
            let result;
            if (isEditing) {
                //@ts-ignore
                result = await window.ipcRenderer.updateProduct({
                    id: formState.id,
                    ...productData,
                });
            } else {
                //@ts-ignore
                result = await window.ipcRenderer.addProduct(productData);
            }

            if (result.success) {
                setSuccessMessage(
                    isEditing
                        ? "Produit mis à jour avec succès !"
                        : "Produit ajouté avec succès !"
                );
                setFormState({ id: 0, name: "", bar_code: "", price: "" });
                setIsEditing(false);
                fetchProducts();
            } else {
                console.error("Failed to save product:", result.error);

                if (
                    result.error.includes("ER_DUP_ENTRY") ||
                    result.error.includes("SQLITE_CONSTRAINT_UNIQUE")
                ) {
                    setErrorMessage(
                        "Un produit avec ce nom ou ce code-barres existe déjà."
                    );
                } else {
                    setErrorMessage(
                        result.error ||
                            "Échec de la sauvegarde du produit. Veuillez vérifier les informations."
                    );
                }
            }
        } catch (error) {
            console.error("Unexpected error saving product:", error);
            setErrorMessage(
                "Une erreur inattendue est survenue lors de la sauvegarde du produit."
            );
        }
    };

    const handleEdit = (product: Product) => {
        setErrorMessage(null);
        setSuccessMessage(null);
        setFormState({
            id: product.id,
            name: product.name,
            bar_code: product.bar_code,
            price: product.price.toString(),
        });
        setIsEditing(true);
    };

    const handleDelete = async (id: number) => {
        setErrorMessage(null);
        setSuccessMessage(null);
        try {
            //@ts-ignore
            const result = await window.ipcRenderer.deleteProduct(id);
            if (result.success) {
                setSuccessMessage("Produit supprimé avec succès !");
                fetchProducts();
            } else {
                console.error("Failed to delete product:", result.error);
                setErrorMessage(
                    result.error ||
                        "Échec de la suppression du produit. Veuillez réessayer."
                );
            }
        } catch (error) {
            console.error("Unexpected error deleting product:", error);
            setErrorMessage(
                "Une erreur inattendue est survenue lors de la suppression."
            );
        }
    };

    return (
        <div className="crud-container">
            <h2 className="section-title">
                {isEditing
                    ? "Modifier un produit"
                    : "Ajouter un nouveau produit"}
            </h2>
            {errorMessage && (
                <p
                    className="error-message"
                    style={{
                        color: "red",
                        marginTop: "10px",
                        fontWeight: "bold",
                    }}
                >
                    {errorMessage}
                </p>
            )}
            {successMessage && (
                <p
                    className="success-message"
                    style={{
                        color: "green",
                        marginTop: "10px",
                        fontWeight: "bold",
                    }}
                >
                    {successMessage}
                </p>
            )}
            <form onSubmit={handleSubmit} className="crud-form">
                <input
                    type="text"
                    name="name"
                    value={formState.name}
                    onChange={handleInputChange}
                    placeholder="Nom du produit"
                    required
                />
                <input
                    type="number"
                    name="price"
                    value={formState.price}
                    onChange={handleInputChange}
                    placeholder="Prix"
                    step="0.01"
                    required
                />
                <input
                    type="text"
                    name="bar_code"
                    value={formState.bar_code}
                    onChange={handleInputChange}
                    placeholder="Code Barre"
                    required
                />

                <button type="submit" className="form-button">
                    {isEditing
                        ? "Mettre à jour le produit"
                        : "Ajouter un produit"}
                </button>
                {isEditing && (
                    <button
                        type="button"
                        className="form-button form-button-cancel"
                        onClick={() => {
                            setIsEditing(false);
                            setFormState({
                                id: 0,
                                name: "",
                                bar_code: "",
                                price: "",
                            });
                            setErrorMessage(null);
                            setSuccessMessage(null);
                        }}
                    >
                        Annuler
                    </button>
                )}
            </form>

            <h2 className="section-title">Liste des produits</h2>
            <input
                type="text"
                placeholder="Rechercher par nom ou code barre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
            />
            <ul className="product-list">
                {products.length === 0 && !errorMessage ? (
                    <p>Aucun produit trouvé.</p>
                ) : (
                    products.map((product) => (
                        <li key={product.id} className="product-item">
                            <div className="product-info-group">
                                <span className="product-name">
                                    <strong>{product.name}</strong>
                                </span>
                                <span className="product-price">
                                    Prix:{" "}
                                    <span className="price-value">
                                        {product.price} DA
                                    </span>
                                </span>
                                <span className="product-barcode">
                                    Code barre:{" "}
                                    <span className="barcode-value">
                                        {product.bar_code}
                                    </span>
                                </span>
                                <span className="product-barcode">
                                    Ajouté:{" "}
                                    <span className="barcode-value">
                                        {product.created_at
                                            ? new Date(
                                                  product.created_at
                                              ).toLocaleDateString("fr-FR")
                                            : "N/A"}
                                    </span>
                                </span>
                                <span className="product-barcode">
                                    Modifié:{" "}
                                    <span className="barcode-value">
                                        {product.updated_at
                                            ? new Date(
                                                  product.updated_at
                                              ).toLocaleDateString("fr-FR")
                                            : "non Modifié"}
                                    </span>
                                </span>
                            </div>
                            <div className="product-actions">
                                <button
                                    className="action-button edit"
                                    onClick={() => handleEdit(product)}
                                >
                                    Modifier
                                </button>
                                <button
                                    className="action-button delete"
                                    onClick={() => handleDelete(product.id)}
                                >
                                    Supprimer
                                </button>
                            </div>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
};

export default ProductCRUD;
