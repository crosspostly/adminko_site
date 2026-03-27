</main> <!-- Закрытие flex-grow из header.php -->

<footer class="bg-text-light dark:bg-black text-white py-12 mt-auto">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid md:grid-cols-4 gap-8 mb-12">
            <div>
                <div class="flex items-center gap-2 mb-4">
                    <div class="brand-stripes w-6">
                        <div class="brand-stripe bg-primary"></div>
                        <div class="brand-stripe-thin bg-primary"></div>
                    </div>
                    <span class="text-xl font-bold text-primary italic uppercase tracking-tighter">Админ.Ко</span>
                </div>
                <p class="text-gray-400 text-sm">Сервисный центр в Кемерово. <br>Честный ремонт с 2014 года.</p>
            </div>
            <div>
                <h4 class="font-semibold mb-4 uppercase tracking-widest text-xs text-gray-500">Услуги</h4>
                <ul class="space-y-2 text-gray-400 text-sm">
                    <li><a href="<?php echo esc_url( home_url( '/phones' ) ); ?>" class="hover:text-white transition-colors">Ремонт смартфонов</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/computers' ) ); ?>" class="hover:text-white transition-colors">Ремонт ноутбуков</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/other-devices' ) ); ?>" class="hover:text-white transition-colors">Другая техника</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/business' ) ); ?>" class="hover:text-white transition-colors">Для бизнеса</a></li>
                </ul>
            </div>
            <div>
                <h4 class="font-semibold mb-4 uppercase tracking-widest text-xs text-gray-500">Компания</h4>
                <ul class="space-y-2 text-gray-400 text-sm">
                    <li><a href="<?php echo esc_url( home_url( '/blog' ) ); ?>" class="text-primary font-bold hover:underline italic">Инженерный блог</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/price' ) ); ?>" class="hover:text-white transition-colors">Прайс-лист</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/about' ) ); ?>" class="hover:text-white transition-colors">О компании</a></li>
                </ul>
            </div>
            <div>
                <h4 class="font-semibold mb-4 uppercase tracking-widest text-xs text-gray-500">Контакты</h4>
                <ul class="space-y-2 text-gray-400 text-sm font-bold">
                    <li><a href="tel:+79502767171" class="hover:text-white transition-colors text-lg">+7 (950) 276-71-71</a></li>
                    <li class="text-gray-300 font-medium mt-2">Кемерово, ул. Дзержинского, 2Б</li>
                    <li class="text-[10px] text-gray-500 uppercase tracking-widest">пн-пт: 9-21, сб: 12-18</li>
                </ul>
            </div>
        </div>

        <div class="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            <div class="flex items-center gap-4">
                <p>&copy; 2014-<?php echo date('Y'); ?> АДМИН.КО <span class="ml-2 px-1.5 py-0.5 border border-gray-700 rounded opacity-50 text-[9px]">18+</span></p>
            </div>
            <div class="flex flex-wrap justify-center gap-8">
                <a href="<?php echo esc_url( home_url( '/consent' ) ); ?>" class="hover:text-primary transition-colors">Согласие</a>
                <a href="<?php echo esc_url( home_url( '/terms' ) ); ?>" class="hover:text-primary transition-colors">Условия</a>
                <a href="<?php echo esc_url( home_url( '/policy' ) ); ?>" class="hover:text-primary transition-colors">Политика</a>
            </div>
        </div>
    </div>
</footer>

<!-- Модалка ( AJAX ) -->
<div id="messenger-modal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onclick="closeMessengerModal()"></div>
    <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all scale-100 mx-4">
        <button type="button" onclick="closeMessengerModal()" class="absolute top-4 right-4 text-gray-400 hover:text-primary transition-colors">
            <span class="material-symbols-outlined text-2xl">close</span>
        </button>
        <div class="text-center mb-6">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/30 text-primary mb-4">
                <span class="material-symbols-outlined text-3xl">phone_callback</span>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2" id="modal-title">Нужен ремонт?</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm leading-tight">Оставьте номер — перезвоним за 5 минут или напишите в мессенджеры</p>
        </div>

        <div id="form-success" class="hidden text-center py-8">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/30 text-green-500 mb-4">
                <span class="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Заявка принята!</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm">Специалист свяжется с вами в течение 5 минут.</p>
        </div>

        <form id="evaluation-form" class="mb-6 space-y-4">
            <input type="text" name="name" placeholder="Ваше имя" class="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 bg-transparent focus:border-primary outline-none transition-all dark:text-white">
            <input type="tel" name="phone" placeholder="+7 (___) ___-__-__" class="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 bg-transparent focus:border-primary outline-none transition-all dark:text-white">
            <button type="button" class="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 uppercase tracking-tighter">
                <span class="material-symbols-outlined">call</span>
                Жду звонка
            </button>
        </form>

        <div class="grid grid-cols-2 gap-3">
            <button class="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-[#0088cc] hover:bg-[#0088cc]/5 transition-all">
                <span class="text-xs font-bold dark:text-white uppercase">Telegram</span>
            </button>
            <button class="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-[#0066FF] hover:bg-[#0066FF]/5 transition-all">
                <span class="text-xs font-bold dark:text-white uppercase">Max Chat</span>
            </button>
        </div>
        <div class="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
            <p class="text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-widest">Прямой номер инженера:</p>
            <a href="tel:+79502767171" class="text-xl font-black text-primary hover:text-primary-hover transition-colors tracking-tighter">+7 (950) 276-71-71</a>
        </div>
    </div>
</div>

<?php wp_footer(); ?>
</body>
</html>
