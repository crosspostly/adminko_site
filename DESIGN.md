# Дизайн-система «Админко»

## 1. Overview

Дизайн основан на системе **Stitch** — современный, чистый стиль с акцентом на доверие и профессионализм. Ассоциация с чистой, прозрачной лабораторией.

## 2. Color Palette

- **Primary**: #D90404 (яркий красный — брендовый цвет)
- **Primary Dark**: #B50303 (для hover-состояний)
- **Surface Light**: #F8F9FA (светлый фон секций)
- **Surface Dark**: #1E293B (тёмный фон для dark mode)
- **Text Light**: #111827 (основной текст светлой темы)
- **Text Dark**: #F9FAFB (основной текст тёмной темы)
- **Text Muted Light**: #6B7280 (вторичный текст светлой темы)
- **Text Muted Dark**: #9CA3AF (вторичный текст тёмной темы)
- **White**: #FFFFFF (белый фон)
- **Success Green**: #10B981 (для индикаторов успеха)

## 3. Typography

- **Font Family**: Inter (Google Fonts)
- **Headlines**: Inter, font-weight: 700-800
- **Body**: Inter, font-weight: 400-500
- **Base Size**: 16px
- **Scale**: 1.25 (major third)

## 4. Brand Elements

### Brand Stripes (Фирменные полосы)
Двойная красная полоса — ключевой визуальный элемент бренда:
```
.brand-stripes {
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.brand-stripe {
    height: 4px;
    background: #D90404;
    width: 100%;
}
.brand-stripe-thin {
    height: 2px;
    background: #D90404;
    width: 100%;
}
```

Применение:
- Верхняя часть страницы (sticky)
- Разделители заголовков секций
- Декоративные элементы в карточках
- Фон CTA-секции

## 5. Spacing & Layout

- **Max Container Width**: 1280px (max-w-7xl)
- **Section Padding**: py-16 (64px вертикально)
- **Container Padding**: px-4 sm:px-6 lg:px-8
- **Grid Gap**: gap-6 (24px) — gap-8 (32px)
- **Border Radius**: rounded-xl (12px), rounded-lg (8px)

## 6. Components

### Buttons
- **Primary (CTA)**: Красный фон #D90404, белый текст, скругление 8px
- **Secondary**: Белый фон, красная рамка, красный текст
- **WhatsApp**: Зелёный фон #25D366, белый текст

### Cards
- Фон: #FFFFFF (светлая тема) / #1E293B (тёмная тема)
- Тень: shadow-sm
- Скругление: rounded-xl (12px)
- Паддинг: p-6 (24px)
- Граница: border border-gray-100 (светлая) / border-gray-700 (тёмная)

### Icons
- **Library**: Material Symbols Outlined (Google Fonts)
- **Size**: text-2xl (24px) для заголовков, text-base (16px) для текста
- **Color**: text-primary или text-white

## 7. Sections Structure

### Hero
- Двухколоночный layout (текст слева, изображение справа)
- SVG polygon divider для декоративного разделения
- Brand stripes над заголовком

### Trust Stats
- 3 колонки с иконками
- Крупные цифры (3xl font)
- Описание под каждой цифрой

### Services
- Карточки с форматом "Боль → Результат"
- Красный текст для "Боли"
- Зелёный текст для "Результата"

### Team
- Фото + имя + должность
- Декоративные brand stripes в углу карточки
- Описание с цифрами

### Reviews
- 5 звёздочек
- Цитата в кавычках
- Аватар с инициалами
- Имя и должность

### CTA
- Красный фон (#D90404)
- Декоративные brand stripes на фоне (opacity 10%)
- Белый текст

## 8. Dark Mode

- Переключатель в header
- Класс .dark на html элементе
- Все цвета имеют dark: варианты
- Плавные transitions

## 9. Responsive

- Mobile-first подход
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Hero: 1 колонка на mobile, 2 на lg+
- Cards grid: 1 колонка на mobile, 3 на md+
