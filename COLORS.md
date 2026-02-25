# Цветовая палитра «Админ.Ко»

## Текущая версия (v2.0)
- **Primary**: `#E50914` *(более яркий, соответствует логотипу)*
- **Primary Dark**: `#B50303`
- **Surface Light**: `#F8F9FA`
- **Surface Dark**: `#1E293B`
- **Text Light**: `#111827`
- **Text Dark**: `#F9FAFB`
- **Text Muted Light**: `#6B7280`
- **Text Muted Dark**: `#9CA3AF`
- **Success Green**: `#10B981`
- **White**: `#FFFFFF`

## История изменений
| Версия | Дата | Изменение | Причина |
|--------|------|-----------|---------|
| v1.0 | 2026-02-20 | Primary = `#D90404` | Первоначальная настройка |
| v2.0 | 2026-02-25 | Primary = `#E50914` | Соответствие логотипу и улучшение визуала |

## Жёстко закодированные стили (исправлены)
Следующие файлы содержали жёстко закодированный `#D90404` в CSS-блоках `.brand-stripe` и `.brand-stripe-thin`. Все заменены на `#E50914`:
- `site/public/about.html` (стр. 39–40)
- `site/public/business.html` (стр. 39–40)
- `site/public/cctv.html` (стр. 39–40)
- `site/public/computers.html` (стр. 39–40)
- `site/public/phones.html` (стр. 39–40)
- `site/public/price.html` (стр. 39–40)

Также исправлено:
- `site/public/index.html`: `--primary` в `<style>` → `#E50914` (стр. 14)
- `site/public/footer.html`: `bg-white` → `bg-primary` в брендовых полосах (стр. 7–8)

## Как откатить
```bash
git checkout HEAD~3 -- site/public/*.html DESIGN.md COLORS.md
```
(3 коммита: цвета, футер, жёсткие стили)