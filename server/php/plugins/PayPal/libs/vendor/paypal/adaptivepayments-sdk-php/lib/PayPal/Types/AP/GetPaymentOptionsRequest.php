<?php
namespace PayPal\Types\AP;
use PayPal\Core\PPMessage;
/**
 * The request to get the options of a payment request.
 */
class GetPaymentOptionsRequest extends PPMessage
{
    /**
     *
     * @access public
     * @var PayPal\Types\Common\RequestEnvelope
     */
    public $requestEnvelope;
    /**
     *
     * @access public
     * @var string
     */
    public $payKey;
    /**
     * Constructor with arguments
     */
    public function __construct($requestEnvelope = NULL, $payKey = NULL)
    {
        $this->requestEnvelope = $requestEnvelope;
        $this->payKey = $payKey;
    }
}
