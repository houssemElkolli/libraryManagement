import mysql, { ResultSetHeader, RowDataPacket } from "mysql2/promise";

const dbConfig = {
    host: "localhost",
    user: "root",
    password: "",
    database: "librarymanagement",
};

const getConnection = async () => {
    return await mysql.createConnection(dbConfig);
};

export interface Product {
    id: number;
    name: string;
    bar_code: string;
    price: number;
    created_at?: Date;
    updated_at?: Date;
}

// Add a new product to the database
export const addProduct = async (product: Omit<Product, "id">) => {
    const connection = await getConnection();
    const [result] = await connection.execute<ResultSetHeader>(
        "INSERT INTO products (name, bar_code, price) VALUES (?, ? , ?)",
        [product.name, product.bar_code, product.price]
    );
    connection.end();
    return result;
};

// Get all products from the database
export const getProducts = async (query = ""): Promise<Product[]> => {
    const connection = await getConnection();
    let sql = "SELECT * FROM products";
    const params = [];

    if (query) {
        sql += " WHERE name LIKE ? OR bar_code LIKE ?";
        const likeQuery = `${query}%`;
        params.push(likeQuery, likeQuery);
    }

    sql += " ORDER BY created_at DESC";

    const [rows] = await connection.execute<RowDataPacket[]>(sql, params);
    connection.end();
    return rows as Product[];
};
// Get a product by its name or barcode
// If no exact match is found, it returns the first product that matches the query
export const getProductByNameOrBarCode = async (
    query: string
): Promise<Product[]> => {
    const connection = await getConnection();
    let sql = "SELECT * FROM products WHERE name = ? OR bar_code = ?  ";
    const params = [];
    params.push(query, query);
    const [rows] = await connection.execute<RowDataPacket[]>(sql, params);

    if (rows.length > 0) {
        connection.end();
        return rows as Product[];
    } else {
        const paramsLike = [];
        let sqlLike =
            "SELECT * FROM products WHERE name LIKE ? OR bar_code LIKE ? LIMIT 1";
        paramsLike.push(`${query}%`, `${query}%`);
        const [rows] = await connection.execute<RowDataPacket[]>(
            sqlLike,
            paramsLike
        );
        connection.end();
        return rows as Product[];
    }
};

// Update an existing product
export const updateProduct = async (product: Product) => {
    const connection = await getConnection();
    const [result] = await connection.execute<ResultSetHeader>(
        "UPDATE products SET name = ?, bar_code = ?, price = ? WHERE id = ?",
        [product.name, product.bar_code, product.price, product.id]
    );
    connection.end();
    return result;
};

// Delete a product by its ID
export const deleteProduct = async (id: number) => {
    const connection = await getConnection();
    const [result] = await connection.execute<ResultSetHeader>(
        "DELETE FROM products WHERE id = ?",
        [id]
    );
    connection.end();
    return result;
};
