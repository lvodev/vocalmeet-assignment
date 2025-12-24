<?php
/**
 * Plugin Name: Vocalmeet Elementor Addon
 * Description: Adds WooCommerce product creation functionality and a custom Elementor widget.
 * Version: 1.0.0
 * Author: Lam Vo
 * Text Domain: vocalmeet-elementor-addon
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

final class Vocalmeet_Elementor_Addon {

	const VERSION = '1.0.0';

	private static $_instance = null;

	public static function instance() {
		if ( is_null( self::$_instance ) ) {
			self::$_instance = new self();
		}
		return self::$_instance;
	}

	public function __construct() {
		add_action( 'plugins_loaded', [ $this, 'init' ] );
	}

	public function init() {
		// Check for WooCommerce
		if ( ! class_exists( 'WooCommerce' ) ) {
			add_action( 'admin_notices', [ $this, 'admin_notice_missing_woocommerce' ] );
			return;
		}

		// Check for Elementor
		if ( ! did_action( 'elementor/loaded' ) ) {
			add_action( 'admin_notices', [ $this, 'admin_notice_missing_elementor' ] );
			return;
		}

		// Register styles
		add_action( 'elementor/frontend/after_register_styles', [ $this, 'register_widget_styles' ] );
		
		// Register editor scripts to prevent click-to-add
		add_action( 'elementor/editor/after_enqueue_scripts', [ $this, 'enqueue_editor_scripts' ] );

		// Include requires
		$this->includes();
	}

	public function register_widget_styles() {
		wp_register_style( 'vm-elementor-widget', plugins_url( 'assets/css/elementor-widget.css', __FILE__ ), [], '1.0.0' );
	}

	public function enqueue_editor_scripts() {
		wp_enqueue_script(
			'vm-elementor-editor',
			plugins_url( 'assets/js/elementor-editor.js', __FILE__ ),
			[ 'jquery', 'elementor-editor' ],
			'1.0.0',
			true
		);
		
		wp_localize_script( 'vm-elementor-editor', 'vmEditorData', [
			'root'  => esc_url_raw( rest_url() ),
			'nonce' => wp_create_nonce( 'wp_rest' ),
		] );
	}

	public function admin_notice_missing_woocommerce() {
		if ( isset( $_GET['activate'] ) ) unset( $_GET['activate'] );
		$message = sprintf(
			/* translators: 1: Plugin name 2: Dependency */
			esc_html__( '"%1$s" requires "%2$s" to be installed and activated.', 'vocalmeet-elementor-addon' ),
			'<strong>' . esc_html__( 'Vocalmeet Elementor Addon', 'vocalmeet-elementor-addon' ) . '</strong>',
			'<strong>' . esc_html__( 'WooCommerce', 'vocalmeet-elementor-addon' ) . '</strong>'
		);
		printf( '<div class="notice notice-warning is-dismissible"><p>%s</p></div>', $message );
	}

	public function admin_notice_missing_elementor() {
		if ( isset( $_GET['activate'] ) ) unset( $_GET['activate'] );
		$message = sprintf(
			/* translators: 1: Plugin name 2: Dependency */
			esc_html__( '"%1$s" requires "%2$s" to be installed and activated.', 'vocalmeet-elementor-addon' ),
			'<strong>' . esc_html__( 'Vocalmeet Elementor Addon', 'vocalmeet-elementor-addon' ) . '</strong>',
			'<strong>' . esc_html__( 'Elementor', 'vocalmeet-elementor-addon' ) . '</strong>'
		);
		printf( '<div class="notice notice-warning is-dismissible"><p>%s</p></div>', $message );
	}

	private function includes() {
		add_action( 'elementor/widgets/register', function( $widgets_manager ) {
			require_once( __DIR__ . '/includes/widgets/class-vm-product-widget.php' );
			$widgets_manager->register( new \Vocalmeet_Product_Widget() );
		} );
	}
}

Vocalmeet_Elementor_Addon::instance();
