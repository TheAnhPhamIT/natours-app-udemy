import axios from 'axios';
import { showAlert } from './alert';

export const login = async (email, password) => {
    try {
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/login',
            data: { email, password },
        });

        if (res.data.status === 'success') {
            showAlert('Logged in successfully!');

            setTimeout(() => {
                location.assign('/');
            }, 1500);
        }
    } catch (err) {
        showAlert(err.response.data.message, 'error');
    }
};

export const logout = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url: '/api/v1/users/logoutForWeb',
        });

        if (res.data.status === 'success') {
            showAlert('Logged out successfully!');

            setTimeout(() => location.reload(true), 1000);
        }
    } catch (err) {
        console.log(err.response.data.message);
        showAlert('Error! Please try logout again', 'error');
    }
};
