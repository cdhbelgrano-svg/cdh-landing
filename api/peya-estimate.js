export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { originLat, originLng, destinationAddressStr, destLat, destLng, peyaToken } = req.body;

    if (!originLat || !originLng || !destLat || !destLng || !peyaToken) {
        return res.status(400).json({ error: 'Faltan parámetros de origen, destino o token.' });
    }

    try {
        // Doc de Referencia: PedidosYa Courier API - Estimates
        // En Producción la base url suele ser production.
        // Pero usaremos la standard si no se especifica.
        const response = await fetch('https://courier-api.pedidosya.com/v2/estimates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': peyaToken
            },
            body: JSON.stringify({
                waypoints: [
                    {
                        type: "PICK_UP",
                        latitude: originLat,
                        longitude: originLng
                    },
                    {
                        type: "DROP_OFF",
                        addressStreet: destinationAddressStr,
                        city: "San Carlos de Bariloche", // Podemos hacerlo dinámico si llega del front
                        latitude: destLat,
                        longitude: destLng
                    }
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('PeYa Estimate Error:', data);
            return res.status(response.status).json({
                error: 'Error en la cotización de PedidosYa',
                details: data
            });
        }

        /*
        La API de PeYa suele devolver el price dentro de "deliveryOffers" u "offer".
        Estructura típica v2: { estimateId, deliveryFee, amount, ... }
        En caso de que la estructura varíe, mapeamos el valor general que nos pasen.
        */
        let estimatedPrice = null;
        if (data.estimatePrice) estimatedPrice = data.estimatePrice;
        if (data.deliveryFee) estimatedPrice = data.deliveryFee;
        if (data.amount) estimatedPrice = data.amount;
        if (data.price) estimatedPrice = data.price;

        // Asumimos un parseo básico, de lo contrario ajustaremos con el log si falla en testing
        if (estimatedPrice !== null) {
            return res.status(200).json({ price: estimatedPrice, estimateData: data });
        } else {
            return res.status(200).json({ price: data?.deliveryOffers?.[0]?.price || data.price, estimateData: data });
        }

    } catch (error) {
        console.error('Error interno estimando PeYa:', error);
        return res.status(500).json({ error: 'Fallo interno del servidor', details: error.message });
    }
}
