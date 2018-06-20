     // Extended load, when there's no event delegation support for any plugins...
     function xload(is_after_ajax) {
         var so = (is_after_ajax) ? ':not(.xltriggered)' : '';
         // minor selector optimization
         // https://github.com/stripe/jquery.payment ..
         $('[data-numeric]' + so).payment('restrictNumeric').addClass('xltriggered');
         $('.cc-number' + so).payment('formatCardNumber').addClass('xltriggered');
         $('.cc-exp' + so).payment('formatCardExpiry').addClass('xltriggered');
         $('.cc-cvc' + so).payment('formatCardCVC').addClass('xltriggered');

         // When user selects the gateway in radio, show appropriate form tmp (buyer form or CC form, etc)...
         // <input type="radio" class="js-gateway" data-form-tpl="buyer,credit_card" name="gateway_id" id="sudopay_gateway_2_1" value="2" checked="checked"/>
         $('.js-gateway' + so).on('click', function(e) {
             var $this = $(this);
             // hide all form tpls & disable fieldsets
             // Note:
             //   To avoid "An invalid form control with name='' is not focusable" error in Chrome & error in submission...
             //   had to wrap in disabled fieldset as per https://code.google.com/p/chromium/issues/detail?id=45640#c13
             var $closest_form = $this.closest('form');
             $('.js-form-tpl', $closest_form).hide().find('fieldset').prop('disabled', true);
             // form tpls to show with in closest form...
             var form_tpls = $this.data('form-tpl').split(',');
             if (form_tpls.length == 2 && form_tpls[1] == "credit_card") {
                 $this.parent("div").addClass("hide");
             }
             for (var i = 0, len = form_tpls.length; i < len; ++i) {
                 $('.js-form-tpl-' + form_tpls[i], $closest_form).show().find('fieldset').prop('disabled', false);
             }

             // for manual instruction...
             // hide all first...
             $('.js-manual-instruction', $closest_form).hide();
             // show relevant...
             $('#manual_instruction_' + this.id.substring("sudopay_gateway_".length)).show();
         }).addClass('xltriggered');
         // Note: had to keep in onload...
         // trigger first sub option on selecting parent tab...
         // <a data-toggle="tab" href="#gateways-5346-1">...</a>
         $('a[data-toggle="tab"]' + so).on('show', function(e) {
             $(this.hash).find('input:radio:first').trigger('click');
         }).addClass('xltriggered');
         // for first time loading of active tab...
         $('div.tab-pane' + so).addClass('xltriggered').filter('.active').find('input:radio:first').trigger('click');

     }

     var $dc = $(document);
     $dc.ready(function($) {
			xload(false);
         })
         // Validate CC form on submit...
         .on('submit', 'form.js-payment', function(e) {
             var $this = $(this);
             var cardType = $.payment.cardType($this.find('.cc-number').val());
             $this.find('.cc-number').filter(':visible').toggleClass('error', !$.payment.validateCardNumber($this.find('.cc-number').val()));
             $this.find('.cc-exp').filter(':visible').toggleClass('error', !$.payment.validateCardExpiry($this.find('.cc-exp').payment('cardExpiryVal')));
             $this.find('.cc-cvc').filter(':visible').toggleClass('error', !$.payment.validateCardCVC($this.find('.cc-cvc').val(), cardType));
             $this.find('.card_name').filter(':visible').toggleClass('error', ($this.find('.card_name').val().trim().length === 0));
             // for non-cc *HTML5* fields check for :invalid...
             return ($this.find('.error, :invalid').filter(':visible').length === 0);
         }).ajaxStop(function() {
             xload(true);
         });