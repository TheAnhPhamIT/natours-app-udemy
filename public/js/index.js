import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateUserData } from './updateSettings';
import { bookTour } from './stripe';
import Tour from '../../models/tourModel';

// DOM ELEMENTS
const mapEle = document.getElementById('map');
const formEle = document.querySelector('.form.form--login');
const logoutBtn = document.querySelector('.nav__el.nav__el--logout');
const formUpdateUser = document.querySelector('.form.form-user-data');
const formPassword = document.querySelector('.form.form-password');
const bookTourBtn = document.querySelector('.btn#book-tour-btn');

// DELEGATION
if (mapEle) {
    const locations = JSON.parse(mapEle.dataset.locations);
    displayMap(locations);
}

if (formEle) {
    formEle.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.querySelector('#email').value;
        const password = document.querySelector('#password').value;

        login(email, password);
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
}

if (formUpdateUser) {
    formUpdateUser.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('email', document.querySelector('#email').value);
        formData.append('name', document.querySelector('#name').value);
        formData.append('photo', document.querySelector('#photo').files[0]);

        updateUserData(formData, 'data');
    });
}

if (formPassword) {
    formPassword.addEventListener('submit', async (e) => {
        try {
            e.preventDefault();
            const currentPasswordInput =
                document.querySelector('#password-current');
            const newPasswordInput = document.querySelector('#password');
            const confirmPasswordInput =
                document.querySelector('#password-confirm');
            const savePasswordBtn = document.querySelector(
                '.btn.btn-save-password'
            );

            savePasswordBtn.textContent = 'Uploading...';

            const currentPassword = currentPasswordInput.value;
            const newPassword = newPasswordInput.value;
            const passwordConfirm = confirmPasswordInput.value;

            await updateUserData(
                { currentPassword, newPassword, passwordConfirm },
                'password'
            );
            currentPassword.value = '';
            newPasswordInput.value = '';
            confirmPasswordInput.value = '';
            savePasswordBtn.textContent = 'Save password';
        } catch (err) {
            console.log(err);
            document.querySelector('.btn.btn-save-password').textContent =
                'Save password';
        }
    });
}

if (bookTourBtn) {
    bookTourBtn.addEventListener('click', (e) => {
        const { tourId } = e.target.dataset;

        bookTour(tourId);
    });
}
