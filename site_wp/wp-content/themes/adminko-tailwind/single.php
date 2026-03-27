<?php get_header(); ?>

<?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>
    <article class="max-w-4xl mx-auto px-4 py-12 md:py-24">
        <header class="mb-16 md:mb-24">
            <div class="flex items-center gap-3 text-xs font-bold text-primary uppercase tracking-widest mb-8 italic">
                <span class="px-3 py-1 bg-primary/10 rounded-full border border-primary/20">Инженерный кейс</span>
                <span class="text-gray-400">Лаборатория Админ.Ко</span>
            </div>
            <h1 class="text-4xl md:text-7xl font-black mb-10 leading-tight tracking-tighter text-gray-900 dark:text-white uppercase italic">
                <?php the_title(); ?>
            </h1>
            <div class="flex items-center gap-6 text-gray-500 text-sm font-bold uppercase tracking-widest">
                <span><?php echo get_the_date(); ?></span>
                <span class="w-1.5 h-1.5 bg-primary rounded-full"></span>
                <span>Кемерово</span>
            </div>
        </header>

        <?php if ( has_post_thumbnail() ) : ?>
            <div class="mb-16 rounded-[3rem] overflow-hidden shadow-2xl">
                <?php the_post_thumbnail('full', ['class' => 'w-full h-auto']); ?>
            </div>
        <?php endif; ?>

        <div class="prose prose-lg lg:prose-xl dark:prose-invert max-w-none bg-white dark:bg-gray-800 p-8 md:p-16 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-gray-700">
            <?php the_content(); ?>
        </div>

        <!-- Блок «Спросите инженера» (CTA) -->
        <div class="mt-20 mb-16 p-8 md:p-16 bg-primary rounded-[4rem] shadow-2xl shadow-primary/30 text-center relative overflow-hidden group">
            <div class="relative z-10">
                <h2 class="text-4xl md:text-5xl font-black mb-6 text-white uppercase italic tracking-tighter">Спросите инженера</h2>
                <p class="mb-10 text-white/95 text-xl md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed">Диагностика в «Админ.Ко» всегда 0₽. Опишите проблему, и мы назовем цену ремонта за 5 минут.</p>
                <div class="flex justify-center">
                    <button onclick="openMessengerModal()" class="bg-white text-primary px-12 py-6 rounded-3xl font-black text-2xl hover:scale-105 transition-all shadow-2xl active:scale-95 flex items-center gap-4 uppercase tracking-widest">
                        <span class="material-symbols-outlined text-3xl">chat</span>
                        Бесплатная консультация
                    </button>
                </div>
            </div>
            <span class="material-symbols-outlined absolute -right-12 -bottom-12 text-[20rem] text-white/10 rotate-12 pointer-events-none">build_circle</span>
        </div>
    </article>
<?php endwhile; endif; ?>

<?php get_footer(); ?>
