jQuery(document).ready(function($) {
    $('#vm-product-form').on('submit', function(e) {
        e.preventDefault();

        var name = $('#vm-product-name').val();
        var price = $('#vm-product-price').val();
        var $submitBtn = $('#vm-product-submit');
        var $message = $('#vm-form-message');

        $submitBtn.prop('disabled', true).text('Creating...');
        $message.html('').removeClass('vm-success vm-error');

        $.ajax({
            url: vmData.root + 'wc/v3/products',
            method: 'POST',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('X-WP-Nonce', vmData.nonce);
            },
            data: {
                name: name,
                regular_price: price,
                type: 'simple',
                status: 'publish' // Or 'draft' depending on preference
            },
            success: function(response) {
                $submitBtn.prop('disabled', false).text('Create Product');
                $message.html('<p style="color:green;">Product created successfully! ID: ' + response.id + '</p>').addClass('vm-success');
                $('#vm-product-form')[0].reset();
            },
            error: function(response) {
                $submitBtn.prop('disabled', false).text('Create Product');
                var errorMsg = 'Error creating product.';
                if (response.responseJSON && response.responseJSON.message) {
                    errorMsg += ' ' + response.responseJSON.message;
                }
                $message.html('<p style="color:red;">' + errorMsg + '</p>').addClass('vm-error');
            }
        });
    });
});
