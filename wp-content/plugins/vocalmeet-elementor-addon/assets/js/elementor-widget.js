jQuery(window).on('elementor/frontend/init', function() {
    elementorFrontend.hooks.addAction('frontend/element_ready/vocalmeet_product_widget.default', function($scope, $) {
        var $btn = $scope.find('.vm-create-product-btn-editor');

        if (!$btn.length) {
            return;
        }

        $btn.on('click', function(e) {
            e.preventDefault();

            // Simple custom modal structure
            var modalHtml = `
                <div id="vm-product-modal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:center;justify-content:center;">
                    <div style="background:#fff;padding:20px;border-radius:5px;width:300px;box-shadow:0 2px 10px rgba(0,0,0,0.2);">
                        <h3>Create Product</h3>
                        <input type="text" id="vm-modal-name" placeholder="Product Name" style="width:100%;margin-bottom:10px;padding:5px;">
                        <input type="number" id="vm-modal-price" placeholder="Price" step="0.01" style="width:100%;margin-bottom:10px;padding:5px;">
                        <div style="text-align:right;">
                            <button id="vm-modal-cancel" style="margin-right:10px;cursor:pointer;">Cancel</button>
                            <button id="vm-modal-create" style="background:#0073aa;color:#fff;border:none;padding:5px 10px;cursor:pointer;">Create</button>
                        </div>
                    </div>
                </div>
            `;

            $('body').append(modalHtml);

            var $modal = $('#vm-product-modal');

            // Focus first input
            $modal.find('#vm-modal-name').focus();

            // Cancel
            $modal.find('#vm-modal-cancel').on('click', function() {
                $modal.remove();
            });

            // Create
            $modal.find('#vm-modal-create').on('click', function() {
                var name = $('#vm-modal-name').val();
                var price = $('#vm-modal-price').val();
                var $createBtn = $(this);

                if (!name || !price) {
                    alert('Please fill in all fields.');
                    return;
                }

                $createBtn.text('Creating...').prop('disabled', true);

                $.ajax({
                    url: vmWidgetData.root + 'wc/v3/products',
                    method: 'POST',
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('X-WP-Nonce', vmWidgetData.nonce);
                    },
                    data: {
                        name: name,
                        regular_price: price,
                        type: 'simple',
                        status: 'publish'
                    },
                    success: function(response) {
                        $modal.remove();
                        alert('Product Created: ' + response.name + ' (ID: ' + response.id + ')');

                        // Update Elementor Widget Setting
                        // We need to find the model associated with this element
                        // In the editor, $scope is the widget wrapper
                        var modelId = $scope.data('id');
                        
                        if ( window.elementor ) {
                            // Elementor V2/V3 Editor API
                            // This is a bit tricky, we need to set the setting "product_id"
                            // The best way is to trigger a change in the settings view if we can acces it,
                             // or use the command API.
                             
                             // Try to find the container
                             var container = elementor.getContainer( modelId );
                             if( container ) {
                                 // Update settings
                                 container.settings.setExternalChange( 'product_id', response.id );
                                 // container.render(); // Usually automatic
                             }
                        }
                    },
                    error: function(response) {
                        $createBtn.text('Create').prop('disabled', false);
                        var msg = 'Error creating product.';
                        if(response.responseJSON && response.responseJSON.message) {
                            msg += '\n' + response.responseJSON.message;
                        }
                        alert(msg);
                    }
                });
            });
        });
    });
});
