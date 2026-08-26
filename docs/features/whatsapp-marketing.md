# WhatsApp Marketing

Purpose: personalize existing poster templates and share or download the final customer-facing card.

Share Card Background Customization:
- Compact Share & Download modal now uses business fields, preview, and background controls.
- Background presets are generic for any business category.
- Custom background color and pattern intensity update the preview live.
- Dark backgrounds switch preview/export text to readable light colors.
- Share and Download compose the selected background into the exported image.

Layout note:
- Share & Download spacing was tuned for a cleaner 3-column editor.
- The center preview now scales inside its panel without its own scrollbar.
- Preview scaling is UI-only and does not reduce download/share output quality.

Template Gallery UI:
- Template cards now use uniform outer sizing and footer alignment.
- A fixed thumbnail frame centers each poster with proportional `object-contain` fitting.
- Filter spacing and the responsive grid were polished for desktop, tablet, and mobile.

Files changed:
- `src/pages/BusinessGrowth/WhatsAppMarketing.jsx`: gallery cards, filters, modal preview card, background controls, export rendering.
- `src/constants/whatsappMarketingData.js`: neutral default business fields.

Manager summary:
The poster template stays category-specific, but the surrounding share card is business-neutral.
Owners can upload their own logo and enter business/contact details.
The downloaded/shared image now matches the preview background choices.
