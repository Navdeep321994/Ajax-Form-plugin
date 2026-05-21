jQuery(document).ready(function($) {
    $('#ajax-db-form').on('submit', function(e) {
        e.preventDefault();
        var $form = $(this);
        var $responseDiv = $('#ajax-db-form-response');
        $responseDiv.html('Sending...');
        var data = {
            action: 'ajax_db_form_submit',
            nonce: AjaxDBFormSaver.nonce,
            name: $('#adfs_name').val(),
            email: $('#adfs_email').val(),
            message: $('#adfs_message').val()
        };
        $.post(AjaxDBFormSaver.ajax_url, data, function(resp) {
            if (resp.success) {
                $responseDiv.css('color', 'green').html(resp.data.message);
                $form[0].reset();
            } else {
                $responseDiv.css('color', 'red').html(resp.data.message || 'An error occurred');
            }
        }, 'json').fail(function(xhr, status, err) {
            $responseDiv.css('color', 'red').html('Request failed: ' + err);
        });
    });
});
