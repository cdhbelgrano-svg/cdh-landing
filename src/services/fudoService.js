// src/services/fudoService.js

const CLIENT_ID = import.meta.env.VITE_FUDO_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_FUDO_CLIENT_SECRET;

const BASE_URL = '/api/fudo'; // Usamos el proxy de Vercel para evitar problemas de CORS

/**
 * Obtener el token de acceso de Fudo
 */
export const getFudoToken = async () => {
    try {
        // La URL y el payload pueden variar según la documentación exacta de Fudo.
        // Se asume un endpoint estándar para obtener tokens usando client_id y client_secret.
        const response = await fetch(`${BASE_URL}/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET
            })
        });

        if (!response.ok) {
            throw new Error(`Error al obtener token: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.token; // o data.access_token dependiendo de la respuesta
    } catch (error) {
        console.error("Error en getFudoToken:", error);
        throw error;
    }
};

/**
 * Obtener el catálogo de productos
 */
export const getCatalog = async (token) => {
    try {
        const response = await fetch(`${BASE_URL}/products`, {
            method: 'GET',
            headers: {
                'Fudo-External-App-Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error al obtener catálogo: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error en getCatalog:", error);
        throw error;
    }
};

/**
 * Obtener las categorías de productos
 */
export const getCategories = async (token) => {
    try {
        const response = await fetch(`${BASE_URL}/product-categories`, {
            method: 'GET',
            headers: {
                'Fudo-External-App-Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error al obtener categorías: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.productCategories;
    } catch (error) {
        console.error("Error en getCategories:", error);
        throw error;
    }
};

/**
 * Función helper para autenticar y traer el catálogo general sin filtrar
 */
export const fetchCatalog = async () => {
    const token = await getFudoToken();
    if (!token) throw new Error("No se pudo obtener el token de Fudo");

    const catalog = await getCatalog(token);
    return catalog;
};

/**
 * Función helper para obtener solo los productos que se mostrarán en la tienda online.
 * Considera que un producto puede heredar la visibilidad de su categoría si su valor es null.
 */
export const fetchOnlineCatalog = async () => {
    const token = await getFudoToken();
    if (!token) throw new Error("No se pudo obtener el token de Fudo");

    // Traemos tanto el catálogo como las categorías para resolver la herencia
    const [categories, catalog] = await Promise.all([
        getCategories(token),
        getCatalog(token)
    ]);

    // Creamos un diccionario rápido para saber si una categoría está habilitada online
    const categoryOnlineMap = {};
    categories.forEach(cat => {
        categoryOnlineMap[cat.id] = cat.enableOnlineMenu === true;
    });

    const onlineProducts = catalog.products.filter((product) => {
        // Si no está activo, se oculta siempre
        if (product.active !== true) return false;

        // Si tiene un valor explícito (true o false), se respeta ese valor
        if (product.enableOnlineMenu === true) return true;
        if (product.enableOnlineMenu === false) return false;

        // Si es null o indefinido (hereda según categoría), usamos el valor de su categoría
        return categoryOnlineMap[product.productCategoryId] === true;
    });

    return {
        ...catalog,
        products: onlineProducts,
        allProducts: catalog.products // Guardamos TODOS para usarlos luego como referencias de modificadores
    };
};

/**
 * Función helper para obtener las categorías de la tienda online
 */
export const fetchOnlineCategories = async () => {
    const token = await getFudoToken();
    if (!token) throw new Error("No se pudo obtener el token de Fudo");

    // Para evitar pestañas vacías, traemos el catálogo filtrado y las categorías
    const [categories, onlineCatalog] = await Promise.all([
        getCategories(token),
        fetchOnlineCatalog()
    ]);

    // Solo devolvemos las categorías que tienen al menos un producto válido online
    // y que NO sean la categoría de "Adiciones" o similares que actúan como modificadores
    const onlineCategories = categories.filter((cat) => {
        // Ignorar categorías de adiciones/modificadores
        if (cat.name && cat.name.toLowerCase().includes('adicion')) return false;

        // Verificar si tiene productos online
        return onlineCatalog.products.some(p => p.productCategoryId === cat.id);
    });

    return onlineCategories;
};

/**
 * Enviar un nuevo pedido a Fudo
 * @param {Object} orderPayload - El objeto con el formato exacto requerido por Fudo API
 */
export const createOrder = async (orderPayload) => {
    const token = await getFudoToken();
    if (!token) throw new Error("No se pudo obtener el token de Fudo");

    try {
        const response = await fetch(`${BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Fudo-External-App-Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderPayload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Fudo API Error:", errorData);
            throw new Error(`Error al crear pedido en Fudo: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error en createOrder:", error);
        throw error;
    }
};
