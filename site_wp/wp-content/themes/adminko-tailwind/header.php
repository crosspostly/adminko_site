<!DOCTYPE html>
<html <?php language_attributes(); ?> class="scroll-smooth">
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="profile" href="https://gmpg.org/xfn/11">
    <?php wp_head(); ?>
</head>

<body <?php body_class('bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col min-h-screen transition-colors duration-300'); ?>>
<?php wp_body_open(); ?>

<nav class="bg-surface-light dark:bg-surface-dark border-b border-gray-200 dark:border-gray-800 sticky top-1.5 z-50 shadow-sm transition-colors duration-300">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-20 items-center">
            
            <div class="flex-shrink-0 flex items-center gap-3">
                <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="flex items-center gap-3 group">
                    <span class="material-symbols-outlined text-primary text-4xl group-hover:rotate-12 transition-transform">build_circle</span>
                    <span class="font-bold text-2xl tracking-tighter dark:text-white uppercase italic">
                        Админ<span class="text-primary">.Ко</span>
                    </span>
                </a>
            </div>

            <div class="hidden lg:flex flex-1 max-w-md mx-8 relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span class="material-symbols-outlined text-gray-400">search</span>
                </div>
                <form role="search" method="get" class="w-full" action="<?php echo esc_url( home_url( '/' ) ); ?>">
                    <input 
                        class="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-full leading-5 bg-gray-50 dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition duration-150 ease-in-out dark:text-white" 
                        placeholder="Что у вас сломалось?" 
                        type="search"
                        name="s"
                        id="header-search"
                        value="<?php echo get_search_query(); ?>"
                    />
                </form>
            </div>

            <div class="hidden md:flex items-center space-x-6">
                <?php
                wp_nav_menu( array(
                    'theme_location' => 'primary',
                    'container'      => false,
                    'menu_class'     => 'flex items-center space-x-6',
                    'fallback_cb'    => '__return_false',
                    'items_wrap'     => '%3$s', // Убираем <ul> обертку для Tailwind гибкости
                    'link_before'    => '<span class="text-gray-600 dark:text-gray-300 hover:text-primary font-medium transition">',
                    'link_after'     => '</span>',
                ) );
                ?>
                <!-- Кнопка переключения темы (Desktop) -->
                <button onclick="toggleDarkMode()" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors" title="Переключить тему">
                    <span class="material-symbols-outlined dark:hidden">dark_mode</span>
                    <span class="material-symbols-outlined hidden dark:block">light_mode</span>
                </button>

                <button onclick="openMessengerModal()" class="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-black rounded-full text-white bg-primary hover:bg-primary-hover transition shadow-lg shadow-primary/20 active:scale-95 uppercase tracking-widest">
                    Написать
                </button>
            </div>

            <div class="flex items-center md:hidden gap-2">
                <!-- Кнопка темы (Mobile) -->
                <button onclick="toggleDarkMode()" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
                    <span class="material-symbols-outlined dark:hidden">dark_mode</span>
                    <span class="material-symbols-outlined hidden dark:block">light_mode</span>
                </button>
                <button type="button" onclick="toggleMobileMenu()" class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none">
                    <span id="mobile-menu-icon" class="material-symbols-outlined">menu</span>
                </button>
            </div>
        </div>
    </div>
</nav>
<main class="flex-grow">
