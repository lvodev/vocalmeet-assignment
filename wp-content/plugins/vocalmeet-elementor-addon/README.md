# Vocalmeet Elementor Addon

Addon that ties Elementor to WooCommerce. Provides a custom Elementor widget for displaying products and creating them from the editor.

## Requirements
- WordPress with WooCommerce and Elementor active (the plugin bails and shows admin notices if either is missing).
- Logged-in user with permissions to create WooCommerce products (REST calls use the current user's `X-WP-Nonce`).

## Project Structure
- `vocalmeet-elementor-addon.php` — Plugin bootstrap. Checks dependencies, registers/enqueues assets, and wires shortcode + widget registration.
- `includes/widgets/class-vm-product-widget.php` — Elementor widget:
  - Editor placeholder that lists recently created products when no ID is set.
  - Renders products by ID (comma-separated allowed) on the front end.
  - Enqueues widget-specific JS/CSS dependencies.
- `assets/js/elementor-editor.js` — Editor-only experience:
  - Replaces click-to-add with a modal to create a product.
  - Persists recent products in `localStorage`, lets you pick them, and auto-fills the widget setting.
  - Adds the widget to the canvas with the created product ID when possible.
- `assets/js/elementor-widget.js` — Frontend script for the widget; provides a simple modal-based product creator when interacting with the widget in Elementor preview.
- `assets/css/elementor-widget.css` — Basic styling for the widget placeholder and display.

## How to Run
1) Place the folder in `wp-content/plugins` and activate “Vocalmeet Elementor Addon” in wp-admin. Ensure WooCommerce + Elementor are active.
2) For the Elementor widget:
   - In the editor, search for **Vocalmeet Product**. Clicking it opens the modal to create a product; submitting adds the widget with that product ID (or lets you pick from recent products).
   - On the page, the widget renders product name and price for the ID(s) provided.
3) REST calls rely on `wp_rest` nonce; stay logged in with appropriate capabilities when creating products.

## Code Conventions
- PHP: WordPress hooks/actions, early `ABSPATH` exit guards, PascalCase classes, snake_case function names, dependency checks before bootstrapping.
- JavaScript: jQuery for frontend UI; modern vanilla JS for editor logic; REST calls use nonces and minimal validation/sanitization; preference for clear variable names and small helper functions.
- CSS: Light, component-scoped selectors prefixed with `.vm-` for widget styles.
