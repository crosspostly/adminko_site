// Загрузка общих компонентов (header, footer)
document.addEventListener('DOMContentLoaded', function() {
    // Загрузка футера
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
        fetch('footer.html')
            .then(response => response.text())
            .then(html => {
                footerContainer.innerHTML = html;
                // Инициализация модального окна после загрузки футера
                if (typeof initMessengerModal === 'function') {
                    initMessengerModal();
                }
            })
            .catch(error => console.error('Ошибка загрузки футера:', error));
    }
});

// Инициализация модального окна мессенджеров
// Удалено: логика перенесена в footer.html для единообразия и простоты
