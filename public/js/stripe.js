import axios from 'axios';
import { showAlert } from './alert';

const stripe = Stripe(
    'pk_test_51JoghOA3dPMopDytVKvanBhJOWgkBQXVUCG5HbnDuiFNucVA8pAf1loA222zMuxB3m7FLxbJZFb6dTJntnrKDpEa00ijTEWuws'
);

export const bookTour = async (tourId) => {
    try {
        // Get checkout session from api
        const session = await axios({
            method: 'GET',
            url: `/api/v1/bookings/checkout-session/${tourId}`,
        });

        // Create checkout form
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id,
        });
    } catch (err) {
        console.log(err);
        showAlert(err, 'error');
    }
};
