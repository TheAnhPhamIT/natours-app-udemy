export const hideAlert = () => {
    const el = document.querySelector('.alert');
    if (el) el.parentElement.removeChild(el);
};

export const showAlert = (message, type = 'success', timeout = 5) => {
    hideAlert();
    const markup = `<div class="alert alert--${type}">${message}</div>`;
    document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
    window.setTimeout(hideAlert, timeout * 1000);
};
