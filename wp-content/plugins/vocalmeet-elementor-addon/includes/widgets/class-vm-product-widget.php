<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

class Vocalmeet_Product_Widget extends \Elementor\Widget_Base {

	public function get_name() {
		return 'vocalmeet_product_widget';
	}

	public function get_title() {
		return esc_html__( 'Vocalmeet Product', 'vocalmeet-elementor-addon' );
	}

	public function get_icon() {
		return 'eicon-products';
	}

	public function get_categories() {
		return [ 'general' ];
	}

	public function get_script_depends() {
		return [ 'vm-elementor-widget' ];
	}

	public function get_style_depends() {
		return [ 'vm-elementor-widget' ];
	}

	protected function register_controls() {
		$this->start_controls_section(
			'content_section',
			[
				'label' => esc_html__( 'Content', 'vocalmeet-elementor-addon' ),
				'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
			]
		);

		$this->add_control(
			'product_id',
			[
				'label' => esc_html__( 'Product ID', 'vocalmeet-elementor-addon' ),
				'type' => \Elementor\Controls_Manager::TEXT,
				'input_type' => 'text',
				'placeholder' => esc_html__( 'Product ID', 'vocalmeet-elementor-addon' ),
			]
		);

		$this->end_controls_section();
	}

	protected function render() {
		$settings = $this->get_settings_for_display();
		$product_id = $settings['product_id'];

		if ( empty( $product_id ) ) {
			if ( \Elementor\Plugin::$instance->editor->is_edit_mode() ) {
				// Show recent products list in editor
				echo '<div class="vm-widget-placeholder vm-product-selector" data-widget-id="' . esc_attr( $this->get_id() ) . '">';
				echo '<h4 style="margin:0 0 15px 0;font-size:14px;">Select a Product</h4>';
				echo '<div class="vm-recent-products-list" style="max-height:300px;overflow-y:auto;">';
				echo '<p style="color:#666;font-size:12px;margin:0;">Loading recent products...</p>';
				echo '</div>';
				echo '</div>';
			}
			return;
		}

		// loop product ids
		$product_ids = explode(',', $product_id);
		foreach ( $product_ids as $product_id ) {
			$product = wc_get_product( $product_id );
			if ( $product ) {
				?>
				<div class="vm-product-display">
					<h3><?php echo esc_html( $product->get_name() ); ?></h3>
					<span class="price"><?php echo $product->get_price_html(); ?></span>
				</div>
				<?php
			}
		}

	}

	protected function content_template() {
		?>
		<#
		if ( settings.product_id ) {
			// Split product IDs by comma and loop through them (same as render method)
			var productIds = settings.product_id.split(',');
			_.each( productIds, function( productId ) {
				productId = productId.trim();
				if ( productId ) {
					#>
					<div class="vm-product-display">
						<h3>Product ID: {{ productId }}</h3>
						<span class="price">(Save to view product details)</span>
					</div>
					<#
				}
			});
		} else {
			#>
			<div class="vm-widget-placeholder vm-product-selector">
				<h4 style="margin:0 0 15px 0;font-size:14px;">Select a Product</h4>
				<div class="vm-recent-products-list" style="max-height:300px;overflow-y:auto;">
					<p style="color:#666;font-size:12px;margin:0;">Loading recent products...</p>
				</div>
			</div>
			<#
		}
		#>
		<?php
	}
}
