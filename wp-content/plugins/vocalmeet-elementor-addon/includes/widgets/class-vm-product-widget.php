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
		return [];
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
			var productIdsArray = [];
			_.each( productIds, function( productId ) {
				productId = productId.trim();
				if ( productId ) {
					productIdsArray.push( productId );
				}
			});
			
			// Display loading state first
			_.each( productIdsArray, function( productId ) {
				#>
				<div class="vm-product-display vm-product-loading" data-product-id="{{ productId }}">
					<h3>Loading product {{ productId }}...</h3>
					<span class="price">Please wait...</span>
				</div>
				<#
			});
			
			// Fetch product data via AJAX using Elementor's context
			if ( productIdsArray.length > 0 ) {
				// Use setTimeout to ensure DOM is ready and vmEditorData is available
				var fetchProducts = function() {
					if ( typeof vmEditorData === 'undefined' ) {
						// Fallback: try again after a short delay
						setTimeout(fetchProducts, 200);
						return;
					}
					
					// Process each product ID
					_.each( productIdsArray, function( productId ) {
						findElementAndFetch(productId);
					});
					
					// Separate function to find element and fetch product
					function findElementAndFetch(productId) {
						// Try to find element with retry logic
						var findElement = function(retryCount) {
							retryCount = retryCount || 0;
							var maxRetries = 10;
							
							var productElement = null;
							
							// Method 1: Direct querySelector
							productElement = document.querySelector( '.vm-product-loading[data-product-id="' + productId + '"]' );
							
							// Method 2: Try querySelectorAll and find by data attribute
							if ( !productElement ) {
								var allElements = document.querySelectorAll( '.vm-product-loading' );
								for ( var i = 0; i < allElements.length; i++ ) {
									var elemId = allElements[i].getAttribute('data-product-id');
									if ( elemId === productId ) {
										productElement = allElements[i];
										break;
									}
								}
							}
							
							// Method 3: Try in Elementor preview iframe
							if ( !productElement && typeof elementor !== 'undefined' ) {
								var previewFrame = document.querySelector('#elementor-preview-responsive-wrapper iframe');
								if ( previewFrame && previewFrame.contentDocument ) {
									productElement = previewFrame.contentDocument.querySelector( '.vm-product-loading[data-product-id="' + productId + '"]' );
								}
							}
							
							if ( productElement ) {
								fetchAndUpdateProduct(productId, productElement);
							} else if ( retryCount < maxRetries ) {
								setTimeout(function() {
									findElement(retryCount + 1);
								}, 200);
							}
						};
						
						// Start finding
						findElement(0);
					}
					
					// Separate function to fetch and update product
					function fetchAndUpdateProduct(productId, productElement) {
						var apiUrl = vmEditorData.root + 'wc/v3/products/' + productId;
						
						// Fetch product via REST API
						fetch( apiUrl, {
							method: 'GET',
							headers: {
								'X-WP-Nonce': vmEditorData.nonce
							}
						})
						.then(function(response) {
							if ( !response.ok ) {
								return response.json().then(function(err) {
									throw new Error(err.message || 'Failed to fetch product');
								});
							}
							return response.json();
						})
						.then(function(product) {
							if ( product && product.name ) {
								var priceHtml = '';
								if ( product.regular_price ) {
									priceHtml = '<span class="woocommerce-Price-amount amount">' + 
												'<span class="woocommerce-Price-currencySymbol">$</span>' + 
												product.regular_price + 
												'</span>';
								} else if ( product.price ) {
									priceHtml = '<span class="woocommerce-Price-amount amount">' + 
												'<span class="woocommerce-Price-currencySymbol">$</span>' + 
												product.price + 
												'</span>';
								}
								
								productElement.classList.remove('vm-product-loading');
								productElement.innerHTML = 
									'<h3>' + product.name + '</h3>' +
									'<span class="price">' + priceHtml + '</span>';
							} else {
								productElement.classList.remove('vm-product-loading');
								productElement.innerHTML = 
									'<h3>Product ID: ' + productId + '</h3>' +
									'<span class="price">Product not found</span>';
							}
						})
						.catch(function(error) {
							if ( productElement ) {
								productElement.classList.remove('vm-product-loading');
								productElement.innerHTML = 
									'<h3>Product ID: ' + productId + '</h3>' +
									'<span class="price">Error: ' + (error.message || 'Failed to load') + '</span>';
							}
						});
					}
				};
				setTimeout(fetchProducts, 500);
			}
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
