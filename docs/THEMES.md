# Looks (themes)

The family website and the admin site come in two looks. Only the look changes: every page, button and feature is the same in both.

| | Family Album | Kaveri |
|---|---|---|
| Idea | Photos as taped prints spread on the floor, Paati telling who is who | The river that flows past Erode: river mint and morning yellow |
| Page | Turmeric cream with kolam dots | Mint into sky into yellow, soft ripples at the top |
| Photos | White print, slightly tilted, held with tape | Floating rounded card |
| Fonts | Baloo Thambi 2, Kalam for handwritten notes | Plus Jakarta Sans, Noto Sans Tamil |
| Header and tabs | Solid white | Frosted glass, floating tab bar |
| Kaveri only | | "Meet your family" card deck on Home, each person's life story, Tamil months on coming birthdays |

The jasmine garland for those who have passed away, the "Made with ❤️ by SSB Software Solutions Pvt. Ltd." footer, the marigolds on the tree and every surprise are the same in both looks.

## Who sees which look

1. A visitor's own choice, made with the **Look** button at the top of the website (remembered on their phone).
2. Otherwise the look the admin chose for everyone: admin site → **Share the link** → *The look of the family website* (setting `siteTheme`).
3. Otherwise Family Album.

The admin site has its own **Look** button, which changes only the admin site on that computer; without it, the admin site follows the family website's look.

## How it works

- `frontend/src/themes.css` (copied to `admin/src/themes.css`, keep both equal) defines each look as CSS variables on `<html data-theme="album|kaveri">`: colours as RGB triplets, fonts and shadows.
- Tailwind's `album-*` colours, `font-album`, `font-hand` and the `shadow-pop*` / `shadow-soft` shadows read those variables, so components keep their classes.
- `src/lib/theme.ts` switches looks and loads only that look's Google Fonts. A small script in each `index.html` applies the saved look before the page draws, so there is no flash of the wrong look.
- Kaveri-only pieces live in `frontend/src/album/Kaveri.tsx`.

To add a look: add a block to `themes.css`, add it to `THEMES` and `THEME_FONTS` in both `theme.ts` files and both `index.html` scripts, and to `SettingsService.THEMES` in the backend.

## Contrast (WCAG 2.1)

Every text colour on its background, calculated from the values in `themes.css`. AA needs 4.5:1, AAA needs 7:1.

| Pair | Family Album | Kaveri |
|---|---|---|
| Text on page | 9.4:1 AAA | 10.6:1 AAA |
| Text on white cards | 10.6:1 AAA | 12.1:1 AAA |
| White on main buttons | 5.4:1 AA | 6.0:1 AA |
| Links on white | 5.4:1 AA | 6.0:1 AA |
| Links on page | 4.8:1 AA | 5.2:1 AA |
| White on dark buttons | 10.6:1 AAA | 12.1:1 AAA |
| Text on the turmeric/marigold highlight | 5.8:1 AA | 5.9:1 AA |
| Text on the softest tile | 5.1:1 AA | 9.0:1 AAA |
| White text on the night header | 13.3:1 AAA | 11.5:1 AAA |

Family Album's terracotta was darkened slightly (from #C4502F to #B8452A) so links on the cream page pass AA; it was 4.1:1 before.

Text sizes are unchanged: body text 17–20px, small labels at least 13px, buttons at least 48px tall. With "reduce motion" on, the Kaveri card deck and the theme menu do not animate, like every other effect on the site.

## Size

Each look loads only its own two font families, and Google sends the Tamil letters as a separate file only when Tamil text is on the page. The site's own code is about 96 KB (JavaScript) and 8 KB (CSS) gzipped for both looks together.
