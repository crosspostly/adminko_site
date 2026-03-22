/**
 * Глобальный движок компонентов Админ.Ко v2026
 * Управляет темой, мобильным меню и модалками.
 * Header и Footer синхронизируются через scripts/sync-ui.js
 */

// Глобальные функции
window.toggleDarkMode = function() {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
};

window.toggleMobileMenu = function() {
    const menu = document.getElementById('mobile-menu');
    const icon = document.getElementById('mobile-menu-icon');
    if (!menu || !icon) return;
    menu.classList.toggle('hidden');
    icon.textContent = menu.classList.contains('hidden') ? 'menu' : 'close';
};

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

// Инициализация поиска в хедере
function initHeaderSearch() {
    const searchInput = document.getElementById('header-search');
    if (searchInput) {
        searchInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                const isSubfolder = window.location.pathname.includes('/blog/');
                window.location.href = (isSubfolder ? '../' : '') + 'price.html?search=' + encodeURIComponent(searchInput.value);
            }
        };
    }
}

// Применение темы и инициализация
(function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }
    
    const init = () => {
        console.log('Admin.Ko Engine: Ready');
        initHeaderSearch();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

document.addEventListener('DOMContentLoaded', function() {
    // Делегирование кликов для мессенджеров
    document.addEventListener('click', function(e) {
        if (e.target.closest('a[href^="tel:"]') || e.target.closest('a[href^="mailto:"]') || e.target.closest('a[href^="http"]')) {
            return;
        }

        const btn = e.target.closest('[data-messenger]');
        if (btn) {
            const type = btn.dataset.messenger;
            const phone = '79502767171';
            if (type === 'telegram') window.open('https://t.me/Varsmana', '_blank');
            else if (type === 'max' || type === 'wa') window.open('https://wa.me/' + phone, '_blank');
        }
    });

    // Обработка форм
    const form = document.getElementById('evaluation-form');
    if (form) {
        const submitBtn = form.querySelector('button[data-callback]');
        if (submitBtn) {
            submitBtn.onclick = async function(e) {
                e.preventDefault();
                const phoneInput = form.querySelector('input[name="phone"]');
                if (!phoneInput?.value || phoneInput.value.length < 7) {
                    alert("Пожалуйста, укажите ваш номер телефона");
                    return;
                }
                submitBtn.disabled = true;
                submitBtn.innerHTML = 'Отправка...';
                try {
                    const response = await fetch('https://formspree.io/f/mqakevve', {
                        method: 'POST',
                        body: new FormData(form),
                        headers: { 'Accept': 'application/json' }
                    });
                    if (response.ok) {
                        form.classList.add('hidden');
                        document.getElementById('form-success')?.classList.remove('hidden');
                    } else throw new Error();
                } catch (err) {
                    alert("Ошибка. Напишите в Telegram.");
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Жду звонка';
                }
            };
        }
    }
});
