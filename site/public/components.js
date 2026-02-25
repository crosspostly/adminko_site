// Загрузка общих компонентов (header, footer)
document.addEventListener('DOMContentLoaded', function() {
    // Загрузка футера
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
        fetch('footer.html')
            .then(response => response.text())
            .then(html => {
                footerContainer.innerHTML = html;

                // === Инициализация модального окна мессенджеров ===
                // Глобальные функции
                window.openMessengerModal = function() {
                    const modal = document.getElementById('messenger-modal');
                    if (modal) {
                        modal.classList.remove('hidden');
                        document.body.style.overflow = 'hidden';
                    }
                };

                window.closeMessengerModal = function() {
                    const modal = document.getElementById('messenger-modal');
                    if (modal) {
                        modal.classList.add('hidden');
                        document.body.style.overflow = '';
                    }
                };

                // Обработчик Escape
                document.addEventListener('keydown', function(e) {
                    if (e.key === 'Escape') {
                        closeMessengerModal();
                    }
                });

                // Обработчики кнопок мессенджеров
                const messengerButtons = document.querySelectorAll('[data-messenger]');
                messengerButtons.forEach(btn => {
                    btn.addEventListener('click', function() {
                        const messenger = this.dataset.messenger;
                        const form = document.getElementById('evaluation-form');
                        if (!form) return;

                        const formData = new FormData(form);
                        const name = formData.get('name') || 'Аноним';
                        const phone = formData.get('phone') || '';
                        const desc = formData.get('description') || 'Без описания';

                        // Очищаем телефон от символов
                        const cleanPhone = phone.replace(/\D/g, '');

                        // Формируем текст
                        const text = encodeURIComponent(
                            `Здравствуйте! Меня зовут ${name}.\n` +
                            `Телефон: ${phone}\n` +
                            `Проблема: ${desc}\n` +
                            `— Заявка с сайта admin-ko.ru (оценка за 5 минут)`
                        );

                        let url;
                        if (messenger === 'telegram') {
                            url = `https://t.me/+${cleanPhone}?text=${text}`;
                        } else if (messenger === 'max') {
                            url = `max://chat?phone=${cleanPhone}&text=${text}`;
                        }

                        if (url) {
                            window.open(url, '_blank');
                            closeMessengerModal();
                        }
                    });
                });

                // Убедимся, что кнопки openMessengerModal работают
                // (если они уже существуют в DOM до загрузки футера)
                const triggerButtons = document.querySelectorAll('[onclick*="openMessengerModal"]');
                triggerButtons.forEach(btn => {
                    btn.onclick = function(e) {
                        e.preventDefault();
                        openMessengerModal();
                    };
                });
            })
            .catch(error => console.error('Ошибка загрузки футера:', error));
    }
});