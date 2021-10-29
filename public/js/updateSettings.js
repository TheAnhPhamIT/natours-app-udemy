import axios from 'axios';
import { showAlert } from './alert';

export const updateUserData = async (data, type = 'data') => {
    try {
        let url = '';
        if (type === 'data') url = '/api/v1/users/updateMe';
        if (type === 'password') url = '/api/v1/users/updateMyPassword';

        const res = await axios({
            method: 'PATCH',
            url,
            data: data,
        });

        if (res.data.status === 'success') {
            showAlert(`${type.toUpperCase()} updated successfully`);
            window.setTimeout(location.reload(true), 1500);
        }
    } catch (err) {
        showAlert(err.response.data.message, 'error');
    }
};
