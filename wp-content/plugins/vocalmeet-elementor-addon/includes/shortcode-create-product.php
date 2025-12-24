<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

class VM_Shortcode_Create_Product {

	public function __construct() {
		add_action( 'init', [ $this, 'register_shortcode' ] );
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_scripts' ] );
	}

	public function register_shortcode() {
		add_shortcode( 'vm_create_product', [ $this, 'render_shortcode' ] );
	}

	public function enqueue_scripts() {
		wp_register_script( 'vm-frontend-product', plugins_url( '../assets/js/frontend-product.js', __FILE__ ), [ 'jquery' ], '1.0.0', true );
		
		wp_localize_script( 'vm-frontend-product', 'vmData', [
			'root'  => esc_url_raw( rest_url() ),
			'nonce' => wp_create_nonce( 'wp_rest' ),
		] );
	}

	public function render_shortcode( $atts ) {
		wp_enqueue_script( 'vm-frontend-product' );
		
		ob_start();
		?>
		<div class="vm-create-product-form">
			<h3>Create New Product</h3>
			<form id="vm-product-form">
				<p>
					<label for="vm-product-name">Product Name</label>
					<input type="text" id="vm-product-name" name="name" required style="width:100%">
				</p>
				<p>
					<label for="vm-product-price">Price</label>
					<input type="number" id="vm-product-price" name="regular_price" step="0.01" required style="width:100%">
				</p>
				<p>
					<button type="submit" id="vm-product-submit">Create Product</button>
				</p>
				<div id="vm-form-message"></div>
			</form>
		</div>
		<?php
		return ob_get_clean();
	}
}

new VM_Shortcode_Create_Product();
