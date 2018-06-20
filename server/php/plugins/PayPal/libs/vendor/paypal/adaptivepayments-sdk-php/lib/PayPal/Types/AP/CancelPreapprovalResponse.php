<?php
namespace PayPal\Types\AP;
use PayPal\Core\PPMessage;
/**
 * The result of the CancelPreapprovalRequest.
 */
class CancelPreapprovalResponse extends PPMessage
{
    /**
     *
     * @access public
     * @var PayPal\Types\Common\ResponseEnvelope
     */
    public $responseEnvelope;
    /**
     *
     * @array
     * @access public
     * @var PayPal\Types\Common\ErrorData
     */
    public $error;
}
