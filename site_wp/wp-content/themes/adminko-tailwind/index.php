<?php get_header(); ?>

<div class="max-w-7xl mx-auto px-4 py-12 md:py-24">
    <header class="mb-16">
        <h1 class="text-4xl md:text-6xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">Инженерный блог</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-4 text-xl">Разбираем сложные случаи, делимся опытом, показываем «внутрянку» ремонта.</p>
    </header>

    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>
            <article class="bg-white dark:bg-gray-800 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700 flex flex-col">
                <?php if ( has_post_thumbnail() ) : ?>
                    <div class="aspect-video overflow-hidden">
                        <?php the_post_thumbnail('large', ['class' => 'w-full h-full object-cover hover:scale-105 transition-transform duration-500']); ?>
                    </div>
                <?php endif; ?>
                <div class="p-8 flex-grow">
                    <div class="text-primary text-xs font-bold uppercase tracking-widest mb-4 italic">Кейс #<?php the_ID(); ?></div>
                    <h2 class="text-2xl font-black mb-4 text-gray-900 dark:text-white leading-tight">
                        <a href="<?php the_permalink(); ?>" class="hover:text-primary transition-colors"><?php the_title(); ?></a>
                    </h2>
                    <div class="text-gray-600 dark:text-gray-400 mb-6 line-clamp-3">
                        <?php echo get_the_excerpt(); ?>
                    </div>
                    <a href="<?php the_permalink(); ?>" class="mt-auto inline-flex items-center gap-2 text-primary font-black uppercase tracking-tighter hover:gap-4 transition-all text-sm">
                        Читать разбор <span class="material-symbols-outlined">arrow_forward</span>
                    </a>
                </div>
            </article>
        <?php endwhile; endif; ?>
    </div>

    <div class="mt-16">
        <?php the_posts_pagination(array(
            'mid_size'  => 2,
            'prev_text' => '← Назад',
            'next_text' => 'Вперед →',
            'class'     => 'flex gap-4'
        )); ?>
    </div>
</div>

<?php get_footer(); ?>
